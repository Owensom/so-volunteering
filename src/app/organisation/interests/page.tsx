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

type InterestStatus = "new" | "contacted" | "accepted" | "closed";

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseInterestStatus(
  status: string | null | undefined
): InterestStatus {
  if (
    status === "new" ||
    status === "contacted" ||
    status === "accepted" ||
    status === "closed"
  ) {
    return status;
  }

  if (status === "review" || status === "reviewed") {
    return "contacted";
  }

  return "new";
}

function formatStatus(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "Accepted";
  if (normalisedStatus === "contacted") return "Contacted";
  if (normalisedStatus === "closed") return "Closed";
  return "New interest";
}

function getStatusIcon(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "✅";
  if (normalisedStatus === "contacted") return "💬";
  if (normalisedStatus === "closed") return "🌙";
  return "🌱";
}

function getStatusToneClass(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "interest-status-accepted";
  if (normalisedStatus === "contacted") return "interest-status-contacted";
  if (normalisedStatus === "closed") return "interest-status-closed";
  return "interest-status-new";
}

function getStatusAction(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") {
    return "Ready for pathway evidence and skills review.";
  }

  if (normalisedStatus === "contacted") {
    return "Keep the conversation moving and agree the next step.";
  }

  if (normalisedStatus === "closed") {
    return "No further action is needed unless this changes.";
  }

  return "Open this interest and contact the volunteer.";
}

