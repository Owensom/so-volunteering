import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  full_name: string | null;
  email: string | null;
  user_type: string | null;
};

type OrganisationProfile = {
  organisation_name: string | null;
  contact_email: string | null;
  profile_completed: boolean | null;
};

type OpportunitySummary = {
  status: string;
};

type OrganisationCardProps = {
  href?: string;
  icon: string;
  label: string;
  title: string;
  description: string;
  action: string;
  muted?: boolean;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function OrganisationCard({
  href,
  icon,
  label,
  title,
  description,
  action,
  muted = false
}: OrganisationCardProps) {
  const content = (
    <>
      <div
        className="dashboard-card-icon organisation-card-icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="dashboard-card-copy organisation-card-copy">
        <div className="organisation-card-main">
          <p className="dashboard-card-label">{label}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <p className={muted ? "dashboard-muted-action" : "card-action text-link"}>
          {action}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="info-card dashboard-pathway-card organisation-card"
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="info-card dashboard-pathway-card organisation-card">
      {content}
    </article>
  );
}

export default async function OrganisationDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,user_type")
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

  const { data: organisationProfile } = await supabase
    .from("organisation_profiles")
    .select("organisation_name,contact_email,profile_completed")
    .eq("user_id", user.id)
    .maybeSingle<OrganisationProfile>();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("status")
    .eq("organisation_user_id", user.id);

  const opportunityRows = (opportunities as OpportunitySummary[] | null) ?? [];
  const publishedCount = opportunityRows.filter(
    (opportunity) => opportunity.status === "published"
  ).length;
  const draftCount = opportunityRows.filter(
    (opportunity) => opportunity.status === "draft"
  ).length;

  const displayName =
    organisationProfile?.organisation_name?.trim() ||
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "there";

  const emailAddress =
    organisationProfile?.contact_email?.trim() ||
    profile?.email?.trim() ||
    user.email ||
    "";

  const profileCompleted = organisationProfile?.profile_completed === true;

  const listenText =
    "This is the organisation workspace for SO Volunteering. This page helps organisations set up their profile, create inclusive volunteering roles, add support and safety information, and later review volunteer interest. The organisation profile button opens profile setup. The create role button opens opportunity creation.";

  return (
    <main className="dashboard-bg">
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/organisation/dashboard"
            className="dashboard-brand"
            aria-label="SO Volunteering organisation dashboard"
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

            <form action={signOut}>
              <button
                type="submit"
                className="secondary-button dashboard-signout-button"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🚪</span>
                  <span>Sign out</span>
                </span>
              </button>
            </form>
          </div>
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="organisation-dashboard-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Organisation workspace</p>

            <h1 id="organisation-dashboard-title" className="dashboard-title">
              <span aria-hidden="true">🏢</span>
              <span>Build inclusive opportunities</span>
            </h1>

            <p className="dashboard-lead">
              Hi {displayName}. Set up your organisation profile and create
              clear, accessible volunteering roles with support built in from
              the beginning.
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/organisation/profile"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🏢</span>
                  <span>
                    {profileCompleted
                      ? "Edit organisation profile"
                      : "Set up organisation"}
                  </span>
                </span>
              </Link>

              <Link
                href="/organisation/opportunities/new"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📣</span>
                  <span>Create role</span>
                </span>
              </Link>
            </div>
          </div>

          <aside
            className="dashboard-progress-card"
            aria-label="Organisation profile status"
          >
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>

              <div>
                <h2>Profile status</h2>
                <p>
                  Status:{" "}
                  <strong>{profileCompleted ? "Complete" : "Needs setup"}</strong>
                </p>
              </div>
            </div>

            {emailAddress ? (
              <p className="dashboard-progress-note">{emailAddress}</p>
            ) : (
              <p className="dashboard-progress-note">Email not available.</p>
            )}

            <p className="dashboard-progress-note">
              Published roles: <strong>{publishedCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Draft roles: <strong>{draftCount}</strong>
            </p>
          </aside>
        </section>

        <section
          id="organisation-setup"
          className="dashboard-grid organisation-card-grid"
          aria-label="Organisation setup priorities"
        >
          <OrganisationCard
            href="/organisation/profile"
            icon="🏢"
            label="Priority 1"
            title="Organisation profile"
            description="Add your name, purpose, location and contact details so volunteers know who you are."
            action={profileCompleted ? "Review profile" : "Start profile"}
          />

          <OrganisationCard
            href="/organisation/profile"
            icon="💛"
            label="Priority 2"
            title="Inclusion and support"
            description="Describe the support volunteers can expect before, during and after their role."
            action="Review support"
          />

          <OrganisationCard
            href="/organisation/profile"
            icon="🛡️"
            label="Priority 3"
            title="Safety basics"
            description="Add supervision and safeguarding notes so volunteers know who can help."
            action="Review safety"
          />
        </section>

        <section
          id="organisation-build-plan"
          className="dashboard-grid organisation-card-grid"
          aria-label="Organisation opportunity build plan"
        >
          <OrganisationCard
            href="/organisation/opportunities/new"
            icon="📣"
            label="Opportunities"
            title="Create a role"
            description="Build plain-language roles with tasks, timings, skills and support notes."
            action="Create role"
          />

          <OrganisationCard
            href="/organisation/opportunities"
            icon="✅"
            label="Readiness"
            title="Opportunity list"
            description="Review draft and published roles before volunteers can browse them."
            action="View roles"
          />

          <OrganisationCard
            icon="🤝"
            label="Matching"
            title="Volunteer matches"
            description="Match roles with volunteer interests, skills, availability and support preferences."
            action="Later phase"
            muted
          />
        </section>
      </section>

      <style>{`
        .organisation-card-grid {
          align-items: stretch;
        }

        .organisation-card {
          min-height: 224px;
          height: 100%;
          align-items: stretch;
        }

        .organisation-card-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .organisation-card-main {
          display: grid;
          gap: 8px;
        }

        .organisation-card-main h2 {
          margin-bottom: 0;
        }

        .organisation-card-main p:last-child {
          margin: 0;
        }

        .organisation-card .card-action,
        .organisation-card .dashboard-muted-action {
          margin-top: auto !important;
        }

        @media (max-width: 640px) {
          .organisation-card {
            min-height: 0;
          }

          .organisation-card-copy {
            gap: 14px;
          }
        }
      `}</style>
    </main>
  );
}
