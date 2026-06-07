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
  volunteer_user_id: string;
  volunteer_name: string | null;
  volunteer_email: string | null;
  volunteer_phone: string | null;
  volunteer_city: string | null;
  volunteer_preferred_contact_method: string | null;
  volunteer_goals: string[] | null;
  volunteer_interests: string[] | null;
  volunteer_skills: string[] | null;
  volunteer_support_shared: boolean | null;
  volunteer_support_needs: string | null;
  message: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
};

type OpportunityRow = {
  id: string;
  title: string;
  status: string | null;
};

type ReviewRow = {
  id: string;
  opportunity_interest_id: string;
  opportunity_id: string;
  volunteer_user_id: string;
  volunteer_name: string | null;
  volunteer_email: string | null;
  opportunity_title: string | null;
  status: string | null;
  positive_comment: string | null;
  updated_at: string | null;
};

type VolunteerConnection = {
  key: string;
  volunteerUserId: string | null;
  name: string;
  email: string;
  phone: string;
  city: string;
  preferredContactMethod: string;
  latestActivity: string;
  latestStatus: "new" | "contacted" | "accepted" | "closed";
  interestCount: number;
  acceptedCount: number;
  contactedCount: number;
  closedCount: number;
  sharedReviewCount: number;
  draftReviewCount: number;
  hiddenReviewCount: number;
  roles: {
    interestId: string;
    opportunityId: string;
    title: string;
    status: "new" | "contacted" | "accepted" | "closed";
    createdAt: string;
  }[];
  goals: string[];
  interests: string[];
  skills: string[];
  supportShared: boolean;
  supportNeeds: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseInterestStatus(
  status: string | null | undefined,
): "new" | "contacted" | "accepted" | "closed" {
  if (status === "contacted") return "contacted";
  if (status === "accepted") return "accepted";
  if (status === "closed") return "closed";
  return "new";
}

function formatInterestStatus(status: string | null | undefined) {
  const normalised = normaliseInterestStatus(status);

  if (normalised === "accepted") return "Accepted";
  if (normalised === "contacted") return "Contacted";
  if (normalised === "closed") return "Closed";
  return "New interest";
}

function getStatusIcon(status: string | null | undefined) {
  const normalised = normaliseInterestStatus(status);

  if (normalised === "accepted") return "✅";
  if (normalised === "contacted") return "💬";
  if (normalised === "closed") return "🌙";
  return "🌱";
}

function getStatusClass(status: string | null | undefined) {
  const normalised = normaliseInterestStatus(status);

  if (normalised === "accepted") return "connection-status accepted";
  if (normalised === "contacted") return "connection-status contacted";
  if (normalised === "closed") return "connection-status closed";
  return "connection-status new";
}

function formatContactMethod(value: string | null | undefined) {
  if (value === "sms") return "Text message";
  if (value === "phone") return "Phone call";
  if (value === "email") return "Email";
  return "Not chosen";
}

function safeDate(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Europe/London",
  }).format(date);
}

function getTimestamp(value: string | null | undefined) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function uniqueList(values: Array<string[] | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((list) => {
    if (!Array.isArray(list)) return;

    list.forEach((item) => {
      const trimmed = item.trim();
      const key = trimmed.toLowerCase();

      if (trimmed && !seen.has(key)) {
        seen.add(key);
        result.push(trimmed);
      }
    });
  });

  return result;
}

function sortStatusPriority(status: "new" | "contacted" | "accepted" | "closed") {
  if (status === "accepted") return 4;
  if (status === "contacted") return 3;
  if (status === "new") return 2;
  return 1;
}

function getLatestStatus(statuses: Array<"new" | "contacted" | "accepted" | "closed">) {
  return statuses.sort((a, b) => sortStatusPriority(b) - sortStatusPriority(a))[0] || "new";
}

