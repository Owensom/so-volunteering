import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type Opportunity = {
  id: string;
  title: string;
  summary: string;
  location_type: string;
  location: string | null;
  time_commitment: string | null;
  status: string;
  created_at: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function formatStatus(status: string) {
  if (status === "published") return "Published";
  if (status === "closed") return "Closed";
  return "Draft";
}

function formatLocationType(value: string) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

function getStatusIcon(status: string) {
  if (status === "published") return "✅";
  if (status === "closed") return "🚫";
  return "📝";
}

export default async function OrganisationOpportunitiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
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

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id,title,summary,location_type,location,time_commitment,status,created_at",
    )
    .eq("organisation_user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (opportunities as Opportunity[] | null) ?? [];

  const publishedCount = rows.filter(
    (opportunity) => opportunity.status === "published",
  ).length;

  const draftCount = rows.filter(
    (opportunity) => opportunity.status === "draft",
  ).length;

  const closedCount = rows.filter(
    (opportunity) => opportunity.status === "closed",
  ).length;

  const listenText =
    "This is your organisation opportunities page. It shows the volunteering roles your organisation has created. Each role card has an Edit role button and a Skills reviews button. Use Skills reviews to add positive skills feedback for volunteers who registered interest in that role. You can also create a new opportunity, review drafts and see published opportunities.";

  return (
    <main className="dashboard-bg organisation-opportunities-page">
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
          aria-labelledby="opportunities-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Organisation opportunities</p>

            <h1 id="opportunities-title" className="dashboard-title">
              <span aria-hidden="true">📣</span>
              <span>Volunteering roles</span>
            </h1>

            <p className="dashboard-lead">
              Create, review and publish inclusive volunteering roles. Use
              skills reviews to turn completed volunteering into positive
              pathway evidence for volunteers.
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/organisation/opportunities/new"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">➕</span>
                  <span>Create role</span>
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

          <aside className="dashboard-progress-card" aria-label="Opportunity counts">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Opportunity status</h2>
                <p>
                  {rows.length} total role{rows.length === 1 ? "" : "s"}.
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Published: <strong>{publishedCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Drafts: <strong>{draftCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Closed: <strong>{closedCount}</strong>
            </p>
          </aside>
        </section>

        {rows.length === 0 ? (
          <section className="dashboard-grid" aria-label="Empty opportunity state">
            <Link
              href="/organisation/opportunities/new"
              className="info-card dashboard-pathway-card"
            >
              <div className="dashboard-card-icon" aria-hidden="true">
                📣
              </div>

              <div className="dashboard-card-copy">
                <p className="dashboard-card-label">First role</p>
                <h2>No opportunities yet</h2>
                <p>
                  Create your first draft role. You can keep it private until it
                  is ready to publish.
                </p>
                <p className="card-action text-link">Create first role</p>
              </div>
            </Link>
          </section>
        ) : (
          <section className="dashboard-grid" aria-label="Opportunity list">
            {rows.map((opportunity) => (
              <article
                key={opportunity.id}
                className="info-card dashboard-pathway-card opportunity-card"
              >
                <div className="dashboard-card-icon" aria-hidden="true">
                  {getStatusIcon(opportunity.status)}
                </div>

                <div className="dashboard-card-copy opportunity-card-copy">
                  <div className="opportunity-card-main">
                    <p className="dashboard-card-label">
                      {formatStatus(opportunity.status)}
                    </p>
                    <h2>{opportunity.title}</h2>
                    <p>{opportunity.summary}</p>
                    <p className="dashboard-muted-action">
                      {formatLocationType(opportunity.location_type)}
                      {opportunity.location ? ` · ${opportunity.location}` : ""}
                      {opportunity.time_commitment
                        ? ` · ${opportunity.time_commitment}`
                        : ""}
                    </p>
                  </div>

                  <div
                    className="opportunity-card-actions"
                    aria-label={`Actions for ${opportunity.title}`}
                  >
                    <Link
                      href={`/organisation/opportunities/${opportunity.id}`}
                      className="primary-button opportunity-card-button"
                    >
                      <span className="dashboard-button-inner">
                        <span aria-hidden="true">📝</span>
                        <span>Edit role</span>
                      </span>
                    </Link>

                    <Link
                      href={`/organisation/opportunities/${opportunity.id}/reviews`}
                      className="secondary-button opportunity-card-button"
                    >
                      <span className="dashboard-button-inner">
                        <span aria-hidden="true">⭐</span>
                        <span>Skills reviews</span>
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>

      <style>{`
        .organisation-opportunities-page,
        .organisation-opportunities-page * {
          box-sizing: border-box;
        }

        .dashboard-grid {
          align-items: stretch;
        }

        .opportunity-card {
          height: 100%;
          align-items: stretch;
        }

        .opportunity-card-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .opportunity-card-main {
          display: grid;
          gap: 8px;
        }

        .opportunity-card-main h2 {
          margin-bottom: 0;
        }

        .opportunity-card-main p {
          margin: 0;
        }

        .opportunity-card-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: auto;
        }

        .opportunity-card-button {
          width: 100%;
          min-height: 46px;
          padding-inline: 14px;
        }

        @media (max-width: 760px) {
          .opportunity-card-actions {
            grid-template-columns: 1fr;
          }

          .opportunity-card-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
