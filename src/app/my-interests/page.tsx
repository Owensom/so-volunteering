import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type InterestRow = {
  id: string;
  opportunity_id: string;
  organisation_user_id: string;
  message: string | null;
  status: string;
  created_at: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  summary: string;
  location_type: string;
  location: string | null;
  time_commitment: string | null;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function formatStatus(status: string) {
  if (status === "reviewed") return "Reviewed";
  if (status === "contacted") return "Contacted";
  if (status === "closed") return "Closed";
  return "New";
}

function statusIcon(status: string) {
  if (status === "reviewed") return "👀";
  if (status === "contacted") return "📬";
  if (status === "closed") return "✅";
  return "🌱";
}

function statusHelp(status: string) {
  if (status === "reviewed") {
    return "The organisation has reviewed your interest.";
  }

  if (status === "contacted") {
    return "The organisation has marked this as contacted.";
  }

  if (status === "closed") {
    return "This interest has been closed by the organisation.";
  }

  return "Your interest has been sent and is waiting to be reviewed.";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

export default async function MyInterestsPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  const { data: interests } = await supabase
    .from("opportunity_interests")
    .select("id,opportunity_id,organisation_user_id,message,status,created_at")
    .eq("volunteer_user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (interests as InterestRow[] | null) ?? [];
  const opportunityIds = Array.from(
    new Set(rows.map((row) => row.opportunity_id))
  );

  const { data: opportunities } = opportunityIds.length
    ? await supabase
        .from("opportunities")
        .select(
          "id,title,summary,location_type,location,time_commitment,status,contact_name,contact_email"
        )
        .in("id", opportunityIds)
    : { data: [] as OpportunityRow[] };

  const opportunityMap = new Map(
    ((opportunities as OpportunityRow[] | null) ?? []).map((opportunity) => [
      opportunity.id,
      opportunity
    ])
  );

  const newCount = rows.filter((row) => row.status === "new").length;
  const reviewedCount = rows.filter((row) => row.status === "reviewed").length;
  const contactedCount = rows.filter((row) => row.status === "contacted").length;
  const closedCount = rows.filter((row) => row.status === "closed").length;

  const listenText =
    "This is your Roles I am interested in page. It shows volunteering roles where you clicked I am interested. Each card shows the role, the current status, your optional message, and a link back to the opportunity. Statuses can be new, reviewed, contacted or closed.";

  return (
    <main className="dashboard-bg">
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/dashboard"
            className="dashboard-brand"
            aria-label="Back to SO Volunteering dashboard"
          >
            <img
              src="/brand/so-volunteering-logo-mark.png"
              alt=""
              className="dashboard-brand-mark"
              aria-hidden="true"
            />
            <span className="dashboard-brand-text">
              <span className="dashboard-brand-name">SO Volunteering</span>
              <span className="dashboard-brand-tagline">
                Belong • Grow • Thrive
              </span>
            </span>
          </Link>

          <div className="dashboard-topbar-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href="/dashboard"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Dashboard</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="my-interests-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Your volunteering roles</p>

            <h1 id="my-interests-title" className="dashboard-title">
              <span aria-hidden="true">📬</span>
              <span>Roles I am interested in</span>
            </h1>

            <p className="dashboard-lead">
              Track the roles where you clicked “I’m interested”. You can see
              whether an organisation has reviewed or updated each role.
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/opportunities"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🔎</span>
                  <span>Find opportunities</span>
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🏠</span>
                  <span>Dashboard</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Role interest status">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Role status</h2>
                <p>
                  {rows.length} role{rows.length === 1 ? "" : "s"} saved.
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              New: <strong>{newCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Reviewed: <strong>{reviewedCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Contacted: <strong>{contactedCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Closed: <strong>{closedCount}</strong>
            </p>
          </aside>
        </section>

        {rows.length === 0 ? (
          <section className="dashboard-grid" aria-label="No roles of interest">
            <article className="info-card dashboard-pathway-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                🌱
              </div>

              <div className="dashboard-card-copy">
                <p className="dashboard-card-label">No roles yet</p>
                <h2>No roles saved</h2>
                <p>
                  When you click “I’m interested” on a volunteering role, it will
                  appear here.
                </p>
                <p className="card-action">
                  <Link href="/opportunities" className="text-link">
                    Browse opportunities
                  </Link>
                </p>
              </div>
            </article>
          </section>
        ) : (
          <section
            className="dashboard-grid my-interests-grid"
            aria-label="Roles I am interested in"
          >
            {rows.map((interest) => {
              const opportunity = opportunityMap.get(interest.opportunity_id);
              const canOpenOpportunity = opportunity?.status === "published";

              return (
                <article
                  key={interest.id}
                  className="info-card dashboard-pathway-card my-interest-card"
                >
                  <div
                    className="dashboard-card-icon my-interest-icon"
                    aria-hidden="true"
                  >
                    {statusIcon(interest.status)}
                  </div>

                  <div className="dashboard-card-copy my-interest-copy">
                    <div className="my-interest-main">
                      <p className="dashboard-card-label">
                        {formatStatus(interest.status)}
                      </p>

                      <h2>{opportunity?.title || "Opportunity"}</h2>

                      {opportunity?.summary ? (
                        <p>{opportunity.summary}</p>
                      ) : (
                        <p className="dashboard-muted-action">
                          This opportunity could not be loaded.
                        </p>
                      )}

                      <div className="my-interest-status-panel">
                        <p>
                          <strong>{formatStatus(interest.status)}</strong>
                        </p>
                        <p>{statusHelp(interest.status)}</p>
                      </div>

                      {opportunity ? (
                        <p className="dashboard-muted-action">
                          {formatLocationType(opportunity.location_type)}
                          {opportunity.location
                            ? ` · ${opportunity.location}`
                            : ""}
                          {opportunity.time_commitment
                            ? ` · ${opportunity.time_commitment}`
                            : ""}
                        </p>
                      ) : null}

                      {interest.message ? (
                        <div className="my-interest-message">
                          <p className="dashboard-card-label">Your message</p>
                          <p>{interest.message}</p>
                        </div>
                      ) : null}

                      {opportunity?.contact_name || opportunity?.contact_email ? (
                        <div className="my-interest-message">
                          <p className="dashboard-card-label">Role contact</p>
                          {opportunity.contact_name ? (
                            <p>{opportunity.contact_name}</p>
                          ) : null}
                          {opportunity.contact_email ? (
                            <p>{opportunity.contact_email}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <p className="card-action my-interest-action">
                      {canOpenOpportunity ? (
                        <Link
                          href={`/opportunities/${interest.opportunity_id}`}
                          className="text-link"
                        >
                          Open opportunity
                        </Link>
                      ) : (
                        <span className="dashboard-muted-action">
                          Opportunity not currently public
                        </span>
                      )}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>

      <style>{`
        .my-interests-grid {
          align-items: stretch;
        }

        .my-interest-card {
          min-height: 280px;
          height: 100%;
          align-items: stretch;
        }

        .my-interest-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .my-interest-main {
          display: grid;
          gap: 10px;
        }

        .my-interest-main h2 {
          margin-bottom: 0;
        }

        .my-interest-main p {
          margin: 0;
        }

        .my-interest-status-panel {
          display: grid;
          gap: 4px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
          color: #5d6677;
        }

        .my-interest-message {
          display: grid;
          gap: 6px;
          color: #5d6677;
        }

        .my-interest-action {
          margin-top: auto !important;
        }

        @media (max-width: 640px) {
          .my-interest-card {
            min-height: 0;
          }

          .my-interest-copy {
            gap: 14px;
          }

          .my-interest-status-panel {
            border-radius: 16px;
          }
        }
      `}</style>
    </main>
  );
}
