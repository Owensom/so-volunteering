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

type InterestSummary = {
  opportunity_id: string;
  status: string | null;
};

type RoleGuideStep = {
  icon: string;
  title: string;
  text: string;
  isComplete: boolean;
};

type RoleCounts = {
  total: number;
  new: number;
  contacted: number;
  accepted: number;
  closed: number;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseOpportunityStatus(status: string | null | undefined) {
  if (status === "published") return "published";
  if (status === "closed") return "closed";
  return "draft";
}

function normaliseInterestStatus(status: string | null | undefined) {
  if (status === "contacted") return "contacted";
  if (status === "accepted") return "accepted";
  if (status === "closed") return "closed";
  return "new";
}

function formatStatus(status: string) {
  const normalisedStatus = normaliseOpportunityStatus(status);

  if (normalisedStatus === "published") return "Published";
  if (normalisedStatus === "closed") return "Closed";
  return "Draft";
}

function formatLocationType(value: string) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

function getStatusIcon(status: string) {
  const normalisedStatus = normaliseOpportunityStatus(status);

  if (normalisedStatus === "published") return "✅";
  if (normalisedStatus === "closed") return "🌙";
  return "📝";
}

function getStatusClass(status: string) {
  const normalisedStatus = normaliseOpportunityStatus(status);

  if (normalisedStatus === "published") return "role-status-published";
  if (normalisedStatus === "closed") return "role-status-closed";
  return "role-status-draft";
}

function getRoleReadiness(opportunity: Opportunity, counts: RoleCounts) {
  const status = normaliseOpportunityStatus(opportunity.status);
  const hasTitle = Boolean(opportunity.title?.trim());
  const hasSummary = Boolean(opportunity.summary?.trim());
  const hasLocationType = Boolean(opportunity.location_type?.trim());
  const hasTime = Boolean(opportunity.time_commitment?.trim());
  const hasCoreDetails = hasTitle && hasSummary && hasLocationType && hasTime;

  if (status === "closed") {
    return {
      icon: "🌙",
      label: "Closed",
      text: "This role is closed. You can still use reviews for pathway evidence where relevant.",
      className: "role-readiness-closed",
    };
  }

  if (status === "published" && counts.total > 0) {
    return {
      icon: "🌱",
      label: "Live with interest",
      text: "This role is published and volunteers have expressed interest.",
      className: "role-readiness-ready",
    };
  }

  if (status === "published") {
    return {
      icon: "✅",
      label: "Published",
      text: "This role is live. Share it and check the interest inbox regularly.",
      className: "role-readiness-ready",
    };
  }

  if (hasCoreDetails) {
    return {
      icon: "📝",
      label: "Draft nearly ready",
      text: "This draft has the main details. Review it before publishing.",
      className: "role-readiness-warning",
    };
  }

  return {
    icon: "⚠️",
    label: "Draft needs detail",
    text: "Add the main role details before publishing.",
    className: "role-readiness-warning",
  };
}

function getCreatedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(date);
}

function CountCard({
  icon,
  label,
  value,
  helper,
  className,
}: {
  icon: string;
  label: string;
  value: number;
  helper: string;
  className: string;
}) {
  return (
    <article className={`role-count-card ${className}`}>
      <span className="role-count-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
    </article>
  );
}

