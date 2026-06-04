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

type InterestSummary = {
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

  const { data: interests } = await supabase
    .from("opportunity_interests")
    .select("status")
    .eq("organisation_user_id", user.id);

  const opportunityRows = (opportunities as OpportunitySummary[] | null) ?? [];
  const interestRows = (interests as InterestSummary[] | null) ?? [];

  const publishedCount = opportunityRows.filter(
    (opportunity) => opportunity.status === "published"
  ).length;

  const draftCount = opportunityRows.filter(
    (opportunity) => opportunity.status === "draft"
  ).length;

  const newInterestCount = interestRows.filter(
    (interest) => interest.status === "new"
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
    "You are on the organisation dashboard. This is your workspace for creating volunteering roles and reviewing volunteer interest. First, check the Workspace status card on the right. It shows whether your organisation profile is complete, how many roles are published, how many are drafts, and how many new volunteer interests need review. Use the Create role button to make a new volunteering role. Use the View interest button to open the interest inbox. The cards below give quick links. Organisation profile lets you review your organisation details. Create a role opens the role setup form. Opportunity list shows draft, published and closed roles. Interest inbox shows volunteers who have clicked I’m interested. Volunteer matches is a later feature.";

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
              Hi {displayName}. Create accessible volunteering roles, review
              volunteer interest, and keep support information clear from the
              start.
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/organisation/opportunities/new"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📣</span>
                  <span>Create role</span>
                </span>
              </Link>

              <Link
                href="/organisation/interests"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📬</span>
                  <span>View interest</span>
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
                <h2>Workspace status</h2>
                <p>
                  Profile:{" "}
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
            <p className="dashboard-progress-note">
              New interest: <strong>{newInterestCount}</strong>
            </p>
          </aside>
        </section>

        <section
          className="dashboard-grid organisation-card-grid"
          aria-label="Organisation workspace actions"
        >
          <OrganisationCard
            href="/organisation/profile"
            icon="🏢"
            label="Profile"
            title="Organisation profile"
            description="Review your name, purpose, location, contact details and support approach."
            action={profileCompleted ? "Review profile" : "Start profile"}
          />

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
            label="Role list"
            title="Opportunity list"
            description="Review draft, published and closed roles before volunteers respond."
            action="View roles"
          />

          <OrganisationCard
            href="/organisation/interests"
            icon="📬"
            label="Volunteer interest"
            title="Interest inbox"
            description="See volunteers who have expressed interest in your published roles."
            action="View interest"
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