function getReviewStrength(interest: InterestRow) {
  const goalsCount = Array.isArray(interest.volunteer_goals)
    ? interest.volunteer_goals.length
    : 0;

  const interestsCount = Array.isArray(interest.volunteer_interests)
    ? interest.volunteer_interests.length
    : 0;

  const skillsCount = Array.isArray(interest.volunteer_skills)
    ? interest.volunteer_skills.length
    : 0;

  const hasMessage = Boolean(interest.message?.trim());
  const hasSharedSupport = Boolean(
    interest.volunteer_support_shared && interest.volunteer_support_needs?.trim()
  );

  const score =
    goalsCount +
    interestsCount +
    skillsCount +
    (hasMessage ? 2 : 0) +
    (hasSharedSupport ? 1 : 0);

  if (score >= 8) {
    return {
      icon: "⭐",
      label: "Strong profile",
      text: "There is enough shared information to review this carefully before contact.",
      className: "review-strength-strong"
    };
  }

  if (score >= 4) {
    return {
      icon: "✨",
      label: "Good starting point",
      text: "There is some useful information. A short conversation will help.",
      className: "review-strength-good"
    };
  }

  return {
    icon: "🌱",
    label: "Needs conversation",
    text: "The volunteer has shared less detail, so keep the first contact simple and supportive.",
    className: "review-strength-light"
  };
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
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

function CountCard({
  icon,
  label,
  value,
  helper,
  className
}: {
  icon: string;
  label: string;
  value: number;
  helper: string;
  className: string;
}) {
  return (
    <article className={`interest-count-card ${className}`}>
      <span className="interest-count-icon" aria-hidden="true">
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

  const newCount = rows.filter(
    (row) => normaliseInterestStatus(row.status) === "new"
  ).length;

  const contactedCount = rows.filter(
    (row) => normaliseInterestStatus(row.status) === "contacted"
  ).length;

  const acceptedCount = rows.filter(
    (row) => normaliseInterestStatus(row.status) === "accepted"
  ).length;

  const closedCount = rows.filter(
    (row) => normaliseInterestStatus(row.status) === "closed"
  ).length;

  const activeCount = newCount + contactedCount;
  const pathwayReadyCount = acceptedCount;

  const latestNewInterest = rows.find(
    (row) => normaliseInterestStatus(row.status) === "new"
  );

  const listenText =
    "You are on the organisation interest inbox. This page helps you manage volunteers who are interested in your roles. At the top, the status cards show how many interests are new, contacted, accepted and closed. New means you should open the interest and make contact. Contacted means a conversation has started. Accepted means the volunteer is ready to move forward. Closed means no further action is needed. Each volunteer card shows the role, area if shared, a review snapshot, shared skills and the suggested next step. Select Open interest to review the full details and update the status.";

  return (
    <main className="dashboard-bg organisation-interest-inbox-page">
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
          className="dashboard-welcome-card interest-inbox-hero"
          aria-labelledby="interests-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Volunteer interest</p>

            <h1 id="interests-title" className="dashboard-title">
              <span aria-hidden="true">📬</span>
              <span>Interest inbox</span>
            </h1>

            <p className="dashboard-lead">
              Manage volunteers who have expressed interest in your published
              roles. Review their profile snapshot, contact them kindly, then
              update the status.
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

          <aside className="dashboard-progress-card" aria-label="Inbox summary">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Today’s focus</h2>
                <p>
                  {activeCount} active interest{activeCount === 1 ? "" : "s"} to
                  manage.
                </p>
              </div>
            </div>

            {latestNewInterest ? (
              <p className="dashboard-progress-note">
                Newest:{" "}
                <strong>{latestNewInterest.volunteer_name || "Volunteer"}</strong>
                {" · "}
                {formatDate(latestNewInterest.created_at)}
              </p>
            ) : (
              <p className="dashboard-progress-note">
                No new interests are waiting.
              </p>
            )}

            <p className="dashboard-progress-note">
              Accepted and ready for pathway evidence:{" "}
              <strong>{pathwayReadyCount}</strong>
            </p>
          </aside>
        </section>

        <section className="interest-count-grid" aria-label="Interest statuses">
          <CountCard
            icon="🌱"
            label="New interest"
            value={newCount}
            helper="Needs first contact"
            className="interest-count-new"
          />
          <CountCard
            icon="💬"
            label="Contacted"
            value={contactedCount}
            helper="Conversation started"
            className="interest-count-contacted"
          />
          <CountCard
            icon="✅"
            label="Accepted"
            value={acceptedCount}
            helper="Ready to move forward"
            className="interest-count-accepted"
          />
          <CountCard
            icon="🌙"
            label="Closed"
            value={closedCount}
            helper="No action needed"
            className="interest-count-closed"
          />
        </section>

        {rows.length === 0 ? (
          <section className="dashboard-grid" aria-label="No interests yet">
            <article className="info-card dashboard-pathway-card interest-empty-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                📬
              </div>

              <div className="dashboard-card-copy">
                <p className="dashboard-card-label">No interest yet</p>
                <h2>No volunteers have expressed interest</h2>
                <p>
                  When volunteers express interest in your published roles, they
                  will appear here with their status, message and shared profile
                  details.
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
              const normalisedStatus = normaliseInterestStatus(interest.status);
              const reviewStrength = getReviewStrength(interest);

              const goalsCount = Array.isArray(interest.volunteer_goals)
                ? interest.volunteer_goals.length
                : 0;

              const interestsCount = Array.isArray(interest.volunteer_interests)
                ? interest.volunteer_interests.length
                : 0;

              const skillsCount = Array.isArray(interest.volunteer_skills)
                ? interest.volunteer_skills.length
                : 0;

              return (
                <article
                  key={interest.id}
                  className="info-card dashboard-pathway-card interest-inbox-card"
                >
                  <div className="dashboard-card-icon" aria-hidden="true">
                    {getStatusIcon(normalisedStatus)}
                  </div>

                  <div className="dashboard-card-copy interest-inbox-copy">
                    <div className="interest-inbox-main">
                      <div className="interest-inbox-card-top">
                        <div>
                          <p className="dashboard-card-label">
                            {formatStatus(normalisedStatus)}
                          </p>

                          <h2>{interest.volunteer_name || "Volunteer"}</h2>
                        </div>

                        <div
                          className={`interest-status-pill ${getStatusToneClass(
                            normalisedStatus
                          )}`}
                        >
                          <span aria-hidden="true">
                            {getStatusIcon(normalisedStatus)}
                          </span>
                          <span>{formatStatus(normalisedStatus)}</span>
                        </div>
                      </div>

                      <div className="interest-inbox-role-box">
                        <p>
                          Role:{" "}
                          <strong>
                            {opportunity?.title || "Opportunity"}
                          </strong>
                        </p>

                        {interest.volunteer_city ? (
                          <p>
                            Area: <strong>{interest.volunteer_city}</strong>
                          </p>
                        ) : (
                          <p className="dashboard-muted-action">
                            Area not shared.
                          </p>
                        )}

                        <p className="dashboard-muted-action">
                          Received {formatDate(interest.created_at)}
                        </p>
                      </div>

                      <div
                        className={`review-strength-card ${reviewStrength.className}`}
                      >
                        <span aria-hidden="true">{reviewStrength.icon}</span>
                        <div>
                          <strong>{reviewStrength.label}</strong>
                          <p>{reviewStrength.text}</p>
                        </div>
                      </div>

                      <div
                        className="interest-profile-mini-grid"
                        aria-label="Shared volunteer profile summary"
                      >
                        <span>
                          <strong>{goalsCount}</strong>
                          Goals
                        </span>
                        <span>
                          <strong>{interestsCount}</strong>
                          Interests
                        </span>
                        <span>
                          <strong>{skillsCount}</strong>
                          Skills
                        </span>
                      </div>

                      {interest.message ? (
                        <blockquote className="interest-message-preview">
                          {interest.message}
                        </blockquote>
                      ) : (
                        <p className="dashboard-muted-action">
                          No supporting statement added.
                        </p>
                      )}

                      <ChipList
                        values={interest.volunteer_skills}
                        emptyText="No skills shared."
                      />

                      {interest.volunteer_support_shared &&
                      interest.volunteer_support_needs ? (
                        <p className="interest-support-note">
                          <span aria-hidden="true">💛</span>
                          Support information has been shared.
                        </p>
                      ) : null}
                    </div>

                    <div className="interest-next-step-box">
                      <p>
                        <strong>Next step:</strong>{" "}
                        {getStatusAction(normalisedStatus)}
                      </p>

                      <Link
                        href={`/organisation/interests/${interest.id}`}
                        className="primary-button interest-open-button"
                      >
                        <span className="dashboard-button-inner">
                          <span aria-hidden="true">📬</span>
                          <span>Open interest</span>
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
        .organisation-interest-inbox-page,
        .organisation-interest-inbox-page * {
          box-sizing: border-box;
        }

        .interest-inbox-hero {
          overflow: hidden;
        }

        .interest-count-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: 18px 0 22px;
        }

        .interest-count-card {
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

        .interest-count-icon {
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

        .interest-count-card div {
          min-width: 0;
        }

        .interest-count-card p,
        .interest-count-card span {
          margin: 0;
          color: #5d6677;
          font-size: 0.86rem;
          font-weight: 800;
          line-height: 1.25;
        }

        .interest-count-card strong {
          display: block;
          margin: 2px 0;
          color: #2f3f39;
          font-size: 1.8rem;
          font-weight: 950;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .interest-count-new {
          background: rgba(248, 245, 255, 0.9);
        }

        .interest-count-contacted {
          background: rgba(243, 249, 255, 0.9);
        }

        .interest-count-accepted {
          background: rgba(244, 255, 249, 0.92);
        }

        .interest-count-closed {
          background: rgba(248, 248, 252, 0.9);
        }

        .interest-inbox-grid {
          align-items: stretch;
        }

        .interest-inbox-card,
        .interest-empty-card {
          min-height: 250px;
          height: 100%;
          align-items: stretch;
          overflow: hidden;
        }

        .interest-inbox-copy {
          display: flex;
          min-width: 0;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .interest-inbox-main {
          display: grid;
          min-width: 0;
          gap: 12px;
        }

        .interest-inbox-card-top {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          justify-content: space-between;
          min-width: 0;
        }

        .interest-inbox-card-top > div:first-child {
          min-width: 0;
        }

        .interest-inbox-main h2 {
          margin-bottom: 0;
          overflow-wrap: anywhere;
        }

        .interest-inbox-main p {
          margin: 0;
        }

        .interest-inbox-role-box {
          display: grid;
          gap: 5px;
          min-width: 0;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.1);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.62);
        }

        .interest-inbox-role-box p {
          color: #5d6677;
          font-size: 0.94rem;
          font-weight: 750;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .interest-status-pill {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          min-height: 34px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 7px 11px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.84);
          color: #536f63;
          font-size: 0.84rem;
          font-weight: 950;
          line-height: 1.1;
          white-space: nowrap;
        }

        .interest-status-new {
          border-color: rgba(108, 92, 160, 0.18);
          background: rgba(248, 245, 255, 0.92);
          color: #6c5ca0;
        }

        .interest-status-contacted {
          border-color: rgba(74, 112, 160, 0.22);
          background: rgba(243, 249, 255, 0.94);
          color: #4a70a0;
        }

        .interest-status-accepted {
          border-color: rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.96);
          color: #536f63;
        }

        .interest-status-closed {
          border-color: rgba(100, 100, 110, 0.18);
          background: rgba(248, 248, 252, 0.94);
          color: #5d6677;
        }

        .review-strength-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
          min-width: 0;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.66);
        }

        .review-strength-card > span {
          display: inline-flex;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 18px rgba(33, 56, 48, 0.05);
        }

        .review-strength-card div {
          min-width: 0;
        }

        .review-strength-card strong {
          display: block;
          color: #35453f;
          font-size: 0.94rem;
          font-weight: 950;
          line-height: 1.2;
        }

        .review-strength-card p {
          margin-top: 3px;
          color: #5d6677;
          font-size: 0.88rem;
          font-weight: 750;
          line-height: 1.35;
        }

        .review-strength-strong {
          background: rgba(244, 255, 249, 0.86);
          border-color: rgba(83, 111, 99, 0.22);
        }

        .review-strength-good {
          background: rgba(248, 245, 255, 0.86);
          border-color: rgba(108, 92, 160, 0.18);
        }

        .review-strength-light {
          background: rgba(255, 250, 241, 0.86);
          border-color: rgba(191, 146, 72, 0.18);
        }

        .interest-profile-mini-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .interest-profile-mini-grid span {
          display: grid;
          gap: 2px;
          min-width: 0;
          padding: 10px;
          border: 1px solid rgba(108, 92, 160, 0.1);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.62);
          color: #5d6677;
          font-size: 0.76rem;
          font-weight: 850;
          line-height: 1.12;
          text-align: center;
        }

        .interest-profile-mini-grid strong {
          display: block;
          color: #536f63;
          font-size: 1.2rem;
          font-weight: 950;
          line-height: 1;
        }

        .interest-message-preview {
          display: -webkit-box;
          max-height: 4.8em;
          margin: 0;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          padding: 0 0 0 12px;
          border-left: 3px solid rgba(83, 111, 99, 0.24);
          color: #536f63;
          font-size: 0.94rem;
          font-weight: 750;
          line-height: 1.6;
        }

        .interest-inbox-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: flex-start;
          margin-top: 2px;
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

        .interest-support-note {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          align-items: center;
          gap: 7px;
          padding: 9px 11px;
          border: 1px solid rgba(191, 146, 72, 0.18);
          border-radius: 999px;
          background: rgba(255, 250, 241, 0.86);
          color: #7a6138;
          font-size: 0.84rem;
          font-weight: 900;
          line-height: 1.2;
        }

        .interest-next-step-box {
          display: grid;
          gap: 12px;
          min-width: 0;
          padding-top: 12px;
          border-top: 1px solid rgba(108, 92, 160, 0.1);
        }

        .interest-next-step-box p {
          margin: 0;
          color: #5d6677;
          font-size: 0.92rem;
          font-weight: 750;
          line-height: 1.4;
        }

        .interest-open-button {
          width: 100%;
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .interest-count-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .organisation-interest-inbox-page .dashboard-shell {
            width: min(100%, 100vw);
            padding-left: 18px;
            padding-right: 18px;
          }

          .organisation-interest-inbox-page .dashboard-topbar-actions {
            width: 100%;
            justify-content: stretch;
          }

          .organisation-interest-inbox-page .dashboard-topbar-actions > *,
          .organisation-interest-inbox-page .dashboard-topbar-actions a,
          .organisation-interest-inbox-page .dashboard-topbar-actions button {
            width: 100%;
          }

          .interest-count-grid {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 14px;
          }

          .interest-count-card {
            border-radius: 22px;
          }

          .interest-inbox-card {
            min-height: 0;
          }

          .interest-inbox-copy {
            gap: 14px;
          }

          .interest-inbox-card-top {
            display: grid;
            gap: 10px;
          }

          .interest-status-pill,
          .interest-support-note {
            width: 100%;
          }

          .interest-profile-mini-grid {
            grid-template-columns: 1fr;
          }

          .interest-profile-mini-grid span {
            grid-template-columns: auto 1fr;
            align-items: center;
            text-align: left;
          }

          .interest-inbox-chip {
            border-radius: 18px;
            font-size: 0.8rem;
          }

          .interest-open-button {
            min-height: 48px;
          }
        }

        @media (max-width: 420px) {
          .organisation-interest-inbox-page .dashboard-shell {
            padding-left: 14px;
            padding-right: 14px;
          }
        }
      `}</style>
    </main>
  );
}
