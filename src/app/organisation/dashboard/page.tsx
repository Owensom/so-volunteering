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
    "You are on the organisation dashboard. This is your workspace for creating volunteering roles and reviewing volunteer interest. First, check the Workspace status card. It shows whether your organisation profile is complete, how many roles are published, how many are drafts, and how many new volunteer interests need review. Use the Create role button to make a new volunteering role. Use the View interest button to open the interest inbox. The cards below give quick links. Organisation profile lets you review your organisation details. Create a role opens the role setup form. Opportunity list shows draft, published and closed roles. Interest inbox shows volunteers who have clicked I’m interested. Volunteer matches is a later feature.";

  return (
    <main className="dashboard-bg organisation-dashboard-page">
      <section className="dashboard-shell organisation-dashboard-shell">
        <header className="dashboard-topbar organisation-topbar">
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

          <div className="dashboard-topbar-actions organisation-topbar-actions">
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
          className="dashboard-welcome-card organisation-hero-card"
          aria-labelledby="organisation-dashboard-title"
        >
          <div className="dashboard-welcome-copy organisation-hero-copy">
            <p className="dashboard-kicker organisation-kicker">
              Organisation workspace
            </p>

            <h1
              id="organisation-dashboard-title"
              className="dashboard-title organisation-hero-title"
            >
              <span aria-hidden="true">🏢</span>
              <span>Build inclusive opportunities</span>
            </h1>

            <p className="dashboard-lead organisation-hero-lead">
              Hi {displayName}. Create accessible volunteering roles, review
              volunteer interest, and keep support information clear from the
              start.
            </p>

            <div className="dashboard-primary-actions organisation-hero-actions">
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
            className="dashboard-progress-card organisation-status-card"
            aria-label="Organisation profile status"
          >
            <div className="dashboard-progress-header organisation-status-header">
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
              <p className="dashboard-progress-note organisation-status-note">
                {emailAddress}
              </p>
            ) : (
              <p className="dashboard-progress-note organisation-status-note">
                Email not available.
              </p>
            )}

            <p className="dashboard-progress-note organisation-status-note">
              Published roles: <strong>{publishedCount}</strong>
            </p>
            <p className="dashboard-progress-note organisation-status-note">
              Draft roles: <strong>{draftCount}</strong>
            </p>
            <p className="dashboard-progress-note organisation-status-note">
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
        .organisation-dashboard-page,
        .organisation-dashboard-page * {
          box-sizing: border-box;
        }

        .organisation-dashboard-page {
          overflow-x: hidden;
        }

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
          min-width: 0;
        }

        .organisation-card-main h2 {
          margin-bottom: 0;
          overflow-wrap: anywhere;
        }

        .organisation-card-main p:last-child {
          margin: 0;
        }

        .organisation-card .card-action,
        .organisation-card .dashboard-muted-action {
          margin-top: auto !important;
        }

        .organisation-hero-card,
        .organisation-status-card {
          overflow: hidden;
        }

        .organisation-hero-copy,
        .organisation-status-card,
        .organisation-status-card * {
          min-width: 0;
        }

        .organisation-status-note {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        @media (max-width: 760px) {
          .organisation-dashboard-shell {
            width: 100%;
            max-width: 100%;
            padding: 18px 16px 40px;
          }

          .organisation-topbar {
            gap: 14px;
          }

          .organisation-topbar-actions {
            width: 100%;
            justify-content: stretch;
          }

          .organisation-topbar-actions > *,
          .organisation-topbar-actions form,
          .organisation-topbar-actions button {
            width: 100%;
          }

          .organisation-hero-card {
            display: grid;
            grid-template-columns: 1fr;
            gap: 18px;
            width: 100%;
            padding: 24px 20px;
            border-radius: 30px;
          }

          .organisation-kicker {
            font-size: 0.78rem;
            line-height: 1.25;
            letter-spacing: 0.2em;
          }

          .organisation-hero-title {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            max-width: 100%;
            font-size: 2.2rem !important;
            line-height: 1.03 !important;
            letter-spacing: -0.045em !important;
            overflow-wrap: normal;
            word-break: normal;
            hyphens: none;
          }

          .organisation-hero-title span:last-child {
            min-width: 0;
            max-width: 100%;
          }

          .organisation-hero-lead {
            max-width: 100%;
            font-size: 1.05rem !important;
            line-height: 1.5 !important;
            letter-spacing: 0;
            overflow-wrap: normal;
            word-break: normal;
          }

          .organisation-hero-actions {
            width: 100%;
            gap: 12px;
          }

          .organisation-hero-actions .dashboard-main-action {
            width: 100%;
            min-height: 58px;
          }

          .organisation-status-card {
            width: 100%;
            padding: 18px;
            border-radius: 24px;
          }

          .organisation-status-header {
            align-items: flex-start;
            gap: 12px;
          }

          .organisation-status-header h2 {
            font-size: 1.35rem !important;
            line-height: 1.1 !important;
            letter-spacing: -0.02em;
            overflow-wrap: normal;
          }

          .organisation-status-header p,
          .organisation-status-note {
            font-size: 0.98rem !important;
            line-height: 1.35 !important;
            letter-spacing: 0;
          }

          .organisation-status-note {
            margin-top: 9px;
          }

          .organisation-card {
            min-height: 0;
            padding: 20px;
          }

          .organisation-card-copy {
            gap: 14px;
          }

          .organisation-card-main h2 {
            font-size: 1.35rem !important;
            line-height: 1.14 !important;
          }

          .organisation-card-main p {
            font-size: 0.98rem !important;
            line-height: 1.45 !important;
          }
        }

        @media (max-width: 420px) {
          .organisation-dashboard-shell {
            padding-left: 14px;
            padding-right: 14px;
          }

          .organisation-hero-card {
            padding: 22px 18px;
            border-radius: 28px;
          }

          .organisation-hero-title {
            font-size: 2rem !important;
            line-height: 1.04 !important;
          }

          .organisation-hero-lead {
            font-size: 1rem !important;
            line-height: 1.48 !important;
          }

          .organisation-status-card {
            padding: 16px;
          }
        }

        @media (max-width: 360px) {
          .organisation-hero-title {
            font-size: 1.82rem !important;
          }

          .organisation-hero-lead {
            font-size: 0.96rem !important;
          }
        }
      `}</style>
    </main>
  );
}