function fallbackVolunteerName(email: string | null | undefined) {
  if (!email || !email.includes("@")) return "Volunteer";

  const localPart = email.split("@")[0];

  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function makeConnectionKey(interest: InterestRow) {
  return (
    interest.volunteer_user_id ||
    interest.volunteer_email?.trim().toLowerCase() ||
    interest.id
  );
}

function ChipList({
  values,
  emptyText,
}: {
  values: string[];
  emptyText: string;
}) {
  if (!values.length) {
    return <p className="connection-muted">{emptyText}</p>;
  }

  return (
    <div className="connection-chip-list">
      {values.slice(0, 8).map((value) => (
        <span key={value} className="connection-chip">
          {value}
        </span>
      ))}
      {values.length > 8 ? (
        <span className="connection-chip connection-chip-more">
          +{values.length - 8} more
        </span>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: string;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <article className="connection-stat-card">
      <span aria-hidden="true">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

export default async function OrganisationVolunteersPage() {
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

  const { data: interests } = await supabase
    .from("opportunity_interests")
    .select(
      "id,opportunity_id,volunteer_user_id,volunteer_name,volunteer_email,volunteer_phone,volunteer_city,volunteer_preferred_contact_method,volunteer_goals,volunteer_interests,volunteer_skills,volunteer_support_shared,volunteer_support_needs,message,status,created_at,updated_at",
    )
    .eq("organisation_user_id", user.id)
    .order("created_at", { ascending: false });

  const interestRows = (interests as InterestRow[] | null) ?? [];

  const opportunityIds = Array.from(
    new Set(
      interestRows
        .map((interest) => interest.opportunity_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  let opportunityRows: OpportunityRow[] = [];

  if (opportunityIds.length > 0) {
    const { data: opportunities } = await supabase
      .from("opportunities")
      .select("id,title,status")
      .eq("organisation_user_id", user.id)
      .in("id", opportunityIds);

    opportunityRows = (opportunities as OpportunityRow[] | null) ?? [];
  }

  const opportunityById = new Map(
    opportunityRows.map((opportunity) => [opportunity.id, opportunity]),
  );

  const volunteerIds = Array.from(
    new Set(
      interestRows
        .map((interest) => interest.volunteer_user_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  let reviewRows: ReviewRow[] = [];

  if (volunteerIds.length > 0) {
    const { data: reviews } = await supabase
      .from("volunteer_skill_reviews")
      .select(
        "id,opportunity_interest_id,opportunity_id,volunteer_user_id,volunteer_name,volunteer_email,opportunity_title,status,positive_comment,updated_at",
      )
      .eq("organisation_user_id", user.id)
      .in("volunteer_user_id", volunteerIds);

    reviewRows = (reviews as ReviewRow[] | null) ?? [];
  }

  const reviewsByVolunteerId = new Map<string, ReviewRow[]>();

  reviewRows.forEach((review) => {
    if (!review.volunteer_user_id) return;

    const existing = reviewsByVolunteerId.get(review.volunteer_user_id) ?? [];
    existing.push(review);
    reviewsByVolunteerId.set(review.volunteer_user_id, existing);
  });

  const groupedInterests = new Map<string, InterestRow[]>();

  interestRows.forEach((interest) => {
    const key = makeConnectionKey(interest);
    const existing = groupedInterests.get(key) ?? [];
    existing.push(interest);
    groupedInterests.set(key, existing);
  });

  const connections: VolunteerConnection[] = Array.from(
    groupedInterests.entries(),
  )
    .map(([key, rows]) => {
      const sortedRows = [...rows].sort(
        (a, b) =>
          Math.max(getTimestamp(b.updated_at), getTimestamp(b.created_at)) -
          Math.max(getTimestamp(a.updated_at), getTimestamp(a.created_at)),
      );

      const latest = sortedRows[0];
      const volunteerUserId = latest.volunteer_user_id || null;
      const volunteerReviews = volunteerUserId
        ? reviewsByVolunteerId.get(volunteerUserId) ?? []
        : [];

      const statuses = sortedRows.map((row) =>
        normaliseInterestStatus(row.status),
      );

      const latestActivityTimestamp = Math.max(
        ...sortedRows.map((row) =>
          Math.max(getTimestamp(row.updated_at), getTimestamp(row.created_at)),
        ),
        ...volunteerReviews.map((review) => getTimestamp(review.updated_at)),
      );

      const latestActivity =
        latestActivityTimestamp > 0
          ? new Date(latestActivityTimestamp).toISOString()
          : latest.created_at;

      const sharedReviewCount = volunteerReviews.filter(
        (review) => review.status === "shared",
      ).length;

      const draftReviewCount = volunteerReviews.filter(
        (review) => review.status === "draft",
      ).length;

      const hiddenReviewCount = volunteerReviews.filter(
        (review) => review.status === "hidden",
      ).length;

      return {
        key,
        volunteerUserId,
        name:
          latest.volunteer_name?.trim() ||
          fallbackVolunteerName(latest.volunteer_email),
        email: latest.volunteer_email?.trim() || "Email not available",
        phone: latest.volunteer_phone?.trim() || "",
        city: latest.volunteer_city?.trim() || "Area not shared",
        preferredContactMethod: formatContactMethod(
          latest.volunteer_preferred_contact_method,
        ),
        latestActivity,
        latestStatus: getLatestStatus(statuses),
        interestCount: sortedRows.length,
        acceptedCount: statuses.filter((status) => status === "accepted").length,
        contactedCount: statuses.filter((status) => status === "contacted").length,
        closedCount: statuses.filter((status) => status === "closed").length,
        sharedReviewCount,
        draftReviewCount,
        hiddenReviewCount,
        roles: sortedRows.map((interest) => {
          const opportunity = opportunityById.get(interest.opportunity_id);

          return {
            interestId: interest.id,
            opportunityId: interest.opportunity_id,
            title: opportunity?.title || "Role not available",
            status: normaliseInterestStatus(interest.status),
            createdAt: interest.created_at,
          };
        }),
        goals: uniqueList(sortedRows.map((row) => row.volunteer_goals)),
        interests: uniqueList(sortedRows.map((row) => row.volunteer_interests)),
        skills: uniqueList(sortedRows.map((row) => row.volunteer_skills)),
        supportShared: sortedRows.some(
          (row) => row.volunteer_support_shared === true,
        ),
        supportNeeds:
          sortedRows.find(
            (row) =>
              row.volunteer_support_shared === true &&
              row.volunteer_support_needs?.trim(),
          )?.volunteer_support_needs?.trim() || "",
      };
    })
    .sort(
      (a, b) =>
        getTimestamp(b.latestActivity) - getTimestamp(a.latestActivity),
    );

  const totalConnections = connections.length;
  const acceptedConnections = connections.filter(
    (connection) => connection.acceptedCount > 0,
  ).length;
  const reviewedConnections = connections.filter(
    (connection) => connection.sharedReviewCount > 0,
  ).length;
  const activeConnections = connections.filter(
    (connection) => connection.latestStatus !== "closed",
  ).length;

  const listenText =
    "This is the organisation volunteer connections page. It only shows volunteers who have interacted with your organisation through an interest or a positive skills review. It is not a public volunteer database and it does not show all volunteers on the platform. Each card shows the volunteer name, contact route, city, roles they connected with, status history and positive review counts. Support information is only shown if the volunteer chose to share it with your organisation.";

  return (
    <main className="dashboard-bg organisation-connections-page">
      <section className="dashboard-shell organisation-connections-shell">
        <header className="dashboard-topbar organisation-connections-topbar">
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

          <div className="dashboard-topbar-actions organisation-connections-actions">
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
          className="dashboard-welcome-card organisation-connections-hero"
          aria-labelledby="volunteer-connections-title"
        >
          <div className="dashboard-welcome-copy organisation-connections-copy">
            <p className="dashboard-kicker">Volunteer connections</p>

            <h1
              id="volunteer-connections-title"
              className="dashboard-title organisation-connections-title"
            >
              <span aria-hidden="true">👥</span>
              <span>People you’ve worked with</span>
            </h1>

            <p className="dashboard-lead organisation-connections-lead">
              See volunteers who have connected with your organisation through
              role interest or positive skills reviews. This is your organisation
              history only, not a platform-wide volunteer list.
            </p>

            <div className="dashboard-primary-actions organisation-connections-hero-actions">
              <Link
                href="/organisation/interests"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📬</span>
                  <span>Interest inbox</span>
                </span>
              </Link>

              <Link
                href="/organisation/opportunities"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">⭐</span>
                  <span>Roles & reviews</span>
                </span>
              </Link>
            </div>
          </div>

          <aside
            className="dashboard-progress-card organisation-connections-status"
            aria-label="Volunteer connection summary"
          >
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                🌱
              </span>
              <div>
                <h2>Connection summary</h2>
                <p>
                  {totalConnections} volunteer connection
                  {totalConnections === 1 ? "" : "s"} found.
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Active connections: <strong>{activeConnections}</strong>
            </p>
            <p className="dashboard-progress-note">
              Accepted volunteers: <strong>{acceptedConnections}</strong>
            </p>
            <p className="dashboard-progress-note">
              With shared reviews: <strong>{reviewedConnections}</strong>
            </p>
          </aside>
        </section>

        <section
          className="connection-privacy-card"
          aria-labelledby="connection-privacy-title"
        >
          <div className="connection-privacy-icon" aria-hidden="true">
            🛡️
          </div>

          <div>
            <p className="dashboard-kicker">Privacy and safety</p>
            <h2 id="connection-privacy-title">
              Only your organisation’s volunteer connections
            </h2>
            <p>
              This page only uses volunteers who have interacted with your
              organisation. Do not use it as a public volunteer search. Support
              information should only be used when the volunteer chose to share
              it for a role, and contact should remain kind, relevant and safe.
            </p>
          </div>
        </section>

        <section
          className="connection-stat-grid"
          aria-label="Volunteer connection statistics"
        >
          <StatCard
            icon="👥"
            label="Connections"
            value={totalConnections}
            helper="Volunteers linked to your organisation"
          />
          <StatCard
            icon="🌱"
            label="Active"
            value={activeConnections}
            helper="Not closed as latest status"
          />
          <StatCard
            icon="✅"
            label="Accepted"
            value={acceptedConnections}
            helper="At least one accepted role"
          />
          <StatCard
            icon="⭐"
            label="Reviewed"
            value={reviewedConnections}
            helper="At least one shared review"
          />
        </section>

        {connections.length === 0 ? (
          <section className="dashboard-grid" aria-label="No connections yet">
            <article className="info-card connection-empty-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                📬
              </div>

              <div className="dashboard-card-copy">
                <p className="dashboard-card-label">No volunteer connections yet</p>
                <h2>Connections will appear after volunteers show interest</h2>
                <p>
                  When volunteers express interest in your roles, or when you add
                  positive skills reviews, they will appear here as organisation
                  connections.
                </p>

                <Link
                  href="/organisation/opportunities/new"
                  className="primary-button connection-empty-action"
                >
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">📣</span>
                    <span>Create a role</span>
                  </span>
                </Link>
              </div>
            </article>
          </section>
        ) : (
          <section
            className="connection-list"
            aria-label="Organisation volunteer connections"
          >
            {connections.map((connection) => (
              <article key={connection.key} className="info-card connection-card">
                <div className="connection-card-header">
                  <div className="connection-person">
                    <span className="dashboard-card-icon" aria-hidden="true">
                      {getStatusIcon(connection.latestStatus)}
                    </span>

                    <div>
                      <p className="dashboard-card-label">
                        Latest status: {formatInterestStatus(connection.latestStatus)}
                      </p>
                      <h2>{connection.name}</h2>
                      <p>
                        {connection.email}
                        {connection.city ? ` · ${connection.city}` : ""}
                      </p>
                    </div>
                  </div>

                  <span className={getStatusClass(connection.latestStatus)}>
                    {formatInterestStatus(connection.latestStatus)}
                  </span>
                </div>

                <div className="connection-summary-grid">
                  <div>
                    <span aria-hidden="true">📬</span>
                    <p>Interests</p>
                    <strong>{connection.interestCount}</strong>
                  </div>
                  <div>
                    <span aria-hidden="true">✅</span>
                    <p>Accepted</p>
                    <strong>{connection.acceptedCount}</strong>
                  </div>
                  <div>
                    <span aria-hidden="true">⭐</span>
                    <p>Shared reviews</p>
                    <strong>{connection.sharedReviewCount}</strong>
                  </div>
                  <div>
                    <span aria-hidden="true">📅</span>
                    <p>Last activity</p>
                    <strong>{safeDate(connection.latestActivity)}</strong>
                  </div>
                </div>

                <section
                  className="connection-section"
                  aria-label={`Contact details for ${connection.name}`}
                >
                  <div className="connection-section-heading">
                    <span aria-hidden="true">📞</span>
                    <div>
                      <h3>Contact route</h3>
                      <p>
                        Preferred contact:{" "}
                        <strong>{connection.preferredContactMethod}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="connection-contact-grid">
                    <p>
                      <strong>Email:</strong> {connection.email}
                    </p>
                    <p>
                      <strong>Phone/text:</strong>{" "}
                      {connection.phone || "Not supplied or not shared"}
                    </p>
                  </div>
                </section>

                <section
                  className="connection-section"
                  aria-label={`Roles linked to ${connection.name}`}
                >
                  <div className="connection-section-heading">
                    <span aria-hidden="true">📣</span>
                    <div>
                      <h3>Roles connected with</h3>
                      <p>
                        These are the roles where this volunteer expressed
                        interest with your organisation.
                      </p>
                    </div>
                  </div>

                  <div className="connection-role-list">
                    {connection.roles.map((role) => (
                      <Link
                        key={role.interestId}
                        href={`/organisation/interests/${role.interestId}`}
                        className="connection-role-row"
                      >
                        <span aria-hidden="true">{getStatusIcon(role.status)}</span>
                        <div>
                          <strong>{role.title}</strong>
                          <small>
                            {formatInterestStatus(role.status)} · Received{" "}
                            {safeDate(role.createdAt)}
                          </small>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>

                <section
                  className="connection-section"
                  aria-label={`Profile snapshot for ${connection.name}`}
                >
                  <div className="connection-section-heading">
                    <span aria-hidden="true">🌈</span>
                    <div>
                      <h3>Volunteer snapshot</h3>
                      <p>
                        Use this as context for support and pathway evidence,
                        not as a ranking.
                      </p>
                    </div>
                  </div>

                  <div className="connection-snapshot-grid">
                    <div>
                      <h4>Goals</h4>
                      <ChipList
                        values={connection.goals}
                        emptyText="No goals shared."
                      />
                    </div>

                    <div>
                      <h4>Interests</h4>
                      <ChipList
                        values={connection.interests}
                        emptyText="No interests shared."
                      />
                    </div>

                    <div>
                      <h4>Skills</h4>
                      <ChipList
                        values={connection.skills}
                        emptyText="No skills shared."
                      />
                    </div>
                  </div>
                </section>

                {connection.supportShared ? (
                  <section className="connection-support-card">
                    <span aria-hidden="true">💛</span>
                    <div>
                      <h3>Shared support notes</h3>
                      <p>
                        {connection.supportNeeds ||
                          "Support was marked as shared, but no details are currently available."}
                      </p>
                    </div>
                  </section>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </section>

      <style>{`
        .organisation-connections-page,
        .organisation-connections-page * {
          box-sizing: border-box;
        }

        .organisation-connections-page {
          overflow-x: hidden;
        }

        .organisation-connections-shell {
          width: min(1180px, calc(100% - 32px));
        }

        .organisation-connections-actions {
          gap: 12px;
        }

        .organisation-connections-hero,
        .organisation-connections-status,
        .connection-privacy-card,
        .connection-card,
        .connection-section,
        .connection-support-card {
          overflow: hidden;
        }

        .organisation-connections-copy,
        .organisation-connections-status,
        .organisation-connections-status *,
        .connection-card,
        .connection-card *,
        .connection-privacy-card,
        .connection-privacy-card * {
          min-width: 0;
        }

        .organisation-connections-title {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .organisation-connections-title span:last-child {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .organisation-connections-hero-actions {
          gap: 12px;
          margin-top: 18px;
        }

        .connection-privacy-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
          padding: 22px;
          border: 1px solid rgba(34, 124, 78, 0.24);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.4), transparent 32%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.94), rgba(255, 255, 255, 0.9));
          box-shadow: 0 18px 42px rgba(33, 96, 61, 0.1);
        }

        .connection-privacy-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.16);
          font-size: 1.9rem;
        }

        .connection-privacy-card h2 {
          margin: 0 0 8px;
          color: #145c38;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .connection-privacy-card p {
          margin: 0;
          color: #275f45;
          font-weight: 780;
          line-height: 1.5;
        }

        .connection-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .connection-stat-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          min-height: 118px;
          padding: 14px;
          border: 1px solid rgba(143, 178, 158, 0.2);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 14px 36px rgba(33, 56, 48, 0.06);
        }

        .connection-stat-card > span {
          display: inline-flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: rgba(143, 178, 158, 0.13);
          font-size: 1.25rem;
        }

        .connection-stat-card p {
          margin: 0 0 5px;
          color: #60706a;
          font-size: 0.82rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .connection-stat-card strong {
          display: block;
          color: #315f48;
          font-size: 1.85rem;
          line-height: 1;
        }

        .connection-stat-card small {
          display: block;
          margin-top: 8px;
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.25;
        }

        .connection-list {
          display: grid;
          gap: 18px;
        }

        .connection-card {
          display: grid;
          gap: 18px;
          border-radius: 28px;
        }

        .connection-card-header {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-start;
          justify-content: space-between;
        }

        .connection-person {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
          min-width: 0;
        }

        .connection-person h2 {
          margin: 0 0 6px;
          color: #315f48;
          overflow-wrap: anywhere;
        }

        .connection-person p {
          margin: 0;
          color: #60706a;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .connection-status {
          display: inline-flex;
          min-height: 36px;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 0.86rem;
          font-weight: 950;
          line-height: 1.1;
          white-space: nowrap;
        }

        .connection-status.new {
          border: 1px solid rgba(108, 92, 160, 0.18);
          background: rgba(248, 245, 255, 0.96);
          color: #6c5ca0;
        }

        .connection-status.contacted {
          border: 1px solid rgba(74, 112, 160, 0.22);
          background: rgba(243, 249, 255, 0.96);
          color: #4a70a0;
        }

        .connection-status.accepted {
          border: 1px solid rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.96);
          color: #536f63;
        }

        .connection-status.closed {
          border: 1px solid rgba(100, 100, 110, 0.18);
          background: rgba(248, 248, 252, 0.96);
          color: #5d6677;
        }

        .connection-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .connection-summary-grid div {
          display: grid;
          gap: 5px;
          min-height: 98px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.74);
        }

        .connection-summary-grid span {
          display: inline-flex;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.2rem;
        }

        .connection-summary-grid p {
          margin: 0;
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 900;
          line-height: 1.1;
        }

        .connection-summary-grid strong {
          color: #315f48;
          font-size: 1.05rem;
          line-height: 1.18;
          overflow-wrap: anywhere;
        }

        .connection-section {
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.7);
        }

        .connection-section-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
        }

        .connection-section-heading > span {
          display: inline-flex;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.45rem;
        }

        .connection-section-heading h3 {
          margin: 0 0 5px;
          color: #315f48;
          font-size: 1.12rem;
          font-weight: 950;
          line-height: 1.15;
        }

        .connection-section-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.4;
        }

        .connection-contact-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .connection-contact-grid p {
          margin: 0;
          padding: 12px;
          border-radius: 16px;
          background: rgba(248, 248, 252, 0.82);
          color: #60706a;
          font-weight: 750;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .connection-role-list {
          display: grid;
          gap: 10px;
        }

        .connection-role-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
          color: inherit;
          text-decoration: none;
          transition:
            border-color 160ms ease,
            background 160ms ease,
            transform 160ms ease;
        }

        .connection-role-row:hover {
          transform: translateY(-1px);
          border-color: rgba(83, 111, 99, 0.28);
          background: rgba(244, 255, 249, 0.86);
        }

        .connection-role-row > span {
          display: inline-flex;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.2rem;
        }

        .connection-role-row strong {
          display: block;
          margin-bottom: 4px;
          color: #315f48;
          font-weight: 950;
          line-height: 1.18;
          overflow-wrap: anywhere;
        }

        .connection-role-row small {
          color: #60706a;
          font-weight: 750;
          line-height: 1.3;
        }

        .connection-snapshot-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .connection-snapshot-grid h4 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: 0.92rem;
          font-weight: 950;
        }

        .connection-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .connection-chip {
          display: inline-flex;
          max-width: 100%;
          padding: 8px 10px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.86);
          color: #536f63;
          font-size: 0.82rem;
          font-weight: 850;
          line-height: 1.15;
        }

        .connection-chip-more {
          background: rgba(248, 248, 252, 0.92);
          color: #6c5ca0;
        }

        .connection-muted {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.4;
        }

        .connection-support-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          padding: 16px;
          border: 1px solid rgba(34, 124, 78, 0.22);
          border-radius: 22px;
          background: rgba(244, 255, 249, 0.88);
        }

        .connection-support-card > span {
          display: inline-flex;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          background: rgba(34, 124, 78, 0.12);
          font-size: 1.45rem;
        }

        .connection-support-card h3 {
          margin: 0 0 6px;
          color: #145c38;
          font-size: 1.05rem;
          font-weight: 950;
        }

        .connection-support-card p {
          margin: 0;
          color: #275f45;
          font-weight: 750;
          line-height: 1.45;
        }

        .connection-empty-card {
          min-height: 230px;
          align-items: center;
        }

        .connection-empty-action {
          width: fit-content;
          margin-top: 8px;
        }

        @media (max-width: 980px) {
          .connection-stat-grid,
          .connection-summary-grid,
          .connection-snapshot-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .organisation-connections-shell {
            width: 100%;
            max-width: 100%;
            padding: 18px 16px 40px;
          }

          .organisation-connections-topbar {
            gap: 14px;
          }

          .organisation-connections-actions {
            width: 100%;
            justify-content: stretch;
          }

          .organisation-connections-actions > *,
          .organisation-connections-actions a,
          .organisation-connections-actions button {
            width: 100%;
          }

          .organisation-connections-hero {
            padding: 24px 20px;
            border-radius: 30px;
          }

          .organisation-connections-title {
            font-size: 2.25rem !important;
            line-height: 1.04 !important;
          }

          .organisation-connections-lead {
            font-size: 1rem !important;
            line-height: 1.48 !important;
          }

          .organisation-connections-hero-actions {
            width: 100%;
          }

          .organisation-connections-hero-actions .primary-button,
          .organisation-connections-hero-actions .secondary-button {
            width: 100%;
          }

          .connection-privacy-card,
          .connection-section-heading,
          .connection-support-card {
            grid-template-columns: 1fr;
          }

          .connection-privacy-card {
            padding: 18px;
            border-radius: 24px;
          }

          .connection-privacy-icon {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .connection-stat-grid,
          .connection-summary-grid,
          .connection-contact-grid,
          .connection-snapshot-grid {
            grid-template-columns: 1fr;
          }

          .connection-card {
            padding: 20px;
          }

          .connection-card-header,
          .connection-person {
            display: grid;
          }

          .connection-status {
            width: 100%;
          }

          .connection-section {
            padding: 14px;
            border-radius: 20px;
          }

          .connection-empty-action {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .organisation-connections-shell {
            padding-left: 14px;
            padding-right: 14px;
          }

          .organisation-connections-hero {
            padding: 22px 18px;
            border-radius: 28px;
          }

          .organisation-connections-title {
            font-size: 2rem !important;
          }
        }
      `}</style>
    </main>
  );
}
