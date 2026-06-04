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
  volunteer_name: string | null;
  volunteer_email: string | null;
  volunteer_city: string | null;
  volunteer_goals: string[] | null;
  volunteer_interests: string[] | null;
  volunteer_skills: string[] | null;
  volunteer_support_shared: boolean | null;
  volunteer_support_needs: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  status: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function ChipList({
  values,
  emptyText
}: {
  values: string[] | null | undefined;
  emptyText: string;
}) {
  if (!Array.isArray(values) || values.length === 0) {
    return <p className="dashboard-muted-action">{emptyText}</p>;
  }

  return (
    <div className="interest-inbox-chip-list">
      {values.slice(0, 4).map((value) => (
        <span key={value} className="interest-inbox-chip">
          {value}
        </span>
      ))}
      {values.length > 4 ? (
        <span className="interest-inbox-chip">+{values.length - 4} more</span>
      ) : null}
    </div>
  );
}

function formatStatus(status: string) {
  if (status === "reviewed") return "Reviewed";
  if (status === "contacted") return "Contacted";
  if (status === "closed") return "Closed";
  return "New";
}

export default async function OrganisationInterestsPage() {
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

  if (userType !== "organisation") {
    redirect("/dashboard");
  }

  const { data: interests } = await supabase
    .from("opportunity_interests")
    .select(
      "id,opportunity_id,volunteer_name,volunteer_email,volunteer_city,volunteer_goals,volunteer_interests,volunteer_skills,volunteer_support_shared,volunteer_support_needs,message,status,created_at"
    )
    .eq("organisation_user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (interests as InterestRow[] | null) ?? [];
  const opportunityIds = Array.from(
    new Set(rows.map((row) => row.opportunity_id))
  );

  const { data: opportunities } = opportunityIds.length
    ? await supabase
        .from("opportunities")
        .select("id,title,status")
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
    "This is the organisation interest inbox. It shows volunteers who have expressed interest in your opportunities. Each card opens a full detail page where you can review the volunteer and update the interest status.";

  return (
    <main className="dashboard-bg">
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/organisation/dashboard"
            className="dashboard-brand"
            aria-label="Back to organisation dashboard"
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
              href="/organisation/dashboard"
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
          aria-labelledby="interests-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Volunteer interest</p>

            <h1 id="interests-title" className="dashboard-title">
              <span aria-hidden="true">📬</span>
              <span>Interest inbox</span>
            </h1>

            <p className="dashboard-lead">
              Review volunteers who have expressed interest in your published
              roles. Open each card to manage the next step.
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/organisation/opportunities"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📣</span>
                  <span>View roles</span>
                </span>
              </Link>

              <Link
                href="/organisation/dashboard"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🏠</span>
                  <span>Dashboard</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Interest count">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Inbox status</h2>
                <p>
                  {rows.length} total interest{rows.length === 1 ? "" : "s"}.
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
          <section className="dashboard-grid" aria-label="No interests yet">
            <article className="info-card dashboard-pathway-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                📬
              </div>

              <div className="dashboard-card-copy">
                <p className="dashboard-card-label">No interest yet</p>
                <h2>No volunteers have expressed interest</h2>
                <p>
                  When volunteers express interest in your published roles, they
                  will appear here.
                </p>
                <p className="card-action">
                  <Link href="/organisation/opportunities" className="text-link">
                    View opportunities
                  </Link>
                </p>
              </div>
            </article>
          </section>
        ) : (
          <section
            className="dashboard-grid interest-inbox-grid"
            aria-label="Volunteer interest list"
          >
            {rows.map((interest) => {
              const opportunity = opportunityMap.get(interest.opportunity_id);

              return (
                <Link
                  key={interest.id}
                  href={`/organisation/interests/${interest.id}`}
                  className="info-card dashboard-pathway-card interest-inbox-card"
                >
                  <div className="dashboard-card-icon" aria-hidden="true">
                    📬
                  </div>

                  <div className="dashboard-card-copy interest-inbox-copy">
                    <div className="interest-inbox-main">
                      <p className="dashboard-card-label">
                        {formatStatus(interest.status)}
                      </p>

                      <h2>{interest.volunteer_name || "Volunteer"}</h2>

                      <p>
                        Role:{" "}
                        <strong>{opportunity?.title || "Opportunity"}</strong>
                      </p>

                      {interest.volunteer_city ? (
                        <p>
                          Area: <strong>{interest.volunteer_city}</strong>
                        </p>
                      ) : null}

                      {interest.message ? <p>{interest.message}</p> : null}

                      <ChipList
                        values={interest.volunteer_skills}
                        emptyText="No skills shared."
                      />
                    </div>

                    <p className="card-action text-link">Review interest</p>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </section>

      <style>{`
        .interest-inbox-grid {
          align-items: stretch;
        }

        .interest-inbox-card {
          min-height: 250px;
          height: 100%;
          align-items: stretch;
        }

        .interest-inbox-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .interest-inbox-main {
          display: grid;
          gap: 8px;
        }

        .interest-inbox-main h2 {
          margin-bottom: 0;
        }

        .interest-inbox-main p {
          margin: 0;
        }

        .interest-inbox-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: flex-start;
          margin-top: 4px;
        }

        .interest-inbox-chip {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          max-width: 100%;
          padding: 8px 10px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #536f63;
          font-size: 0.82rem;
          font-weight: 800;
          line-height: 1.2;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
          white-space: normal;
        }

        @media (max-width: 640px) {
          .interest-inbox-card {
            min-height: 0;
          }

          .interest-inbox-copy {
            gap: 14px;
          }

          .interest-inbox-chip {
            border-radius: 18px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </main>
  );
}
