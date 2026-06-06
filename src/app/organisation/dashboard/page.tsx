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

type ReviewSummary = {
  status: string | null;
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

function normaliseInterestStatus(status: string | null | undefined) {
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

  const { data: reviews } = await supabase
    .from("volunteer_skill_reviews")
    .select("status")
    .eq("organisation_user_id", user.id);

  const opportunityRows = (opportunities as OpportunitySummary[] | null) ?? [];
  const interestRows = (interests as InterestSummary[] | null) ?? [];
  const reviewRows = (reviews as ReviewSummary[] | null) ?? [];

  const publishedCount = opportunityRows.filter(
    (opportunity) => opportunity.status === "published"
  ).length;

  const draftCount = opportunityRows.filter(
    (opportunity) => opportunity.status === "draft"
  ).length;

  const closedRoleCount = opportunityRows.filter(
    (opportunity) => opportunity.status === "closed"
  ).length;

  const newInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "new"
  ).length;

  const contactedInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "contacted"
  ).length;

  const acceptedInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "accepted"
  ).length;

  const closedInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "closed"
  ).length;

  const sharedReviewCount = reviewRows.filter(
    (review) => review.status === "shared"
  ).length;

  const draftReviewCount = reviewRows.filter(
    (review) => review.status === "draft"
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
    "You are on the organisation dashboard. This is your workspace for creating volunteering roles, reviewing volunteer interest, accepting or contacting volunteers, and adding positive skills evidence. First, check the Workspace status card. It shows whether your organisation profile is complete, how many roles are published or in draft, how many volunteer interests are new, contacted, accepted or closed, and how many shared skills reviews have been saved. Use Create role to make a new inclusive volunteering role. Use Interest inbox to review volunteers who clicked I’m interested. Use Opportunity list to edit roles and open volunteers and reviews for each role. Help using the app is for getting support if you are stuck, something is not working, or you want to report a problem with SO Volunteering.";

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
              volunteer interest, move people forward kindly, and add positive
              skills evidence after they help.
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

              <Link href="/help" className="secondary-button dashboard-main-action">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🧭</span>
                  <span>Help using the app</span>
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

            <div className="organisation-status-divider" />

            <p className="dashboard-progress-note organisation-status-note">
              Published roles: <strong>{publishedCount}</strong>
            </p>
            <p className="dashboard-progress-note organisation-status-note">
              Draft roles: <strong>{draftCount}</strong>
            </p>
            <p className="dashboard-progress-note organisation-status-note">
              Closed roles: <strong>{closedRoleCount}</strong>
            </p>

            <div className="organisation-status-divider" />

            <p className="dashboard-progress-note organisation-status-note">
              New interest: <strong>{newInterestCount}</strong>
            </p>
            <p className="dashboard-progress-note organisation-status-note">
              Contacted: <strong>{contactedInterestCount}</strong>
            </p>
            <p className="dashboard-progress-note organisation-status-note">
              Accepted: <strong>{acceptedInterestCount}</strong>
            </p>
            <p className="dashboard-progress-note organisation-status-note">
              Closed interest: <strong>{closedInterestCount}</strong>
            </p>

            <div className="organisation-status-divider" />

            <p className="dashboard-progress-note organisation-status-note">
              Shared skills reviews: <strong>{sharedReviewCount}</strong>
            </p>
            <p className="dashboard-progress-note organisation-status-note">
              Draft skills reviews: <strong>{draftReviewCount}</strong>
            </p>
          </aside>
        </section>

        <section
          className="organisation-workflow-panel"
          aria-labelledby="organisation-workflow-title"
        >
          <div className="organisation-workflow-heading">
            <span className="organisation-workflow-icon" aria-hidden="true">
              🌈
            </span>

            <div>
              <p className="dashboard-kicker">Inclusive workflow</p>
              <h2 id="organisation-workflow-title">
                From role setup to positive evidence
              </h2>
              <p>
                Keep the process clear for volunteers: create a plain-language
                role, review interest, contact or accept people kindly, then add
                positive skills evidence after they have helped.
              </p>
            </div>
          </div>

          <div className="organisation-workflow-steps">
            <article>
              <span aria-hidden="true">📣</span>
              <strong>1. Create role</strong>
              <p>Use clear wording, location, support and readiness checks.</p>
            </article>

            <article>
              <span aria-hidden="true">📬</span>
              <strong>2. Review interest</strong>
              <p>Open the inbox and read volunteer goals, skills and support.</p>
            </article>

            <article>
              <span aria-hidden="true">✅</span>
              <strong>3. Contact or accept</strong>
              <p>Update each volunteer as contacted, accepted or closed.</p>
            </article>

            <article>
              <span aria-hidden="true">⭐</span>
              <strong>4. Add skills review</strong>
              <p>Record positive, employability-focused skills evidence.</p>
            </article>
          </div>
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
            description="Build plain-language roles with location, timings, skills, support notes and inclusivity checks."
            action="Create role"
          />

          <OrganisationCard
            href="/organisation/opportunities"
            icon="✅"
            label="Role list"
            title="Opportunity list"
            description="Review draft, published and closed roles, then open volunteers and reviews for each role."
            action="View roles"
          />

          <OrganisationCard
            href="/organisation/interests"
            icon="📬"
            label="Volunteer interest"
            title="Interest inbox"
            description="See volunteers who have expressed interest, then mark them as contacted, accepted or closed."
            action="Open inbox"
          />

          <OrganisationCard
            href="/organisation/opportunities"
            icon="⭐"
            label="Positive evidence"
            title="Volunteers & skills reviews"
            description="Open a role, then use Volunteers & reviews to add positive employability skills evidence."
            action="Open roles"
          />

          <OrganisationCard
            href="/help"
            icon="🧭"
            label="App help"
            title="Help using the app"
            description="Get help if you are stuck, something is not working, or you want to report a problem with SO Volunteering."
            action="Open help page"
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

        .organisation-status-divider {
          width: 100%;
          height: 1px;
          margin: 10px 0;
          background: rgba(83, 111, 99, 0.12);
        }

        .organisation-workflow-panel {
          display: grid;
          gap: 18px;
          padding: clamp(18px, 4vw, 24px);
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 28px;
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.82), rgba(255, 255, 255, 0.9)),
            rgba(255, 255, 255, 0.84);
          box-shadow: 0 18px 48px rgba(33, 56, 48, 0.07);
        }

        .organisation-workflow-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .organisation-workflow-icon {
          display: inline-flex;
          width: 58px;
          height: 58px;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: rgba(143, 178, 158, 0.16);
          font-size: 1.8rem;
        }

        .organisation-workflow-heading h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.25rem, 3vw, 1.65rem);
          letter-spacing: -0.035em;
          line-height: 1.12;
        }

        .organisation-workflow-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.5;
        }

        .organisation-workflow-steps {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .organisation-workflow-steps article {
          display: grid;
          gap: 8px;
          min-height: 150px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
        }

        .organisation-workflow-steps span {
          display: inline-flex;
          width: 44px;
          height: 44px;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(248, 248, 252, 0.92);
          font-size: 1.35rem;
        }

        .organisation-workflow-steps strong {
          color: #315f48;
          font-size: 0.98rem;
          font-weight: 950;
          line-height: 1.18;
        }

        .organisation-workflow-steps p {
          margin: 0;
          color: #60706a;
          font-size: 0.9rem;
          font-weight: 700;
          line-height: 1.4;
        }

        @media (max-width: 980px) {
          .organisation-workflow-steps {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
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

          .organisation-workflow-heading {
            grid-template-columns: 1fr;
          }

          .organisation-workflow-panel {
            border-radius: 24px;
          }

          .organisation-workflow-icon {
            width: 54px;
            height: 54px;
          }
        }

        @media (max-width: 560px) {
          .organisation-workflow-steps {
            grid-template-columns: 1fr;
          }

          .organisation-workflow-steps article {
            min-height: 0;
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
