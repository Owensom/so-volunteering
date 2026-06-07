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

type OrganisationType =
  | "charity_community"
  | "school_college"
  | "local_authority_employability"
  | "other";

type SafeguardingRegion =
  | "scotland"
  | "england_wales"
  | "northern_ireland"
  | "other";

type SchoolVisibilityMode =
  | "not_applicable"
  | "school_approved_only"
  | "trusted_local_only"
  | "all_public_with_blocks";

type OrganisationProfile = {
  organisation_name: string | null;
  contact_email: string | null;
  logo_url: string | null;
  profile_completed: boolean | null;
  organisation_type: string | null;
  safeguarding_region: string | null;
  works_with_children_or_pupils: boolean | null;
  school_visibility_mode: string | null;
  legal_safeguarding_notes: string | null;
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

type StatCardProps = {
  icon: string;
  label: string;
  value: number;
  helper: string;
};

type ReadinessItemProps = {
  icon: string;
  title: string;
  description: string;
  href: string;
  action: string;
  isReady: boolean;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseOrganisationType(
  value: string | null | undefined,
): OrganisationType {
  if (value === "school_college") return "school_college";
  if (value === "local_authority_employability") {
    return "local_authority_employability";
  }
  if (value === "other") return "other";

  return "charity_community";
}

function normaliseSafeguardingRegion(
  value: string | null | undefined,
): SafeguardingRegion {
  if (value === "england_wales") return "england_wales";
  if (value === "northern_ireland") return "northern_ireland";
  if (value === "other") return "other";

  return "scotland";
}

function normaliseSchoolVisibilityMode(
  value: string | null | undefined,
  organisationType: OrganisationType,
): SchoolVisibilityMode {
  if (organisationType !== "school_college") {
    return "not_applicable";
  }

  if (value === "trusted_local_only") return "trusted_local_only";
  if (value === "all_public_with_blocks") return "all_public_with_blocks";

  return "school_approved_only";
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

function getOrganisationTypeLabel(value: OrganisationType) {
  if (value === "school_college") return "School / college";
  if (value === "local_authority_employability") {
    return "Local authority / employability partner";
  }
  if (value === "other") return "Other organisation";

  return "Charity / community organisation";
}

function getSafeguardingRegionLabel(value: SafeguardingRegion) {
  if (value === "england_wales") return "England / Wales - DBS";
  if (value === "northern_ireland") return "Northern Ireland - AccessNI";
  if (value === "other") return "Other / country-specific guidance";

  return "Scotland - PVG";
}

function getSchoolVisibilityLabel(value: SchoolVisibilityMode) {
  if (value === "trusted_local_only") return "Trusted local organisations only";
  if (value === "all_public_with_blocks") {
    return "All public roles with blocked roles hidden";
  }
  if (value === "school_approved_only") return "School-approved only";

  return "Not applicable";
}

function getSchoolSafetyDescription({
  organisationType,
  schoolVisibilityMode,
}: {
  organisationType: OrganisationType;
  schoolVisibilityMode: SchoolVisibilityMode;
}) {
  if (organisationType !== "school_college") {
    return "School-safe visibility is not active because this organisation is not marked as a school or college.";
  }

  if (schoolVisibilityMode === "school_approved_only") {
    return "Recommended setup saved. Future school-linked pupils will later be limited to school-approved opportunities.";
  }

  if (schoolVisibilityMode === "trusted_local_only") {
    return "Trusted local organisation mode is saved for a future controlled school pathway.";
  }

  return "A broader school visibility mode is saved. Review carefully before future pupil filtering is enabled.";
}

function OrganisationCard({
  href,
  icon,
  label,
  title,
  description,
  action,
  muted = false,
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

function StatCard({ icon, label, value, helper }: StatCardProps) {
  return (
    <article className="organisation-stat-card">
      <span className="organisation-stat-icon" aria-hidden="true">
        {icon}
      </span>

      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

function ReadinessItem({
  icon,
  title,
  description,
  href,
  action,
  isReady,
}: ReadinessItemProps) {
  return (
    <article
      className={
        isReady
          ? "organisation-readiness-item organisation-readiness-ready"
          : "organisation-readiness-item organisation-readiness-action"
      }
    >
      <div className="organisation-readiness-item-icon" aria-hidden="true">
        {icon}
      </div>

      <div className="organisation-readiness-item-copy">
        <div className="organisation-readiness-item-heading">
          <h3>{title}</h3>
          <span>
            <span aria-hidden="true">{isReady ? "✅" : "⚠️"}</span>
            {isReady ? "Ready" : "Needs action"}
          </span>
        </div>

        <p>{description}</p>

        <Link href={href} className="organisation-readiness-action-link">
          {action}
        </Link>
      </div>
    </article>
  );
}

export default async function OrganisationDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
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
    .select(
      "organisation_name,contact_email,logo_url,profile_completed,organisation_type,safeguarding_region,works_with_children_or_pupils,school_visibility_mode,legal_safeguarding_notes",
    )
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
    (opportunity) => opportunity.status === "published",
  ).length;

  const draftCount = opportunityRows.filter(
    (opportunity) => opportunity.status === "draft",
  ).length;

  const closedRoleCount = opportunityRows.filter(
    (opportunity) => opportunity.status === "closed",
  ).length;

  const newInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "new",
  ).length;

  const contactedInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "contacted",
  ).length;

  const acceptedInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "accepted",
  ).length;

  const closedInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "closed",
  ).length;

  const sharedReviewCount = reviewRows.filter(
    (review) => review.status === "shared",
  ).length;

  const draftReviewCount = reviewRows.filter(
    (review) => review.status === "draft",
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
  const hasOrganisationLogo = Boolean(organisationProfile?.logo_url?.trim());
  const totalRoleCount = opportunityRows.length;
  const totalInterestCount = interestRows.length;

  const currentOrganisationType = normaliseOrganisationType(
    organisationProfile?.organisation_type,
  );
  const currentSafeguardingRegion = normaliseSafeguardingRegion(
    organisationProfile?.safeguarding_region,
  );
  const currentSchoolVisibilityMode = normaliseSchoolVisibilityMode(
    organisationProfile?.school_visibility_mode,
    currentOrganisationType,
  );

  const hasOrganisationType = Boolean(organisationProfile?.organisation_type);
  const hasSafeguardingRegion = Boolean(organisationProfile?.safeguarding_region);
  const worksWithChildrenOrPupils =
    organisationProfile?.works_with_children_or_pupils === true;
  const hasLegalSafeguardingNotes = Boolean(
    organisationProfile?.legal_safeguarding_notes?.trim(),
  );
  const isSchoolOrCollege = currentOrganisationType === "school_college";
  const hasSchoolVisibilityMode =
    !isSchoolOrCollege ||
    currentSchoolVisibilityMode === "school_approved_only" ||
    currentSchoolVisibilityMode === "trusted_local_only" ||
    currentSchoolVisibilityMode === "all_public_with_blocks";

  const hasOrganisationIdentity = Boolean(
    organisationProfile?.organisation_name?.trim() ||
      profile?.full_name?.trim() ||
      emailAddress,
  );
  const hasAnyRole = totalRoleCount > 0;
  const hasPublishedRole = publishedCount > 0;
  const hasInterestFlow = totalInterestCount > 0;
  const hasContactFlow =
    contactedInterestCount > 0 ||
    acceptedInterestCount > 0 ||
    closedInterestCount > 0;
  const hasAcceptedVolunteer = acceptedInterestCount > 0;
  const hasPathwayEvidence = sharedReviewCount > 0;
  const volunteerSafetyStatementActive = true;

  const readinessItems = [
    profileCompleted,
    hasOrganisationLogo,
    volunteerSafetyStatementActive,
    hasOrganisationType,
    hasSafeguardingRegion,
    hasSchoolVisibilityMode,
    hasAnyRole,
    hasPublishedRole,
    true,
    hasContactFlow,
    hasAcceptedVolunteer,
    hasPathwayEvidence,
  ];

  const readinessReadyCount = readinessItems.filter(Boolean).length;
  const readinessTotalCount = readinessItems.length;
  const readinessPercent = Math.round(
    (readinessReadyCount / readinessTotalCount) * 100,
  );

  const listenText =
    `You are on the organisation dashboard. This is your workspace for creating volunteering roles, reviewing volunteer interest, accepting or contacting volunteers, and adding positive skills evidence. First, check the Workspace status card. The organisation type is currently ${getOrganisationTypeLabel(currentOrganisationType)}. The safeguarding region is currently ${getSafeguardingRegionLabel(currentSafeguardingRegion)}. Scotland uses PVG wording. England and Wales use DBS wording. Northern Ireland uses AccessNI wording. The School Safety Layer is in phase 1A, which means organisation-level readiness is saved but pupil filtering and role visibility changes are not active yet. Then use the Organisation readiness checklist to see what is ready and what needs action. The checklist includes organisation logo, volunteer safety statement, legal and safeguarding readiness, role setup, interest flow and positive pathway evidence. Below that, the summary cards show role, interest and skills review counts. Use Create role to make a new inclusive volunteering role. Use Interest inbox to review volunteers who clicked I'm interested. Use Roles and reviews to edit roles and open volunteers and reviews for each role. Use Volunteer connections to see people who have already interacted with your organisation through role interest or positive skills reviews. This is not a public volunteer database. The install card explains how to add SO Volunteering to your phone, tablet or computer home screen so it opens more like an app. Help using the app is for getting support if you are stuck, something is not working, or you want to report a problem with SO Volunteering.`;

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
            aria-label="Organisation workspace status"
          >
            <div className="dashboard-progress-header organisation-status-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>

              <div>
                <h2>Workspace status</h2>
                <p>
                  Readiness:{" "}
                  <strong>
                    {readinessReadyCount}/{readinessTotalCount} ready
                  </strong>
                </p>
              </div>
            </div>

            <div className="organisation-readiness-meter" aria-hidden="true">
              <span style={{ width: `${readinessPercent}%` }} />
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

            <div className="organisation-compact-status-list">
              <p className="dashboard-progress-note organisation-status-note">
                Profile:{" "}
                <strong>{profileCompleted ? "Complete" : "Needs setup"}</strong>
              </p>
              <p className="dashboard-progress-note organisation-status-note">
                Logo: <strong>{hasOrganisationLogo ? "Added" : "Not added"}</strong>
              </p>
              <p className="dashboard-progress-note organisation-status-note">
                Type:{" "}
                <strong>{getOrganisationTypeLabel(currentOrganisationType)}</strong>
              </p>
              <p className="dashboard-progress-note organisation-status-note">
                Region:{" "}
                <strong>{getSafeguardingRegionLabel(currentSafeguardingRegion)}</strong>
              </p>
              <p className="dashboard-progress-note organisation-status-note">
                Children / pupils:{" "}
                <strong>{worksWithChildrenOrPupils ? "Marked" : "Not marked"}</strong>
              </p>
              <p className="dashboard-progress-note organisation-status-note">
                School mode:{" "}
                <strong>{getSchoolVisibilityLabel(currentSchoolVisibilityMode)}</strong>
              </p>
              <p className="dashboard-progress-note organisation-status-note">
                Roles: <strong>{totalRoleCount}</strong>
              </p>
              <p className="dashboard-progress-note organisation-status-note">
                Interest: <strong>{totalInterestCount}</strong>
              </p>
              <p className="dashboard-progress-note organisation-status-note">
                Accepted: <strong>{acceptedInterestCount}</strong>
              </p>
              <p className="dashboard-progress-note organisation-status-note">
                Shared reviews: <strong>{sharedReviewCount}</strong>
              </p>
            </div>
          </aside>
        </section>

        <section
          className="organisation-safeguarding-panel"
          aria-labelledby="organisation-safeguarding-title"
        >
          <div className="organisation-safeguarding-heading">
            <span className="organisation-safeguarding-icon" aria-hidden="true">
              ⚖️
            </span>

            <div>
              <p className="dashboard-kicker">School safety layer phase 1A</p>
              <h2 id="organisation-safeguarding-title">
                Legal and safeguarding readiness
              </h2>
              <p>
                This is an organisation-level readiness layer only. It records
                organisation type, UK safeguarding wording, children/pupil
                involvement and future school visibility mode. It does not yet
                change what volunteers or pupils can see.
              </p>
            </div>
          </div>

          <div className="organisation-safeguarding-grid">
            <article>
              <span aria-hidden="true">🏷️</span>
              <div>
                <p>Organisation type</p>
                <strong>{getOrganisationTypeLabel(currentOrganisationType)}</strong>
              </div>
            </article>

            <article>
              <span aria-hidden="true">🛡️</span>
              <div>
                <p>Safeguarding region</p>
                <strong>{getSafeguardingRegionLabel(currentSafeguardingRegion)}</strong>
              </div>
            </article>

            <article>
              <span aria-hidden="true">👥</span>
              <div>
                <p>Children or pupils</p>
                <strong>
                  {worksWithChildrenOrPupils ? "May be involved" : "Not marked"}
                </strong>
              </div>
            </article>

            <article>
              <span aria-hidden="true">🏫</span>
              <div>
                <p>School-safe mode</p>
                <strong>{getSchoolVisibilityLabel(currentSchoolVisibilityMode)}</strong>
              </div>
            </article>
          </div>

          <div className="organisation-safeguarding-note">
            <span aria-hidden="true">🧭</span>
            <div>
              <strong>Next controlled phase</strong>
              <p>
                Phase 1B will add role-level legal and safeguarding fields. For
                now, keep using clear safety notes and review any role involving
                children, pupils, supervision or regulated work/activity before
                publishing.
              </p>
            </div>
          </div>
        </section>

        <section
          className="organisation-readiness-panel"
          aria-labelledby="organisation-readiness-title"
        >
          <div className="organisation-readiness-heading">
            <span className="organisation-readiness-icon" aria-hidden="true">
              ✅
            </span>

            <div>
              <p className="dashboard-kicker">Organisation readiness</p>
              <h2 id="organisation-readiness-title">
                Set up your volunteer workflow
              </h2>
              <p>
                Use this checklist to make sure your organisation is ready to
                publish roles, build volunteer trust, review interest, contact
                volunteers kindly and add positive pathway evidence.
              </p>
            </div>

            <div className="organisation-readiness-score" aria-label="Readiness score">
              <strong>{readinessPercent}%</strong>
              <span>
                {readinessReadyCount}/{readinessTotalCount} ready
              </span>
            </div>
          </div>

          <div className="organisation-readiness-list">
            <ReadinessItem
              icon="🏢"
              title="Organisation profile"
              description={
                profileCompleted
                  ? "Your organisation profile is marked as complete."
                  : hasOrganisationIdentity
                    ? "Your organisation has basic details. Finish the profile so volunteers understand who you are."
                    : "Add your organisation name, contact details and support approach."
              }
              href="/organisation/profile"
              action={profileCompleted ? "Review profile" : "Complete profile"}
              isReady={profileCompleted}
            />

            <ReadinessItem
              icon="🖼️"
              title="Organisation logo added"
              description={
                hasOrganisationLogo
                  ? "Your logo is saved and can appear on volunteer-facing role pages."
                  : "Upload a logo so volunteers can recognise your organisation and feel safer reviewing your roles."
              }
              href="/organisation/profile"
              action={hasOrganisationLogo ? "Review logo" : "Add logo"}
              isReady={hasOrganisationLogo}
            />

            <ReadinessItem
              icon="🛡️"
              title="Volunteer safety statement active"
              description="Role pages now tell volunteers that SO Volunteering and organisations using the platform will never ask for money, bank details, passwords or financial information."
              href="/organisation/profile"
              action="Review safety wording"
              isReady={volunteerSafetyStatementActive}
            />

            <ReadinessItem
              icon="🏷️"
              title="Organisation type selected"
              description={
                hasOrganisationType
                  ? `Saved as ${getOrganisationTypeLabel(currentOrganisationType)}.`
                  : "Choose whether you are a charity, school, local authority/employability partner or other organisation."
              }
              href="/organisation/profile"
              action={hasOrganisationType ? "Review type" : "Choose type"}
              isReady={hasOrganisationType}
            />

            <ReadinessItem
              icon="⚖️"
              title="PVG / DBS / AccessNI region"
              description={
                hasSafeguardingRegion
                  ? `Saved as ${getSafeguardingRegionLabel(currentSafeguardingRegion)}.`
                  : "Choose the legal and safeguarding region wording that should guide your organisation setup."
              }
              href="/organisation/profile"
              action={hasSafeguardingRegion ? "Review region" : "Choose region"}
              isReady={hasSafeguardingRegion}
            />

            <ReadinessItem
              icon="🏫"
              title="School-safe mode prepared"
              description={getSchoolSafetyDescription({
                organisationType: currentOrganisationType,
                schoolVisibilityMode: currentSchoolVisibilityMode,
              })}
              href="/organisation/profile"
              action="Review school safety"
              isReady={hasSchoolVisibilityMode}
            />

            <ReadinessItem
              icon="📣"
              title="First role created"
              description={
                hasAnyRole
                  ? "You have started creating volunteering roles."
                  : "Create your first plain-language volunteering role."
              }
              href={hasAnyRole ? "/organisation/opportunities" : "/organisation/opportunities/new"}
              action={hasAnyRole ? "View roles" : "Create first role"}
              isReady={hasAnyRole}
            />

            <ReadinessItem
              icon="🌍"
              title="Published role live"
              description={
                hasPublishedRole
                  ? "At least one role is published and ready for volunteers."
                  : "Publish a role so volunteers can find it and express interest."
              }
              href="/organisation/opportunities"
              action={hasPublishedRole ? "View published roles" : "Open roles"}
              isReady={hasPublishedRole}
            />

            <ReadinessItem
              icon="📬"
              title="Interest inbox ready"
              description="The inbox is available for reviewing volunteer interest and profile snapshots."
              href="/organisation/interests"
              action="Open interest inbox"
              isReady={true}
            />

            <ReadinessItem
              icon="💬"
              title="Contact flow tested"
              description={
                hasContactFlow
                  ? "At least one volunteer has moved beyond new interest."
                  : hasInterestFlow
                    ? "Review a volunteer and mark them as Contacted, Accepted or Closed."
                    : "Once a volunteer expresses interest, use the contact helper and update their status."
              }
              href="/organisation/interests"
              action="Review interest"
              isReady={hasContactFlow}
            />

            <ReadinessItem
              icon="✅"
              title="Accepted volunteer"
              description={
                hasAcceptedVolunteer
                  ? "At least one volunteer has been accepted and is ready to move forward."
                  : "Accepted volunteers unlock the clearest pathway next-step guidance."
              }
              href="/organisation/interests"
              action="Open interests"
              isReady={hasAcceptedVolunteer}
            />

            <ReadinessItem
              icon="⭐"
              title="Positive pathway evidence"
              description={
                hasPathwayEvidence
                  ? "You have shared positive skills evidence for volunteers."
                  : "After a volunteer completes a task, add a positive skills review."
              }
              href="/organisation/opportunities"
              action={hasPathwayEvidence ? "View roles & reviews" : "Open reviews"}
              isReady={hasPathwayEvidence}
            />
          </div>
        </section>

        <section
          className="organisation-stat-grid"
          aria-label="Organisation workspace summary"
        >
          <StatCard
            icon="📣"
            label="Published roles"
            value={publishedCount}
            helper={`${draftCount} draft · ${closedRoleCount} closed`}
          />

          <StatCard
            icon="🌱"
            label="New interest"
            value={newInterestCount}
            helper="Waiting for review"
          />

          <StatCard
            icon="💬"
            label="Contacted"
            value={contactedInterestCount}
            helper="Conversation started"
          />

          <StatCard
            icon="✅"
            label="Accepted"
            value={acceptedInterestCount}
            helper="Ready to move forward"
          />

          <StatCard
            icon="🌙"
            label="Closed interest"
            value={closedInterestCount}
            helper="No further action"
          />

          <StatCard
            icon="⭐"
            label="Skills reviews"
            value={sharedReviewCount}
            helper={`${draftReviewCount} draft review${
              draftReviewCount === 1 ? "" : "s"
            }`}
          />
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
            description="Review your name, logo, purpose, location, contact details and support approach."
            action={profileCompleted ? "Review profile" : "Start profile"}
          />

          <OrganisationCard
            href="/organisation/profile"
            icon="⚖️"
            label="Safeguarding"
            title="Legal and safeguarding readiness"
            description={`Review organisation type, ${getSafeguardingRegionLabel(currentSafeguardingRegion)}, children/pupil readiness and future school-safe visibility.`}
            action="Review safeguarding setup"
          />

          <OrganisationCard
            href="/organisation/profile"
            icon="🖼️"
            label="Trust"
            title="Logo and volunteer safety"
            description="Add or review your organisation logo and check the volunteer-facing safety wording."
            action={hasOrganisationLogo ? "Review trust setup" : "Add logo"}
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
            href="/organisation/volunteers"
            icon="👥"
            label="Volunteer connections"
            title="People you have worked with"
            description="See volunteers who have connected with your organisation through role interest or positive skills reviews. This is your organisation history only, not a public volunteer database."
            action="Open connections"
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
            icon="📲"
            label="Install"
            title="Install SO Volunteering"
            description="Use SO Volunteering like an app. On iPhone or iPad, tap Share then Add to Home Screen. On Android or Chrome, tap the menu then Install app or Add to Home screen. On desktop Chrome or Edge, use the install icon in the address bar."
            action="No app store needed"
            muted
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

        .organisation-hero-actions {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          width: min(100%, 560px);
          align-items: stretch;
        }

        .organisation-hero-actions .dashboard-main-action {
          width: 100%;
          min-height: 54px;
          justify-content: center;
          text-align: center;
        }

        .organisation-hero-actions .dashboard-button-inner {
          justify-content: center;
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
        .organisation-status-card,
        .organisation-readiness-panel,
        .organisation-safeguarding-panel {
          overflow: hidden;
        }

        .organisation-hero-copy,
        .organisation-status-card,
        .organisation-status-card *,
        .organisation-readiness-panel,
        .organisation-readiness-panel *,
        .organisation-safeguarding-panel,
        .organisation-safeguarding-panel * {
          min-width: 0;
        }

        .organisation-status-card {
          align-self: start;
        }

        .organisation-status-note {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .organisation-readiness-meter {
          width: 100%;
          height: 11px;
          margin: 14px 0 12px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
        }

        .organisation-readiness-meter span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8fb29e, #4f8d68);
        }

        .organisation-compact-status-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px 12px;
          margin-top: 12px;
        }

        .organisation-compact-status-list .organisation-status-note {
          margin: 0;
        }

        .organisation-safeguarding-panel {
          display: grid;
          gap: 18px;
          padding: clamp(18px, 4vw, 24px);
          border: 1px solid rgba(108, 92, 160, 0.18);
          border-radius: 30px;
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.92), rgba(255, 255, 255, 0.92));
          box-shadow: 0 18px 48px rgba(33, 56, 48, 0.08);
        }

        .organisation-safeguarding-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .organisation-safeguarding-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(108, 92, 160, 0.12);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.14);
          font-size: 1.85rem;
        }

        .organisation-safeguarding-heading h2 {
          margin: 0 0 8px;
          color: #4f4b82;
          font-size: clamp(1.35rem, 3vw, 1.8rem);
          font-weight: 950;
          letter-spacing: -0.04em;
          line-height: 1.1;
        }

        .organisation-safeguarding-heading p {
          margin: 0;
          color: #5f6072;
          font-weight: 760;
          line-height: 1.5;
        }

        .organisation-safeguarding-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .organisation-safeguarding-grid article {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
          min-height: 112px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 12px 28px rgba(33, 56, 48, 0.05);
        }

        .organisation-safeguarding-grid article > span {
          display: inline-flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: rgba(108, 92, 160, 0.1);
          font-size: 1.25rem;
        }

        .organisation-safeguarding-grid p {
          margin: 0 0 5px;
          color: #5f6072;
          font-size: 0.82rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .organisation-safeguarding-grid strong {
          display: block;
          color: #4f4b82;
          font-size: 0.98rem;
          font-weight: 950;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .organisation-safeguarding-note {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          padding: 16px;
          border: 1px solid rgba(34, 124, 78, 0.22);
          border-radius: 22px;
          background: rgba(244, 255, 249, 0.86);
        }

        .organisation-safeguarding-note > span {
          display: inline-flex;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          background: rgba(34, 124, 78, 0.12);
          font-size: 1.45rem;
        }

        .organisation-safeguarding-note strong {
          display: block;
          margin-bottom: 5px;
          color: #145c38;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.2;
        }

        .organisation-safeguarding-note p {
          margin: 0;
          color: #275f45;
          font-weight: 760;
          line-height: 1.45;
        }

        .organisation-readiness-panel {
          display: grid;
          gap: 18px;
          padding: clamp(18px, 4vw, 24px);
          border: 1px solid rgba(83, 111, 99, 0.2);
          border-radius: 30px;
          background:
            radial-gradient(circle at top left, rgba(200, 243, 221, 0.46), transparent 35%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.88), rgba(255, 255, 255, 0.92));
          box-shadow: 0 18px 48px rgba(33, 56, 48, 0.08);
        }

        .organisation-readiness-heading {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 14px;
          align-items: start;
        }

        .organisation-readiness-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(143, 178, 158, 0.18);
          box-shadow: inset 0 0 0 1px rgba(83, 111, 99, 0.12);
          font-size: 1.85rem;
        }

        .organisation-readiness-heading h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.35rem, 3vw, 1.8rem);
          font-weight: 950;
          letter-spacing: -0.04em;
          line-height: 1.1;
        }

        .organisation-readiness-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.5;
        }

        .organisation-readiness-score {
          display: grid;
          gap: 3px;
          min-width: 116px;
          padding: 13px 14px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.8);
          text-align: center;
        }

        .organisation-readiness-score strong {
          color: #315f48;
          font-size: 1.8rem;
          font-weight: 950;
          line-height: 1;
        }

        .organisation-readiness-score span {
          color: #60706a;
          font-size: 0.8rem;
          font-weight: 850;
          line-height: 1.2;
        }

        .organisation-readiness-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .organisation-readiness-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          min-height: 150px;
          padding: 15px;
          border-radius: 22px;
          box-shadow: 0 14px 34px rgba(33, 56, 48, 0.06);
        }

        .organisation-readiness-ready {
          border: 1px solid rgba(34, 124, 78, 0.24);
          background: rgba(244, 255, 249, 0.92);
        }

        .organisation-readiness-action {
          border: 1px solid rgba(191, 146, 72, 0.24);
          background: rgba(255, 250, 241, 0.92);
        }

        .organisation-readiness-item-icon {
          display: inline-flex;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: inset 0 0 0 1px rgba(83, 111, 99, 0.1);
          font-size: 1.45rem;
        }

        .organisation-readiness-item-copy {
          display: grid;
          gap: 8px;
        }

        .organisation-readiness-item-heading {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          justify-content: space-between;
        }

        .organisation-readiness-item-heading h3 {
          margin: 0;
          color: #315f48;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.15;
        }

        .organisation-readiness-item-heading span {
          display: inline-flex;
          min-height: 28px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #536f63;
          font-size: 0.74rem;
          font-weight: 950;
          line-height: 1;
        }

        .organisation-readiness-action .organisation-readiness-item-heading span {
          color: #8a6630;
        }

        .organisation-readiness-item-copy p {
          margin: 0;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 750;
          line-height: 1.42;
        }

        .organisation-readiness-action-link {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          margin-top: auto;
          padding: 9px 13px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.88);
          color: #536f63;
          font-size: 0.88rem;
          font-weight: 950;
          line-height: 1.1;
          text-decoration: none;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
        }

        .organisation-readiness-action-link:hover {
          border-color: rgba(83, 111, 99, 0.32);
          background: rgba(244, 255, 249, 0.96);
        }

        .organisation-stat-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
        }

        .organisation-stat-card {
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

        .organisation-stat-icon {
          display: inline-flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: rgba(143, 178, 158, 0.13);
          font-size: 1.25rem;
        }

        .organisation-stat-card p {
          margin: 0 0 5px;
          color: #60706a;
          font-size: 0.82rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .organisation-stat-card strong {
          display: block;
          color: #315f48;
          font-size: 1.85rem;
          line-height: 1;
        }

        .organisation-stat-card small {
          display: block;
          margin-top: 8px;
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.25;
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

        @media (max-width: 1180px) {
          .organisation-stat-grid,
          .organisation-readiness-list,
          .organisation-safeguarding-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 980px) {
          .organisation-workflow-steps,
          .organisation-readiness-list,
          .organisation-safeguarding-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .organisation-readiness-heading {
            grid-template-columns: auto 1fr;
          }

          .organisation-readiness-score {
            grid-column: 1 / -1;
            width: fit-content;
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
            grid-template-columns: 1fr;
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

          .organisation-compact-status-list {
            grid-template-columns: 1fr;
          }

          .organisation-stat-grid,
          .organisation-readiness-list,
          .organisation-safeguarding-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .organisation-stat-card {
            min-height: 112px;
          }

          .organisation-safeguarding-panel,
          .organisation-readiness-panel {
            border-radius: 26px;
            padding: 18px;
          }

          .organisation-safeguarding-heading,
          .organisation-readiness-heading {
            grid-template-columns: 1fr;
          }

          .organisation-safeguarding-icon,
          .organisation-readiness-icon {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .organisation-readiness-score {
            width: 100%;
            text-align: left;
          }

          .organisation-safeguarding-grid article,
          .organisation-readiness-item {
            min-height: 0;
            grid-template-columns: 1fr;
          }

          .organisation-safeguarding-note {
            grid-template-columns: 1fr;
          }

          .organisation-readiness-action-link {
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
          .organisation-stat-grid,
          .organisation-workflow-steps,
          .organisation-readiness-list,
          .organisation-safeguarding-grid {
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