function RoleGuide({ steps }: { steps: RoleGuideStep[] }) {
  return (
    <section className="role-guide-panel" aria-labelledby="role-guide-title">
      <div className="role-guide-heading">
        <span aria-hidden="true">🧭</span>

        <div>
          <p className="dashboard-kicker">Step-by-step guide</p>
          <h2 id="role-guide-title">How to manage your roles</h2>
          <p>
            Keep drafts private until ready, publish clear roles, follow up with
            volunteers in the inbox, and use skills reviews to build positive
            pathway evidence.
          </p>
        </div>
      </div>

      <div className="role-guide-grid">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className={
              step.isComplete
                ? "role-guide-step role-guide-step-complete"
                : "role-guide-step"
            }
          >
            <span className="role-guide-step-number">
              {step.isComplete ? "✓" : index + 1}
            </span>

            <div className="role-guide-step-icon" aria-hidden="true">
              {step.icon}
            </div>

            <div className="role-guide-step-copy">
              <p className="role-guide-step-kicker">
                Step {index + 1}
                <span>{step.isComplete ? "Active" : "Guide"}</span>
              </p>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildInterestCountMap(interests: InterestSummary[]) {
  const map = new Map<string, RoleCounts>();

  interests.forEach((interest) => {
    const opportunityId = interest.opportunity_id;

    if (!opportunityId) return;

    const current =
      map.get(opportunityId) ||
      ({
        total: 0,
        new: 0,
        contacted: 0,
        accepted: 0,
        closed: 0,
      } satisfies RoleCounts);

    const status = normaliseInterestStatus(interest.status);

    current.total += 1;
    current[status] += 1;

    map.set(opportunityId, current);
  });

  return map;
}

function emptyRoleCounts(): RoleCounts {
  return {
    total: 0,
    new: 0,
    contacted: 0,
    accepted: 0,
    closed: 0,
  };
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
  const opportunityIds = rows.map((opportunity) => opportunity.id);

  const { data: interests } = opportunityIds.length
    ? await supabase
        .from("opportunity_interests")
        .select("opportunity_id,status")
        .eq("organisation_user_id", user.id)
        .in("opportunity_id", opportunityIds)
    : { data: [] as InterestSummary[] };

  const interestRows = (interests as InterestSummary[] | null) ?? [];
  const interestCountMap = buildInterestCountMap(interestRows);

  const publishedCount = rows.filter(
    (opportunity) => normaliseOpportunityStatus(opportunity.status) === "published",
  ).length;

  const draftCount = rows.filter(
    (opportunity) => normaliseOpportunityStatus(opportunity.status) === "draft",
  ).length;

  const closedCount = rows.filter(
    (opportunity) => normaliseOpportunityStatus(opportunity.status) === "closed",
  ).length;

  const totalInterestCount = interestRows.length;

  const activeInterestCount = interestRows.filter((interest) => {
    const status = normaliseInterestStatus(interest.status);
    return status === "new" || status === "contacted";
  }).length;

  const acceptedInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "accepted",
  ).length;

  const rolesWithInterestCount = rows.filter((opportunity) => {
    const counts = interestCountMap.get(opportunity.id) || emptyRoleCounts();
    return counts.total > 0;
  }).length;

  const guideSteps: RoleGuideStep[] = [
    {
      icon: "📝",
      title: "Create a clear draft",
      text: "Start with plain language, safe location wording, support offered and realistic time commitment.",
      isComplete: rows.length > 0,
    },
    {
      icon: "✅",
      title: "Publish when ready",
      text: "Published roles are visible to volunteers. Drafts stay private to your organisation.",
      isComplete: publishedCount > 0,
    },
    {
      icon: "📬",
      title: "Reply to interests",
      text: "Use the interest inbox to review volunteers and update their status kindly.",
      isComplete: totalInterestCount > 0,
    },
    {
      icon: "⭐",
      title: "Add positive evidence",
      text: "After activity, use skills reviews to support each volunteer’s Positive Pathway CV.",
      isComplete: acceptedInterestCount > 0,
    },
  ];

  const listenText =
    "This is your organisation opportunities page. It shows the volunteering roles your organisation has created. Draft roles are private. Published roles are visible to volunteers. Closed roles are no longer active. Each role card shows status, readiness, interest counts, role details, and actions. Use Edit role to change the role. Use Skills reviews after a volunteer has completed activity. Use Interest inbox to reply to volunteers who have expressed interest.";

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
          className="dashboard-welcome-card role-management-hero"
          aria-labelledby="opportunities-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Organisation opportunities</p>

            <h1 id="opportunities-title" className="dashboard-title">
              <span aria-hidden="true">📣</span>
              <span>Volunteering roles</span>
            </h1>

            <p className="dashboard-lead">
              Create, review and publish inclusive volunteering roles. Follow up
              with interested volunteers, then use skills reviews to turn
              completed activity into positive pathway evidence.
            </p>

            <div className="dashboard-primary-actions role-hero-actions">
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
                href="/organisation/interests"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📬</span>
                  <span>Interest inbox</span>
                </span>
              </Link>

              <Link
                href="/organisation/volunteers"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">👥</span>
                  <span>Volunteer connections</span>
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
                <h2>Role status</h2>
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
            <p className="dashboard-progress-note">
              Active interests: <strong>{activeInterestCount}</strong>
            </p>
          </aside>
        </section>

        <RoleGuide steps={guideSteps} />

        <section className="role-privacy-panel" aria-labelledby="role-privacy-title">
          <div className="role-privacy-icon" aria-hidden="true">
            🛡️
          </div>

          <div>
            <p className="dashboard-kicker">Privacy and safety</p>
            <h2 id="role-privacy-title">Publish only clear, safe roles</h2>
            <p>
              Role pages should use plain language, safe location wording and
              realistic expectations. Do not ask volunteers for money, bank
              details, passwords or unnecessary home address details through the
              app.
            </p>
          </div>
        </section>

        <section className="role-count-grid" aria-label="Role summary">
          <CountCard
            icon="✅"
            label="Published"
            value={publishedCount}
            helper="Visible to volunteers"
            className="role-count-published"
          />
          <CountCard
            icon="📝"
            label="Draft"
            value={draftCount}
            helper="Private until ready"
            className="role-count-draft"
          />
          <CountCard
            icon="🌙"
            label="Closed"
            value={closedCount}
            helper="No longer active"
            className="role-count-closed"
          />
          <CountCard
            icon="📬"
            label="With interest"
            value={rolesWithInterestCount}
            helper="Roles with volunteer interest"
            className="role-count-interest"
          />
        </section>

        {rows.length === 0 ? (
          <section className="dashboard-grid" aria-label="Empty opportunity state">
            <Link
              href="/organisation/opportunities/new"
              className="info-card dashboard-pathway-card role-empty-card"
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
          <section className="dashboard-grid role-management-grid" aria-label="Opportunity list">
            {rows.map((opportunity) => {
              const counts =
                interestCountMap.get(opportunity.id) || emptyRoleCounts();
              const readiness = getRoleReadiness(opportunity, counts);
              const statusClass = getStatusClass(opportunity.status);

              return (
                <article
                  key={opportunity.id}
                  className={`info-card dashboard-pathway-card opportunity-card ${statusClass}`}
                >
                  <div className="dashboard-card-icon" aria-hidden="true">
                    {getStatusIcon(opportunity.status)}
                  </div>

                  <div className="dashboard-card-copy opportunity-card-copy">
                    <div className="opportunity-card-main">
                      <div className="role-card-topline">
                        <p className="dashboard-card-label">
                          {formatStatus(opportunity.status)}
                        </p>

                        <span className={`role-status-pill ${statusClass}`}>
                          {formatStatus(opportunity.status)}
                        </span>
                      </div>

                      <h2>{opportunity.title}</h2>
                      <p>{opportunity.summary}</p>

                      <div className={`role-readiness-card ${readiness.className}`}>
                        <span aria-hidden="true">{readiness.icon}</span>
                        <div>
                          <strong>{readiness.label}</strong>
                          <p>{readiness.text}</p>
                        </div>
                      </div>

                      <div className="role-detail-strip">
                        <span>
                          <strong>Type:</strong>{" "}
                          {formatLocationType(opportunity.location_type)}
                        </span>

                        <span>
                          <strong>Location:</strong>{" "}
                          {opportunity.location || "Not listed"}
                        </span>

                        <span>
                          <strong>Time:</strong>{" "}
                          {opportunity.time_commitment || "Not listed"}
                        </span>

                        <span>
                          <strong>Created:</strong>{" "}
                          {getCreatedDate(opportunity.created_at)}
                        </span>
                      </div>

                      <div className="role-interest-summary">
                        <div>
                          <strong>{counts.total}</strong>
                          <span>Total interest</span>
                        </div>
                        <div>
                          <strong>{counts.new}</strong>
                          <span>New</span>
                        </div>
                        <div>
                          <strong>{counts.contacted}</strong>
                          <span>Contacted</span>
                        </div>
                        <div>
                          <strong>{counts.accepted}</strong>
                          <span>Accepted</span>
                        </div>
                      </div>
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

                      <Link
                        href="/organisation/interests"
                        className="secondary-button opportunity-card-button"
                      >
                        <span className="dashboard-button-inner">
                          <span aria-hidden="true">📬</span>
                          <span>Interest inbox</span>
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>

      <style>{`
        .organisation-opportunities-page,
        .organisation-opportunities-page * {
          box-sizing: border-box;
        }

        .organisation-opportunities-page {
          overflow-x: hidden;
        }

        .dashboard-grid,
        .role-management-grid {
          align-items: stretch;
        }

        .role-hero-actions {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          width: min(100%, 620px);
        }

        .role-hero-actions .dashboard-main-action {
          width: 100%;
          justify-content: center;
          text-align: center;
        }

        .role-guide-panel,
        .role-privacy-panel {
          display: grid;
          gap: 18px;
          padding: 22px;
          border-radius: 28px;
          box-shadow: 0 18px 42px rgba(33, 96, 61, 0.08);
          overflow: hidden;
        }

        .role-guide-panel {
          border: 1px solid rgba(108, 92, 160, 0.16);
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.92), rgba(255, 255, 255, 0.9));
        }

        .role-guide-heading,
        .role-privacy-panel {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
        }

        .role-guide-heading > span,
        .role-privacy-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          font-size: 1.9rem;
        }

        .role-guide-heading > span {
          background: rgba(108, 92, 160, 0.12);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.14);
        }

        .role-privacy-panel {
          border: 1px solid rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.4), transparent 32%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.94), rgba(255, 255, 255, 0.9));
        }

        .role-privacy-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.16);
        }

        .role-guide-heading h2,
        .role-privacy-panel h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .role-privacy-panel h2 {
          color: #145c38;
        }

        .role-guide-heading p,
        .role-privacy-panel p {
          margin: 0;
          color: #60706a;
          font-weight: 780;
          line-height: 1.5;
        }

        .role-privacy-panel p {
          color: #275f45;
        }

        .role-guide-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .role-guide-step {
          position: relative;
          display: grid;
          gap: 10px;
          min-height: 178px;
          padding: 15px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 12px 28px rgba(33, 56, 48, 0.05);
        }

        .role-guide-step-complete {
          border-color: rgba(34, 124, 78, 0.26);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.28), transparent 34%),
            rgba(244, 255, 249, 0.92);
          box-shadow: 0 14px 30px rgba(33, 96, 61, 0.08);
        }

        .role-guide-step-number {
          position: absolute;
          top: 12px;
          right: 12px;
          display: inline-flex;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
          color: #4f4b82;
          font-size: 0.82rem;
          font-weight: 950;
          line-height: 1;
        }

        .role-guide-step-complete .role-guide-step-number {
          background: rgba(34, 124, 78, 0.14);
          color: #145c38;
        }

        .role-guide-step-icon {
          display: inline-flex;
          width: 52px;
          height: 52px;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: rgba(248, 248, 252, 0.96);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.08);
          font-size: 1.55rem;
        }

        .role-guide-step-complete .role-guide-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .role-guide-step-copy {
          display: grid;
          gap: 6px;
        }

        .role-guide-step-kicker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin: 0;
          padding-right: 34px;
          color: #6c5ca0;
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .role-guide-step-kicker span {
          display: inline-flex;
          min-height: 24px;
          align-items: center;
          justify-content: center;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.1);
          color: #6c5ca0;
          font-size: 0.68rem;
          letter-spacing: 0;
          text-transform: none;
        }

        .role-guide-step-complete .role-guide-step-kicker,
        .role-guide-step-complete .role-guide-step-kicker span {
          color: #145c38;
        }

        .role-guide-step-complete .role-guide-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .role-guide-step-copy h3 {
          margin: 0;
          padding-right: 32px;
          color: #315f48;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.14;
        }

        .role-guide-step-copy p {
          margin: 0;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 740;
          line-height: 1.42;
        }

        .role-count-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: 18px 0 22px;
        }

        .role-count-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          min-width: 0;
          padding: 16px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.76);
          box-shadow: 0 16px 36px rgba(33, 56, 48, 0.08);
        }

        .role-count-icon {
          display: inline-flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.84);
          font-size: 1.25rem;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
        }

        .role-count-card p,
        .role-count-card span {
          margin: 0;
          color: #5d6677;
          font-size: 0.86rem;
          font-weight: 800;
          line-height: 1.25;
        }

        .role-count-card strong {
          display: block;
          margin: 2px 0;
          color: #2f3f39;
          font-size: 1.8rem;
          font-weight: 950;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .role-count-published,
        .role-count-interest {
          background: rgba(244, 255, 249, 0.92);
        }

        .role-count-draft {
          background: rgba(248, 245, 255, 0.9);
        }

        .role-count-closed {
          background: rgba(248, 248, 252, 0.9);
        }

        .opportunity-card {
          height: 100%;
          align-items: stretch;
          overflow: hidden;
        }

        .opportunity-card.role-status-published {
          border-color: rgba(83, 111, 99, 0.22);
        }

        .opportunity-card.role-status-draft {
          border-color: rgba(108, 92, 160, 0.16);
        }

        .opportunity-card.role-status-closed {
          opacity: 0.88;
          border-color: rgba(100, 100, 110, 0.16);
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
          gap: 10px;
          min-width: 0;
        }

        .opportunity-card-main h2 {
          margin-bottom: 0;
          overflow-wrap: anywhere;
        }

        .opportunity-card-main p {
          margin: 0;
        }

        .role-card-topline {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          justify-content: space-between;
          min-width: 0;
        }

        .role-status-pill {
          display: inline-flex;
          min-height: 32px;
          align-items: center;
          justify-content: center;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 950;
          line-height: 1.1;
          white-space: nowrap;
        }

        .role-status-pill.role-status-published {
          border: 1px solid rgba(83, 111, 99, 0.22);
          background: rgba(244, 255, 249, 0.96);
          color: #536f63;
        }

        .role-status-pill.role-status-draft {
          border: 1px solid rgba(108, 92, 160, 0.18);
          background: rgba(248, 245, 255, 0.92);
          color: #6c5ca0;
        }

        .role-status-pill.role-status-closed {
          border: 1px solid rgba(100, 100, 110, 0.16);
          background: rgba(248, 248, 252, 0.96);
          color: #5d6677;
        }

        .role-readiness-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
          padding: 12px;
          border-radius: 18px;
          border: 1px solid rgba(108, 92, 160, 0.12);
        }

        .role-readiness-card > span {
          display: inline-flex;
          width: 34px;
          height: 34px;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 8px 18px rgba(33, 56, 48, 0.05);
        }

        .role-readiness-card strong {
          display: block;
          color: #35453f;
          font-size: 0.94rem;
          font-weight: 950;
          line-height: 1.2;
        }

        .role-readiness-card p {
          margin-top: 3px;
          color: #5d6677;
          font-size: 0.88rem;
          font-weight: 750;
          line-height: 1.35;
        }

        .role-readiness-ready {
          border-color: rgba(83, 111, 99, 0.22);
          background: rgba(244, 255, 249, 0.86);
        }

        .role-readiness-warning {
          border-color: rgba(108, 92, 160, 0.18);
          background: rgba(248, 245, 255, 0.86);
        }

        .role-readiness-closed {
          border-color: rgba(100, 100, 110, 0.16);
          background: rgba(248, 248, 252, 0.86);
        }

        .role-detail-strip {
          display: grid;
          gap: 7px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.1);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.62);
        }

        .role-detail-strip span {
          color: #5d6677;
          font-size: 0.9rem;
          font-weight: 750;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .role-detail-strip strong {
          color: #315f48;
        }

        .role-interest-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .role-interest-summary div {
          display: grid;
          gap: 3px;
          min-height: 76px;
          padding: 10px;
          border: 1px solid rgba(108, 92, 160, 0.1);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.66);
          text-align: center;
        }

        .role-interest-summary strong {
          color: #536f63;
          font-size: 1.2rem;
          font-weight: 950;
          line-height: 1;
        }

        .role-interest-summary span {
          color: #60706a;
          font-size: 0.74rem;
          font-weight: 850;
          line-height: 1.15;
        }

        .opportunity-card-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: auto;
        }

        .opportunity-card-button {
          width: 100%;
          min-height: 46px;
          padding-inline: 14px;
          text-decoration: none;
        }

        .role-empty-card {
          min-height: 230px;
        }

        @media (max-width: 1080px) {
          .role-guide-grid,
          .role-count-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .organisation-opportunities-page .dashboard-shell {
            width: min(100%, 100vw);
            padding-left: 18px;
            padding-right: 18px;
          }

          .organisation-opportunities-page .dashboard-topbar-actions {
            width: 100%;
            justify-content: stretch;
          }

          .organisation-opportunities-page .dashboard-topbar-actions > *,
          .organisation-opportunities-page .dashboard-topbar-actions a,
          .organisation-opportunities-page .dashboard-topbar-actions button {
            width: 100%;
          }

          .role-hero-actions,
          .role-guide-grid,
          .role-count-grid {
            grid-template-columns: 1fr;
          }

          .role-guide-heading,
          .role-privacy-panel {
            grid-template-columns: 1fr;
          }

          .role-guide-panel,
          .role-privacy-panel {
            border-radius: 24px;
            padding: 18px;
          }

          .role-guide-heading > span,
          .role-privacy-icon {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .role-count-grid {
            gap: 10px;
            margin-top: 14px;
          }

          .role-card-topline {
            display: grid;
          }

          .role-status-pill {
            width: 100%;
          }

          .role-readiness-card {
            grid-template-columns: 1fr;
          }

          .role-interest-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .opportunity-card {
            min-height: 0;
          }

          .opportunity-card-copy {
            gap: 14px;
          }
        }

        @media (max-width: 420px) {
          .organisation-opportunities-page .dashboard-shell {
            padding-left: 14px;
            padding-right: 14px;
          }

          .role-interest-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
