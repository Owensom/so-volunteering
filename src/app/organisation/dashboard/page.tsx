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

type SupportAdminRow = {
  user_id: string;
};

type SupportRequestSummary = {
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
  highlight?: boolean;
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
  muted = false,
  highlight = false
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

  const className = highlight
    ? "info-card dashboard-pathway-card organisation-card organisation-owner-card"
    : "info-card dashboard-pathway-card organisation-card";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
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

  const { data: supportAdmin } = await supabase
    .from("support_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle<SupportAdminRow>();

  const isSupportAdmin = Boolean(supportAdmin);

  const { data: supportRequests } = isSupportAdmin
    ? await supabase
        .from("support_requests")
        .select("status")
        .in("status", ["new", "reviewing"])
    : { data: null };

  const supportRequestRows =
    (supportRequests as SupportRequestSummary[] | null) ?? [];

  const activeSupportRequestCount = supportRequestRows.length;

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

  const listenText = isSupportAdmin
    ? "You are on the organisation dashboard. This is your workspace for creating volunteering roles and reviewing volunteer interest. You also have owner access to the app help inbox. Use App help inbox to review help requests submitted through Help using the app. Keep this separate from volunteer wellbeing and support preferences."
    : "You are on the organisation dashboard. This is your workspace for creating volunteering roles and reviewing volunteer interest. First, check the Workspace status card. It shows whether your organisation profile is complete, how many roles are published, how many are drafts, and how many new volunteer interests need review. Use the Create role button to make a new volunteering role. Use the View interest button to open the interest inbox. The cards below give quick links. Organisation profile lets you review your organisation details. Create a role opens the role setup form. Opportunity list shows draft, published and closed roles. Interest inbox shows volunteers who have clicked I’m interested. Help using the app is for getting help if you are stuck, something is not working, or you want to report a problem with SO Volunteering. Volunteer matches is a later feature.";

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
              <span className="organisation-desktop-title">
                Build inclusive opportunities
              </span>
              <span className="organisation-mobile-title">Your workspace</span>
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

              <Link href="/help" className="secondary-button dashboard-main-action">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🧭</span>
                  <span>Help using the app</span>
                </span>
              </Link>

              {isSupportAdmin ? (
                <Link
                  href="/admin/app-help"
                  className="secondary-button dashboard-main-action owner-inbox-action"
                >
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">🛡️</span>
                    <span>App help inbox</span>
                  </span>
                </Link>
              ) : null}
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

            {isSupportAdmin ? (
              <p className="dashboard-progress-note organisation-status-note">
                Open app help: <strong>{activeSupportRequestCount}</strong>
              </p>
            ) : null}
          </aside>
        </section>

        {isSupportAdmin ? (
          <section
            className="owner-tools-strip"
            aria-label="Owner tools"
          >
            <div>
              <p className="dashboard-kicker">Owner tools</p>
              <h2>App help inbox</h2>
              <p>
                Review help requests submitted through Help using the app. Keep
                these separate from volunteer wellbeing and support preferences.
              </p>
            </div>

            <Link href="/admin/app-help" className="primary-button">
              <span className="dashboard-button-inner">
                <span aria-hidden="true">🛡️</span>
                <span>
                  Open inbox
                  {activeSupportRequestCount > 0
                    ? ` (${activeSupportRequestCount})`
                    : ""}
                </span>
              </span>
            </Link>
          </section>
        ) : null}

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
            href="/help"
            icon="🧭"
            label="App help"
            title="Help using the app"
            description="Get help if you are stuck, something is not working, or you want to report a problem with SO Volunteering."
            action="Open help page"
          />

          {isSupportAdmin ? (
            <OrganisationCard
              href="/admin/app-help"
              icon="🛡️"
              label="Owner tools"
              title="App help inbox"
              description={
                activeSupportRequestCount > 0
                  ? `${activeSupportRequestCount} open help request${activeSupportRequestCount === 1 ? "" : "s"} need review.`
                  : "Review and update app help requests submitted by volunteers and organisations."
              }
              action="Open inbox"
              highlight
            />
          ) : null}

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

        .organisation-mobile-title {
          display: none;
        }

        .organisation-card-grid {
          align-items: stretch;
        }

        .organisation-card {
          min-height: 224px;
          height: 100%;
          align-items: stretch;
        }

        .organisation-owner-card {
          border-color: rgba(83, 111, 99, 0.28);
          background:
            radial-gradient(circle at top left, rgba(244, 255, 249, 0.96), transparent 46%),
            rgba(255, 255, 255, 0.92);
          box-shadow:
            0 18px 42px rgba(33, 56, 48, 0.1),
            0 0 0 4px rgba(83, 111, 99, 0.06);
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

        .owner-inbox-action {
          border-color: rgba(83, 111, 99, 0.28);
          background: rgba(244, 255, 249, 0.94);
        }

        .owner-tools-strip {
          display: flex;
          gap: 18px;
          align-items: center;
          justify-content: space-between;
          padding: 20px 22px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(244, 255, 249, 0.96), transparent 42%),
            rgba(255, 255, 255, 0.86);
          box-shadow: 0 18px 42px rgba(33, 56, 48, 0.08);
        }

        .owner-tools-strip h2 {
          margin: 0;
          color: #536f63;
          font-size: 1.35rem;
          line-height: 1.15;
        }

        .owner-tools-strip p {
          margin: 6px 0 0;
          color: #5d6677;
          font-weight: 700;
          line-height: 1.45;
        }

        .owner-tools-strip .primary-button {
          flex: 0 0 auto;
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

          .organisation-desktop-title {
            display: none;
          }

          .organisation-mobile-title {
            display: inline;
          }

          .organisation-hero-title {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            max-width: 100%;
            font-size: 2.45rem !important;
            line-height: 1.02 !important;
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
            font-size: 1.02rem !important;
            line-height: 1.48 !important;
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

          .owner-tools-strip {
            display: grid;
            gap: 16px;
            padding: 18px;
          }

          .owner-tools-strip .primary-button {
            width: 100%;
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
            font-size: 2.2rem !important;
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
            font-size: 2rem !important;
          }

          .organisation-hero-lead {
            font-size: 0.96rem !important;
          }
        }
      `}</style>
    </main>
  );
}
