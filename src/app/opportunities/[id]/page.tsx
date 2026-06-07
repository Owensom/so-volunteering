import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import {
  getOpportunityMatch,
  getOpportunityMatchCardIcon,
  getOpportunityMatchToneClass,
} from "@/lib/opportunity-matching";
import { expressInterest, removeInterestFromOpportunity } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type VolunteerProfile = {
  goals: string[] | null;
  interests: string[] | null;
  skills: string[] | null;
  support_needs: string | null;
  availability_notes: string | null;
  volunteering_preference: string | null;
  preferred_contact_method: string | null;
  phone_number: string | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
};

type Opportunity = {
  id: string;
  organisation_user_id: string;
  title: string;
  summary: string;
  location_type: string;
  location: string | null;
  location_town_city: string | null;
  location_area: string | null;
  location_venue: string | null;
  location_postcode: string | null;
  travel_notes: string | null;
  accessibility_notes: string | null;
  hide_exact_location: boolean | null;
  time_commitment: string | null;
  interests: string[] | null;
  skills: string[] | null;
  support_offered: string[] | null;
  contact_name: string | null;
  contact_email: string | null;
  safety_notes: string | null;
  status: string;

  minimum_age_stage: string | null;
  suitable_for_pupils: boolean | null;
  parent_carer_consent_required: boolean | null;
  school_approval_required: boolean | null;
  safeguarding_check_region: string | null;
  safeguarding_review_required: boolean | null;
  supervision_required: boolean | null;
  no_lone_working: boolean | null;
  no_home_visits: boolean | null;
  no_money_handling: boolean | null;
  no_personal_care: boolean | null;
  no_private_messaging: boolean | null;
  risk_assessment_completed: boolean | null;
  named_safeguarding_contact: string | null;
  legal_safeguarding_notes: string | null;
  role_frequency_pattern: string | null;
};

type OrganisationProfile = {
  organisation_name: string | null;
  logo_url: string | null;
  website: string | null;
  location: string | null;
  purpose: string | null;
};

type ExistingInterest = {
  id: string;
  status: string;
  message: string | null;
};

type RoleGuideStep = {
  icon: string;
  title: string;
  text: string;
  isComplete: boolean;
};

type SafetyBadge = {
  icon: string;
  label: string;
  className: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseViewMode(value: string | null | undefined) {
  if (value === "simple" || value === "detailed") return value;
  return "standard";
}

function normaliseColourTheme(value: string | null | undefined) {
  if (
    value === "calm_green" ||
    value === "soft_blue" ||
    value === "warm_peach" ||
    value === "high_contrast" ||
    value === "neon_arcade"
  ) {
    return value;
  }

  return "default";
}

function normaliseTextSize(value: string | null | undefined) {
  return value === "large" ? "large" : "standard";
}

function normaliseAvatarIcon(value: string | null | undefined) {
  return value && value.trim() ? value : "🌱";
}

function normaliseListenMode(value: string | null | undefined) {
  return value === "context" ? "context" : "always";
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

function getThemeClass(colourTheme: string) {
  return `preference-theme-${colourTheme}`;
}

function getTextClass(textSize: string) {
  return textSize === "large"
    ? "preference-text-large"
    : "preference-text-standard";
}

function getViewClass(viewMode: string) {
  return `preference-view-${viewMode}`;
}

function getViewLabel(viewMode: string) {
  if (viewMode === "simple") return "Simple view";
  if (viewMode === "detailed") return "Detailed view";
  return "Standard view";
}

function getThemeLabel(colourTheme: string) {
  if (colourTheme === "calm_green") return "Calm green";
  if (colourTheme === "soft_blue") return "Soft blue";
  if (colourTheme === "warm_peach") return "Warm peach";
  if (colourTheme === "high_contrast") return "High contrast";
  if (colourTheme === "neon_arcade") return "Neon arcade";
  return "SO default";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote / online";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

function formatPreferredContact(value: string | null | undefined) {
  if (value === "sms") return "Text message";
  if (value === "phone") return "Phone call";
  if (value === "email") return "Email";
  if (value === "not_sure") return "Not sure yet";
  return "Not chosen yet";
}

function formatInterestStatus(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "Accepted";
  if (normalisedStatus === "contacted") return "Contacted";
  if (normalisedStatus === "closed") return "Closed";
  return "New interest";
}

function getInterestHelpText(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") {
    return "The organisation would like to move forward with you.";
  }

  if (normalisedStatus === "contacted") {
    return "The organisation has marked this as contacted. Check your email or any contact method you shared.";
  }

  if (normalisedStatus === "closed") {
    return "This role is not progressing at the moment. This does not mean you did anything wrong. You can keep looking for another role that feels right.";
  }

  return "Your interest has been sent to the organisation and is waiting for them to review it.";
}

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function formatSafeLocation(opportunity: Opportunity) {
  if (opportunity.location_type === "remote") {
    return "Remote / online";
  }

  const safeParts = [
    opportunity.location_town_city,
    opportunity.location_area,
  ].filter((value): value is string => Boolean(value && value.trim()));

  if (safeParts.length > 0) {
    return safeParts.join(" · ");
  }

  if (opportunity.location?.trim()) {
    return opportunity.location.trim();
  }

  if (opportunity.location_type === "hybrid") {
    return "Hybrid location to be confirmed";
  }

  return "Location to be confirmed";
}

function getVenueDisplay(opportunity: Opportunity) {
  if (opportunity.location_type === "remote") {
    return "No venue needed for remote roles.";
  }

  if (opportunity.hide_exact_location === true) {
    return "Exact venue shared after the organisation contacts or accepts you.";
  }

  if (opportunity.location_venue?.trim()) {
    return opportunity.location_venue.trim();
  }

  return "Venue not listed yet.";
}

function getPostcodeDisplay(opportunity: Opportunity) {
  if (opportunity.location_type === "remote") {
    return "";
  }

  if (opportunity.hide_exact_location === true) {
    return "Postcode shared later if needed.";
  }

  if (opportunity.location_postcode?.trim()) {
    return opportunity.location_postcode.trim();
  }

  return "";
}

function getOrganisationDisplayName(
  organisationProfile: OrganisationProfile | null,
) {
  return organisationProfile?.organisation_name?.trim() || "This organisation";
}

function getOrganisationLogoUrl(
  organisationProfile: OrganisationProfile | null,
) {
  const logoUrl = organisationProfile?.logo_url?.trim();

  if (!logoUrl) {
    return "";
  }

  if (logoUrl.startsWith("https://") || logoUrl.startsWith("http://")) {
    return logoUrl;
  }

  return "";
}

function getMinimumAgeStageLabel(value: string | null | undefined) {
  if (value === "adults_only") return "Adults only";
  if (value === "sixteen_plus") return "16+";
  if (value === "fourteen_plus") return "14+";
  if (value === "school_pupils_with_approval") {
    return "School pupils with school approval";
  }
  if (value === "school_pupils_with_parent_carer_consent") {
    return "School pupils with parent/carer consent";
  }

  return "Age/stage not listed";
}

function getSafeguardingCheckRegionLabel(value: string | null | undefined) {
  if (value === "scotland_pvg") return "Scotland - PVG";
  if (value === "england_wales_dbs") return "England / Wales - DBS";
  if (value === "northern_ireland_accessni") {
    return "Northern Ireland - AccessNI";
  }
  if (value === "not_expected") return "Not expected for this role";
  if (value === "not_sure") return "Not sure - needs review";

  return "Organisation default";
}

function getFrequencyPatternLabel(value: string | null | undefined) {
  if (value === "one_off") return "One-off";
  if (value === "occasional") return "Occasional";
  if (value === "weekly_or_regular") return "Weekly or regular";
  if (value === "more_than_three_days_in_thirty") {
    return "More than 3 days in 30 days";
  }
  if (value === "overnight") return "Overnight or late-night activity";
  if (value === "not_sure") return "Not sure - needs review";

  return "Frequency not listed";
}

function hasRoleSafetyInformation(opportunity: Opportunity) {
  return Boolean(
    (opportunity.minimum_age_stage &&
      opportunity.minimum_age_stage !== "not_set") ||
      (opportunity.safeguarding_check_region &&
        opportunity.safeguarding_check_region !== "organisation_default") ||
      (opportunity.role_frequency_pattern &&
        opportunity.role_frequency_pattern !== "not_set") ||
      opportunity.suitable_for_pupils === true ||
      opportunity.parent_carer_consent_required === true ||
      opportunity.school_approval_required === true ||
      opportunity.safeguarding_review_required === true ||
      opportunity.supervision_required === true ||
      opportunity.no_lone_working === true ||
      opportunity.no_home_visits === true ||
      opportunity.no_money_handling === true ||
      opportunity.no_personal_care === true ||
      opportunity.no_private_messaging === true ||
      opportunity.risk_assessment_completed === true ||
      hasText(opportunity.named_safeguarding_contact) ||
      hasText(opportunity.legal_safeguarding_notes),
  );
}

function getSafetyBadges(opportunity: Opportunity): SafetyBadge[] {
  const badges: SafetyBadge[] = [];

  if (
    opportunity.minimum_age_stage &&
    opportunity.minimum_age_stage !== "not_set"
  ) {
    badges.push({
      icon: "👥",
      label: getMinimumAgeStageLabel(opportunity.minimum_age_stage),
      className: "role-safety-badge-info",
    });
  }

  if (
    opportunity.safeguarding_check_region &&
    opportunity.safeguarding_check_region !== "organisation_default"
  ) {
    badges.push({
      icon: "🛡️",
      label: getSafeguardingCheckRegionLabel(
        opportunity.safeguarding_check_region,
      ),
      className:
        opportunity.safeguarding_check_region === "not_sure"
          ? "role-safety-badge-warning"
          : "role-safety-badge-info",
    });
  }

  if (
    opportunity.role_frequency_pattern &&
    opportunity.role_frequency_pattern !== "not_set"
  ) {
    badges.push({
      icon: "🔁",
      label: getFrequencyPatternLabel(opportunity.role_frequency_pattern),
      className:
        opportunity.role_frequency_pattern === "not_sure" ||
        opportunity.role_frequency_pattern ===
          "more_than_three_days_in_thirty" ||
        opportunity.role_frequency_pattern === "overnight"
          ? "role-safety-badge-warning"
          : "role-safety-badge-info",
    });
  }

  if (opportunity.suitable_for_pupils === true) {
    badges.push({
      icon: "🏫",
      label: "May be suitable for pupils",
      className: "role-safety-badge-warning",
    });
  }

  if (opportunity.school_approval_required === true) {
    badges.push({
      icon: "✅",
      label: "School approval required",
      className: "role-safety-badge-warning",
    });
  }

  if (opportunity.parent_carer_consent_required === true) {
    badges.push({
      icon: "👪",
      label: "Parent/carer consent required",
      className: "role-safety-badge-warning",
    });
  }

  if (opportunity.safeguarding_review_required === true) {
    badges.push({
      icon: "⚖️",
      label: "Safeguarding review required",
      className: "role-safety-badge-warning",
    });
  }

  if (opportunity.supervision_required === true) {
    badges.push({
      icon: "👀",
      label: "Supervision required",
      className: "role-safety-badge-ready",
    });
  }

  if (opportunity.no_lone_working === true) {
    badges.push({
      icon: "🚫",
      label: "No lone working",
      className: "role-safety-badge-ready",
    });
  }

  if (opportunity.no_home_visits === true) {
    badges.push({
      icon: "🏠",
      label: "No home visits",
      className: "role-safety-badge-ready",
    });
  }

  if (opportunity.no_money_handling === true) {
    badges.push({
      icon: "💷",
      label: "No money handling",
      className: "role-safety-badge-ready",
    });
  }

  if (opportunity.no_personal_care === true) {
    badges.push({
      icon: "🤲",
      label: "No personal care",
      className: "role-safety-badge-ready",
    });
  }

  if (opportunity.no_private_messaging === true) {
    badges.push({
      icon: "📵",
      label: "No private messaging outside approved contact route",
      className: "role-safety-badge-ready",
    });
  }

  if (opportunity.risk_assessment_completed === true) {
    badges.push({
      icon: "📋",
      label: "Risk assessment checked by organisation",
      className: "role-safety-badge-ready",
    });
  }

  if (hasText(opportunity.named_safeguarding_contact)) {
    badges.push({
      icon: "👤",
      label: "Named safeguarding contact added",
      className: "role-safety-badge-ready",
    });
  }

  return badges;
}

function ChipList({
  values,
  emptyText,
}: {
  values: string[] | null | undefined;
  emptyText: string;
}) {
  if (!Array.isArray(values) || values.length === 0) {
    return <p className="dashboard-muted-action">{emptyText}</p>;
  }

  return (
    <div className="opportunity-chip-list">
      {values.map((value) => (
        <span key={value} className="opportunity-chip">
          {value}
        </span>
      ))}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  title,
  children,
}: {
  icon: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="info-card dashboard-pathway-card opportunity-detail-card">
      <div
        className="dashboard-card-icon opportunity-detail-icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="dashboard-card-copy opportunity-detail-copy">
        <div>
          <p className="dashboard-card-label">{label}</p>
          <h2>{title}</h2>
        </div>

        <div className="opportunity-detail-body">{children}</div>
      </div>
    </article>
  );
}

function RoleGuide({ steps }: { steps: RoleGuideStep[] }) {
  return (
    <section className="role-detail-guide-panel" aria-labelledby="role-guide-title">
      <div className="role-detail-guide-heading">
        <span aria-hidden="true">🧭</span>

        <div>
          <p className="dashboard-kicker">Step-by-step guide</p>
          <h2 id="role-guide-title">How to decide if this role is right</h2>
          <p>
            Read the organisation details, check the location, support and role
            safety information, look at the match guide, then express interest
            only when the role feels safe and realistic for you.
          </p>
        </div>
      </div>

      <div className="role-detail-guide-grid">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className={
              step.isComplete
                ? "role-detail-guide-step role-detail-guide-step-complete"
                : "role-detail-guide-step"
            }
          >
            <span className="role-detail-guide-step-number">
              {step.isComplete ? "✓" : index + 1}
            </span>

            <div className="role-detail-guide-step-icon" aria-hidden="true">
              {step.icon}
            </div>

            <div className="role-detail-guide-step-copy">
              <p className="role-detail-guide-step-kicker">
                Step {index + 1}
                <span>{step.isComplete ? "Ready" : "Guide"}</span>
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

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const opportunityId = resolvedParams.id;

  const errorMessage = resolvedSearchParams.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : "";

  const successMessage = resolvedSearchParams.message
    ? decodeURIComponent(resolvedSearchParams.message)
    : "";

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

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  const { data: volunteerProfile } = await supabase
    .from("volunteer_profiles")
    .select(
      "goals,interests,skills,support_needs,availability_notes,volunteering_preference,preferred_contact_method,phone_number",
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const { data: preferences } = await supabase
    .from("volunteer_preferences")
    .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerPreferences>();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id,organisation_user_id,title,summary,location_type,location,location_town_city,location_area,location_venue,location_postcode,travel_notes,accessibility_notes,hide_exact_location,time_commitment,interests,skills,support_offered,contact_name,contact_email,safety_notes,status,minimum_age_stage,suitable_for_pupils,parent_carer_consent_required,school_approval_required,safeguarding_check_region,safeguarding_review_required,supervision_required,no_lone_working,no_home_visits,no_money_handling,no_personal_care,no_private_messaging,risk_assessment_completed,named_safeguarding_contact,legal_safeguarding_notes,role_frequency_pattern",
    )
    .eq("id", opportunityId)
    .eq("status", "published")
    .maybeSingle<Opportunity>();

  if (!opportunity) {
    redirect("/opportunities");
  }

  const { data: organisationProfile } = await supabase
    .from("organisation_profiles")
    .select("organisation_name,logo_url,website,location,purpose")
    .eq("user_id", opportunity.organisation_user_id)
    .maybeSingle<OrganisationProfile>();

  const { data: existingInterest } = await supabase
    .from("opportunity_interests")
    .select("id,status,message")
    .eq("opportunity_id", opportunity.id)
    .eq("volunteer_user_id", user.id)
    .maybeSingle<ExistingInterest>();

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";
  const hasAlreadyExpressedInterest = Boolean(existingInterest);

  const preferredContactLabel = formatPreferredContact(
    volunteerProfile?.preferred_contact_method,
  );
  const hasPhoneNumber = Boolean(volunteerProfile?.phone_number?.trim());

  const match = getOpportunityMatch(volunteerProfile, opportunity);
  const matchToneClass = getOpportunityMatchToneClass(match.tone);
  const matchIcon = getOpportunityMatchCardIcon(match.tone);
  const visibleReasons = simpleView ? match.reasons.slice(0, 2) : match.reasons;

  const postcodeDisplay = getPostcodeDisplay(opportunity);
  const organisationDisplayName = getOrganisationDisplayName(organisationProfile);
  const organisationLogoUrl = getOrganisationLogoUrl(organisationProfile);
  const safetyBadges = getSafetyBadges(opportunity);
  const hasSafetyInformation = hasRoleSafetyInformation(opportunity);

  const guideSteps: RoleGuideStep[] = [
    {
      icon: "🏢",
      title: "Check the organisation",
      text: "Look for the organisation name, logo, purpose and location.",
      isComplete: Boolean(organisationProfile?.organisation_name?.trim()),
    },
    {
      icon: "📍",
      title: "Check the place",
      text: "Review whether the role is remote, hybrid or in-person.",
      isComplete: true,
    },
    {
      icon: "🛡️",
      title: "Check role safety",
      text: "Look for supervision, privacy, location and safeguarding information.",
      isComplete:
        hasSafetyInformation ||
        Boolean(opportunity.safety_notes) ||
        Boolean(opportunity.hide_exact_location),
    },
    {
      icon: "💛",
      title: "Check support",
      text: "Read the support, access and safety notes before you decide.",
      isComplete:
        Array.isArray(opportunity.support_offered) &&
        opportunity.support_offered.length > 0,
    },
    {
      icon: "🌱",
      title: "Choose your next step",
      text: "Express interest only when the role feels right for you.",
      isComplete: hasAlreadyExpressedInterest,
    },
  ];

  const listenText = simpleView
    ? `You are on an opportunity details page. Read the role. The organisation card shows who posted the role. Your preferred contact method is ${preferredContactLabel}. The safety card explains that SO Volunteering and organisations using this platform will never ask you for money, bank details, passwords, or financial information. The role safety card shows any safety information added by the organisation, such as supervision, no lone working, no home visits, no money handling, no personal care, no private messaging outside approved routes, minimum age or safeguarding review wording. If it feels right, go to the Interest section and press I'm interested.`
    : `You are on an opportunity details page. First, read the role title and short description at the top. The organisation card shows the organisation name and logo when it has been added. Your preferred contact method is ${preferredContactLabel}. The safety statement explains that SO Volunteering and organisations using this platform will never ask you for money, bank details, passwords, or financial information. An organisation may need to confirm practical details such as where you should go for an in-person volunteering role, but they should not ask for your full home address through the app. The role safety card shows any safety information added by the organisation, such as supervision, no lone working, no home visits, no money handling, no personal care, no private messaging outside approved routes, minimum age or safeguarding review wording. The location section shows safe location information, travel notes and accessibility notes where provided. Exact venue or postcode details may be hidden until the organisation has contacted or accepted a volunteer. The Why this may suit you card explains the match using your interests, skills, volunteering preference and support information. If the role feels right for you, go to the Interest section and press I'm interested.`;

  const shellClassName = [
    "dashboard-bg",
    "opportunity-detail-page",
    getThemeClass(colourTheme),
    getTextClass(textSize),
    getViewClass(viewMode),
  ].join(" ");

  return (
    <main className={shellClassName}>
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/dashboard"
            className="dashboard-brand"
            aria-label="Back to SO Volunteering dashboard"
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
            {listenMode === "always" || listenMode === "context" ? (
              <InclusiveAudioButton text={listenText} />
            ) : null}

            <Link
              href="/opportunities"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Opportunities</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="opportunity-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Opportunity details</p>

            <h1 id="opportunity-title" className="dashboard-title">
              <span aria-hidden="true">{avatarIcon}</span>
              <span>{opportunity.title}</span>
            </h1>

            <p className="dashboard-lead">{opportunity.summary}</p>

            <div className="dashboard-primary-actions opportunity-primary-actions">
              <a
                href="#express-interest"
                className={
                  hasAlreadyExpressedInterest
                    ? "secondary-button dashboard-main-action"
                    : "primary-button dashboard-main-action"
                }
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">
                    {hasAlreadyExpressedInterest ? "✅" : "🌱"}
                  </span>
                  <span>
                    {hasAlreadyExpressedInterest
                      ? "Interest expressed"
                      : "I'm interested"}
                  </span>
                </span>
              </a>

              <Link
                href="/pathway/cv"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📄</span>
                  <span>Positive Pathway CV</span>
                </span>
              </Link>

              <Link
                href="/profile/contact"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📞</span>
                  <span>Contact options</span>
                </span>
              </Link>

              <Link
                href="/opportunities"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🔎</span>
                  <span>Back to roles</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Match summary">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {matchIcon}
              </span>
              <div>
                <h2>{simpleView ? match.shortLabel : match.label}</h2>
                <p>{match.summary}</p>
              </div>
            </div>

            <div className="opportunity-contact-summary">
              <p className="dashboard-progress-note">
                Preferred contact: <strong>{preferredContactLabel}</strong>
              </p>

              <p className="dashboard-progress-note">
                Phone/text number:{" "}
                <strong>{hasPhoneNumber ? "Added" : "Not added"}</strong>
              </p>
            </div>

            {existingInterest ? (
              <div className="opportunity-interest-summary">
                <p className="dashboard-progress-note">
                  Your status:{" "}
                  <strong>{formatInterestStatus(existingInterest.status)}</strong>
                </p>
                {!simpleView ? (
                  <p className="dashboard-progress-note">
                    {getInterestHelpText(existingInterest.status)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {detailedView ? (
              <p className="dashboard-progress-note">
                App view: <strong>{getViewLabel(viewMode)}</strong> · Theme:{" "}
                <strong>{getThemeLabel(colourTheme)}</strong>
              </p>
            ) : null}
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <RoleGuide steps={guideSteps} />

        <section
          className="opportunity-trust-panel"
          aria-labelledby="opportunity-trust-title"
        >
          <article className="organisation-identity-card">
            <div className="organisation-identity-logo" aria-hidden="true">
              {organisationLogoUrl ? (
                <img src={organisationLogoUrl} alt="" />
              ) : (
                <span>🏢</span>
              )}
            </div>

            <div className="organisation-identity-copy">
              <p className="dashboard-kicker">Organisation</p>
              <h2 id="opportunity-trust-title">{organisationDisplayName}</h2>
              <p>
                {organisationProfile?.purpose?.trim()
                  ? organisationProfile.purpose
                  : "This role has been added by an organisation using SO Volunteering."}
              </p>

              <div className="organisation-identity-meta">
                {organisationProfile?.location?.trim() ? (
                  <span>
                    <span aria-hidden="true">📍</span>
                    {organisationProfile.location}
                  </span>
                ) : null}

                {organisationProfile?.website?.trim() ? (
                  <span>
                    <span aria-hidden="true">🌐</span>
                    Website added
                  </span>
                ) : null}

                {organisationLogoUrl ? (
                  <span>
                    <span aria-hidden="true">🖼️</span>
                    Logo added
                  </span>
                ) : (
                  <span>
                    <span aria-hidden="true">🏢</span>
                    Logo not added yet
                  </span>
                )}
              </div>
            </div>
          </article>

          <article className="volunteer-safety-card" aria-labelledby="safe-title">
            <div className="volunteer-safety-icon" aria-hidden="true">
              🛡️
            </div>

            <div className="volunteer-safety-copy">
              <p className="dashboard-kicker">Volunteer safety</p>
              <h2 id="safe-title">Stay safe</h2>
              <p>
                SO Volunteering and organisations using this platform will never
                ask you for money, bank details, passwords, or financial
                information. An organisation may need to confirm practical
                details, such as where you should go for an in-person
                volunteering role, but they should not ask for your full home
                address through the app. If anything feels wrong, stop and use
                Help using the app to report it.
              </p>
            </div>
          </article>
        </section>

        <section
          className="role-public-safety-panel"
          aria-labelledby="role-public-safety-title"
        >
          <div className="role-public-safety-icon" aria-hidden="true">
            ⚖️
          </div>

          <div className="role-public-safety-copy">
            <p className="dashboard-kicker">Role safety information</p>
            <h2 id="role-public-safety-title">
              Safety checks for this role
            </h2>
            <p>
              These details are added by the organisation to help you decide if
              the role feels safe, realistic and suitable. They do not replace a
              conversation with the organisation before you start.
            </p>

            {hasSafetyInformation ? (
              <>
                <div
                  className="role-public-safety-badge-grid"
                  aria-label="Role safety information"
                >
                  {safetyBadges.map((badge) => (
                    <span
                      key={`${badge.icon}-${badge.label}`}
                      className={`role-public-safety-badge ${badge.className}`}
                    >
                      <span aria-hidden="true">{badge.icon}</span>
                      {badge.label}
                    </span>
                  ))}
                </div>

                {opportunity.legal_safeguarding_notes ? (
                  <div className="role-public-safety-note">
                    <strong>Organisation note</strong>
                    <p>{opportunity.legal_safeguarding_notes}</p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="role-public-safety-empty">
                <span aria-hidden="true">🌱</span>
                <p>
                  The organisation has not added extra role-level safety details
                  yet. Read the role, check the support and safety notes, and
                  ask questions before starting.
                </p>
              </div>
            )}

            <p className="role-public-safety-helper">
              This information is guidance for volunteers. It is not legal
              advice, and it does not confirm that a PVG, DBS or AccessNI check
              is or is not required.
            </p>
          </div>
        </section>

        <section
          className="match-detail-panel"
          aria-labelledby="match-detail-title"
        >
          <div className={`match-detail-card ${matchToneClass}`}>
            <div className="match-detail-heading">
              <span className="match-detail-icon" aria-hidden="true">
                {matchIcon}
              </span>

              <div>
                <p className="dashboard-kicker">Role match</p>
                <h2 id="match-detail-title">Why this may suit you</h2>
                <p>{match.summary}</p>
              </div>
            </div>

            <div className="match-reason-list" aria-label="Match reasons">
              {visibleReasons.map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>

            {!simpleView ? (
              <p className="match-helper-note">
                This is a guide only. You can still choose any role that feels
                interesting, safe and realistic for you.
              </p>
            ) : null}
          </div>
        </section>

        <section
          className="dashboard-grid opportunity-detail-grid"
          aria-label="Opportunity information"
        >
          <DetailCard icon="📍" label="Location" title="Where it happens">
            <p>
              Type:{" "}
              <strong>{formatLocationType(opportunity.location_type)}</strong>
            </p>
            <p>
              Area: <strong>{formatSafeLocation(opportunity)}</strong>
            </p>
            <p>
              Venue: <strong>{getVenueDisplay(opportunity)}</strong>
            </p>
            {postcodeDisplay ? (
              <p>
                Postcode: <strong>{postcodeDisplay}</strong>
              </p>
            ) : null}
            {opportunity.hide_exact_location === true ? (
              <p className="safe-location-note">
                🔒 Exact location details are protected until the organisation
                contacts or accepts a volunteer.
              </p>
            ) : null}
          </DetailCard>

          <DetailCard icon="🕒" label="Time" title="Time commitment">
            <p>
              <strong>
                {opportunity.time_commitment || "Time commitment not listed"}
              </strong>
            </p>
          </DetailCard>

          <DetailCard icon="📞" label="Your contact" title="Contact preference">
            <p>
              Preferred contact: <strong>{preferredContactLabel}</strong>
            </p>
            <p>
              Phone/text number:{" "}
              <strong>{hasPhoneNumber ? "Added" : "Not added"}</strong>
            </p>
            {!simpleView ? (
              <p>
                Organisations can see your latest contact preference after you
                express interest. You can update this before sending interest.
              </p>
            ) : null}
            <Link href="/profile/contact" className="text-link">
              Update contact options
            </Link>
          </DetailCard>

          {!simpleView &&
          (hasText(opportunity.travel_notes) ||
            hasText(opportunity.accessibility_notes)) ? (
            <DetailCard
              icon="🚌"
              label="Travel and access"
              title="Planning your first visit"
            >
              {opportunity.travel_notes ? (
                <p>
                  <strong>Travel:</strong> {opportunity.travel_notes}
                </p>
              ) : null}
              {opportunity.accessibility_notes ? (
                <p>
                  <strong>Accessibility:</strong>{" "}
                  {opportunity.accessibility_notes}
                </p>
              ) : null}
            </DetailCard>
          ) : null}

          <DetailCard icon="💚" label="Interests" title="This role may suit">
            <ChipList
              values={opportunity.interests}
              emptyText="No interests listed for this role."
            />
          </DetailCard>

          <DetailCard icon="⭐" label="Skills" title="Helpful skills">
            <ChipList
              values={opportunity.skills}
              emptyText="No skills listed for this role."
            />
          </DetailCard>

          <DetailCard icon="💛" label="Support" title="Support available">
            <ChipList
              values={opportunity.support_offered}
              emptyText="No support information listed yet."
            />
          </DetailCard>

          {!simpleView ? (
            <DetailCard icon="🛡️" label="Safety" title="Safety and supervision">
              {opportunity.safety_notes ? (
                <p>{opportunity.safety_notes}</p>
              ) : (
                <p className="dashboard-muted-action">
                  No safety notes listed yet.
                </p>
              )}
            </DetailCard>
          ) : null}

          {!simpleView ? (
            <DetailCard icon="👤" label="Contact" title="Role contact">
              <p>
                Name:{" "}
                <strong>
                  {opportunity.contact_name || "Contact name not listed"}
                </strong>
              </p>
              <p>
                Email:{" "}
                <strong>
                  {opportunity.contact_email || "Contact email not listed"}
                </strong>
              </p>
            </DetailCard>
          ) : null}

          <DetailCard icon="📄" label="Positive pathway" title="Your CV">
            <p>
              Your Positive Pathway CV brings together your goals, skills,
              learning and positive evidence.
            </p>
            {!simpleView ? (
              <p>
                You do not need a perfect CV to volunteer, but it can help you
                feel more confident.
              </p>
            ) : null}
            <Link href="/pathway/cv" className="text-link">
              Open Positive Pathway CV
            </Link>
          </DetailCard>

          <DetailCard icon="🧭" label="Next steps" title="What happens next?">
            <p>
              If you express interest, the organisation can see your interest in
              their inbox.
            </p>
            {!simpleView ? (
              <>
                <p>
                  They can review your profile summary, your skills and your
                  supporting statement if you write one.
                </p>
                <p>
                  They may contact you outside the platform for now, using your
                  saved contact preference.
                </p>
              </>
            ) : null}
            <p>
              You can remove your interest later if the role no longer feels
              right.
            </p>
          </DetailCard>

          <article
            id="express-interest"
            className="info-card dashboard-pathway-card opportunity-detail-card"
          >
            <div
              className="dashboard-card-icon opportunity-detail-icon"
              aria-hidden="true"
            >
              {hasAlreadyExpressedInterest ? "✅" : "🌱"}
            </div>

            <div className="dashboard-card-copy opportunity-detail-copy">
              <div>
                <p className="dashboard-card-label">Interest</p>
                <h2>
                  {hasAlreadyExpressedInterest
                    ? "Interest expressed"
                    : "Express interest"}
                </h2>
              </div>

              <div className="opportunity-detail-body">
                {hasAlreadyExpressedInterest && existingInterest ? (
                  <>
                    <p>
                      You have already told this organisation you are interested
                      in this role.
                    </p>

                    <p>
                      Current status:{" "}
                      <strong>
                        {formatInterestStatus(existingInterest.status)}
                      </strong>
                    </p>

                    {!simpleView ? (
                      <p>{getInterestHelpText(existingInterest.status)}</p>
                    ) : null}

                    {existingInterest.message ? (
                      <div className="supporting-statement-box">
                        <p className="dashboard-card-label">
                          Your supporting statement
                        </p>
                        <p>{existingInterest.message}</p>
                      </div>
                    ) : null}

                    <div className="interest-management-actions">
                      <Link href="/my-interests" className="text-link">
                        View roles I am interested in
                      </Link>

                      <form action={removeInterestFromOpportunity}>
                        <input
                          type="hidden"
                          name="interest_id"
                          value={existingInterest.id}
                        />
                        <input
                          type="hidden"
                          name="opportunity_id"
                          value={opportunity.id}
                        />
                        <button type="submit" className="remove-interest-button">
                          Remove interest
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <form action={expressInterest} className="form-stack">
                    <input
                      type="hidden"
                      name="opportunity_id"
                      value={opportunity.id}
                    />

                    <div className="interest-safety-reminder">
                      <span aria-hidden="true">🛡️</span>
                      <p>
                        Before you continue: no organisation using SO
                        Volunteering should ask you for money, bank details,
                        passwords, financial information, or your full home
                        address through the app.
                      </p>
                    </div>

                    <div className="interest-contact-reminder">
                      <span aria-hidden="true">📞</span>
                      <p>
                        Your current preferred contact method is{" "}
                        <strong>{preferredContactLabel}</strong>.
                        {hasPhoneNumber
                          ? " Your phone/text number is saved."
                          : " Add a phone/text number first if you want phone or text contact."}
                      </p>
                    </div>

                    <label className="field-label">
                      <span className="field-label-row">
                        <span className="field-label-icon" aria-hidden="true">
                          💬
                        </span>
                        <span>
                          {simpleView
                            ? "Optional message"
                            : "Optional supporting statement"}
                        </span>
                      </span>
                      <textarea
                        name="message"
                        rows={simpleView ? 3 : 4}
                        placeholder={
                          simpleView
                            ? "Optional. You can leave this blank."
                            : "Optional. You can leave this blank, write a short message, or add a fuller supporting statement explaining why you are interested."
                        }
                      />
                    </label>

                    <button type="submit" className="primary-button">
                      <span className="button-balanced-inner">
                        <span aria-hidden="true">🌱</span>
                        <span>I'm interested</span>
                      </span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </article>
        </section>
      </section>

      <style>{`
        .opportunity-detail-page,
        .opportunity-detail-page * {
          box-sizing: border-box;
        }

        .opportunity-detail-page .dashboard-grid {
          align-items: stretch;
        }

        .opportunity-detail-page .dashboard-pathway-card {
          height: 100%;
          align-items: stretch;
        }

        .opportunity-primary-actions {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          width: min(100%, 620px);
          align-items: stretch;
        }

        .opportunity-primary-actions .dashboard-main-action {
          width: 100%;
          min-height: 54px;
          justify-content: center;
          text-align: center;
        }

        .opportunity-contact-summary,
        .opportunity-interest-summary {
          display: grid;
          gap: 7px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(83, 111, 99, 0.12);
        }

        .opportunity-contact-summary .dashboard-progress-note,
        .opportunity-interest-summary .dashboard-progress-note {
          margin: 0;
        }

        .role-detail-guide-panel {
          padding: clamp(20px, 4vw, 28px);
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 30px;
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.92), rgba(255, 255, 255, 0.9));
          box-shadow: 0 18px 56px rgba(38, 50, 56, 0.07);
          display: grid;
          gap: 18px;
          overflow: hidden;
        }

        .role-detail-guide-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .role-detail-guide-heading > span {
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

        .role-detail-guide-heading h2 {
          margin: 2px 0 8px;
          color: #315f48;
          font-size: clamp(1.35rem, 3vw, 1.8rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .role-detail-guide-heading p {
          margin: 0;
          max-width: 760px;
          color: #60706a;
          font-weight: 750;
          line-height: 1.55;
        }

        .role-detail-guide-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }

        .role-detail-guide-step {
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

        .role-detail-guide-step-complete {
          border-color: rgba(34, 124, 78, 0.26);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.28), transparent 34%),
            rgba(244, 255, 249, 0.92);
          box-shadow: 0 14px 30px rgba(33, 96, 61, 0.08);
        }

        .role-detail-guide-step-number {
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

        .role-detail-guide-step-complete .role-detail-guide-step-number {
          background: rgba(34, 124, 78, 0.14);
          color: #145c38;
        }

        .role-detail-guide-step-icon {
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

        .role-detail-guide-step-complete .role-detail-guide-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .role-detail-guide-step-copy {
          display: grid;
          gap: 6px;
        }

        .role-detail-guide-step-kicker {
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

        .role-detail-guide-step-kicker span {
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

        .role-detail-guide-step-complete .role-detail-guide-step-kicker,
        .role-detail-guide-step-complete .role-detail-guide-step-kicker span {
          color: #145c38;
        }

        .role-detail-guide-step-complete .role-detail-guide-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .role-detail-guide-step-copy h3 {
          margin: 0;
          padding-right: 32px;
          color: #315f48;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.14;
        }

        .role-detail-guide-step-copy p {
          margin: 0;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 740;
          line-height: 1.42;
        }

        .opportunity-trust-panel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
          gap: 16px;
          align-items: stretch;
        }

        .organisation-identity-card,
        .volunteer-safety-card,
        .role-public-safety-panel {
          display: grid;
          min-width: 0;
          min-height: 100%;
          gap: 16px;
          align-items: start;
          padding: clamp(18px, 4vw, 24px);
          border-radius: 28px;
          box-shadow: 0 18px 56px rgba(38, 50, 56, 0.07);
          overflow: hidden;
        }

        .organisation-identity-card {
          grid-template-columns: auto 1fr;
          border: 1px solid rgba(108, 92, 160, 0.14);
          background: rgba(255, 255, 255, 0.86);
        }

        .volunteer-safety-card {
          grid-template-columns: auto 1fr;
          border: 1px solid rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.4), transparent 32%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.94), rgba(255, 255, 255, 0.92));
        }

        .role-public-safety-panel {
          grid-template-columns: auto 1fr;
          border: 1px solid rgba(108, 92, 160, 0.18);
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.94), rgba(255, 255, 255, 0.92));
        }

        .organisation-identity-logo,
        .volunteer-safety-icon,
        .role-public-safety-icon {
          display: inline-flex;
          width: 72px;
          height: 72px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 24px;
          background: rgba(248, 248, 252, 0.94);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.1);
          flex: 0 0 auto;
        }

        .organisation-identity-logo img {
          display: block;
          max-width: 86%;
          max-height: 58px;
          object-fit: contain;
        }

        .organisation-identity-logo span,
        .volunteer-safety-icon,
        .role-public-safety-icon {
          font-size: 2rem;
        }

        .volunteer-safety-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.16);
        }

        .role-public-safety-icon {
          background: rgba(108, 92, 160, 0.12);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.14);
        }

        .organisation-identity-copy,
        .volunteer-safety-copy,
        .role-public-safety-copy {
          display: grid;
          gap: 8px;
          min-width: 0;
        }

        .organisation-identity-copy h2,
        .volunteer-safety-copy h2,
        .role-public-safety-copy h2 {
          margin: 0;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          line-height: 1.1;
          letter-spacing: -0.035em;
          overflow-wrap: anywhere;
        }

        .organisation-identity-copy h2 {
          color: #315f48;
        }

        .volunteer-safety-copy h2 {
          color: #145c38;
        }

        .role-public-safety-copy h2 {
          color: #4f4b82;
        }

        .organisation-identity-copy p,
        .volunteer-safety-copy p,
        .role-public-safety-copy p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .volunteer-safety-copy p {
          color: #275f45;
          font-weight: 780;
        }

        .role-public-safety-badge-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .role-public-safety-badge {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 11px;
          border-radius: 999px;
          font-size: 0.84rem;
          font-weight: 950;
          line-height: 1.12;
        }

        .role-safety-badge-ready {
          border: 1px solid rgba(83, 111, 99, 0.2);
          background: rgba(244, 255, 249, 0.92);
          color: #536f63;
        }

        .role-safety-badge-info {
          border: 1px solid rgba(108, 92, 160, 0.16);
          background: rgba(248, 245, 255, 0.9);
          color: #5c5488;
        }

        .role-safety-badge-warning {
          border: 1px solid rgba(191, 146, 72, 0.24);
          background: rgba(255, 250, 241, 0.92);
          color: #8a6630;
        }

        .role-public-safety-note,
        .role-public-safety-empty {
          display: grid;
          gap: 6px;
          margin-top: 10px;
          padding: 13px;
          border-radius: 18px;
        }

        .role-public-safety-note {
          border: 1px solid rgba(108, 92, 160, 0.14);
          background: rgba(255, 255, 255, 0.74);
        }

        .role-public-safety-note strong {
          color: #4f4b82;
          font-weight: 950;
        }

        .role-public-safety-empty {
          grid-template-columns: auto 1fr;
          align-items: start;
          border: 1px solid rgba(83, 111, 99, 0.16);
          background: rgba(244, 255, 249, 0.74);
        }

        .role-public-safety-empty span {
          font-size: 1.3rem;
          line-height: 1;
        }

        .role-public-safety-helper {
          margin-top: 6px !important;
          color: #6a6078 !important;
          font-size: 0.9rem;
          font-weight: 850 !important;
        }

        .organisation-identity-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }

        .organisation-identity-meta span {
          display: inline-flex;
          min-height: 32px;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 10px;
          border: 1px solid rgba(83, 111, 99, 0.14);
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.78);
          color: #536f63;
          font-size: 0.82rem;
          font-weight: 900;
          line-height: 1.12;
        }

        .interest-safety-reminder,
        .interest-contact-reminder {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
          padding: 12px 14px;
          border-radius: 18px;
          color: #275f45;
        }

        .interest-safety-reminder {
          border: 1px solid rgba(34, 124, 78, 0.2);
          background: rgba(244, 255, 249, 0.9);
        }

        .interest-contact-reminder {
          border: 1px solid rgba(108, 92, 160, 0.16);
          background: rgba(248, 245, 255, 0.84);
        }

        .interest-safety-reminder span,
        .interest-contact-reminder span {
          font-size: 1.25rem;
          line-height: 1;
        }

        .interest-safety-reminder p,
        .interest-contact-reminder p {
          margin: 0;
          color: #275f45;
          font-size: 0.94rem;
          font-weight: 850;
          line-height: 1.42;
        }

        .interest-contact-reminder p {
          color: #536f63;
        }

        .match-detail-panel {
          display: grid;
        }

        .match-detail-card {
          display: grid;
          gap: 16px;
          padding: clamp(18px, 4vw, 24px);
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 18px 56px rgba(38, 50, 56, 0.07);
        }

        .match-detail-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .match-detail-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.9rem;
        }

        .match-detail-heading h2 {
          margin: 2px 0 8px;
          color: #315f48;
          font-size: clamp(1.35rem, 3vw, 1.85rem);
          letter-spacing: -0.035em;
        }

        .match-detail-heading p {
          margin: 0;
          color: #60706a;
          line-height: 1.52;
          font-weight: 750;
        }

        .match-reason-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .match-reason-list span {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          padding: 7px 11px;
          border: 1px solid rgba(83, 111, 99, 0.16);
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.86);
          color: #536f63;
          font-size: 0.84rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .match-helper-note {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.45;
        }

        .match-tone-strong {
          border-color: rgba(83, 111, 99, 0.28);
          background: rgba(244, 255, 249, 0.96);
        }

        .match-tone-good {
          border-color: rgba(74, 112, 160, 0.22);
          background: rgba(243, 249, 255, 0.9);
        }

        .match-tone-explore {
          border-color: rgba(108, 92, 160, 0.16);
          background: rgba(248, 245, 255, 0.82);
        }

        .opportunity-detail-grid {
          align-items: stretch;
        }

        .opportunity-detail-card {
          min-height: 210px;
          height: 100%;
          align-items: stretch;
        }

        .opportunity-detail-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          gap: 18px;
        }

        .opportunity-detail-copy h2 {
          overflow-wrap: anywhere;
        }

        .opportunity-detail-body {
          display: grid;
          gap: 10px;
          color: #5d6677;
          line-height: 1.55;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .opportunity-detail-body p {
          margin: 0;
        }

        .safe-location-note {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          padding: 10px 12px;
          border: 1px solid rgba(83, 111, 99, 0.16);
          border-radius: 16px;
          background: rgba(244, 255, 249, 0.82);
          color: #536f63;
          font-weight: 850;
          line-height: 1.35;
        }

        .opportunity-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-start;
        }

        .opportunity-chip {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          max-width: 100%;
          padding: 9px 12px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #536f63;
          font-size: 0.88rem;
          font-weight: 800;
          line-height: 1.2;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .supporting-statement-box {
          display: grid;
          gap: 6px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
        }

        .interest-management-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          padding-top: 6px;
        }

        .remove-interest-button {
          appearance: none;
          border: 1px solid rgba(190, 80, 80, 0.28);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          color: #9b3d3d;
          cursor: pointer;
          font: inherit;
          font-size: 0.9rem;
          font-weight: 850;
          min-height: 44px;
          padding: 10px 16px;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
        }

        .remove-interest-button:hover {
          background: rgba(255, 245, 245, 0.98);
          border-color: rgba(190, 80, 80, 0.42);
        }

        .remove-interest-button:focus-visible {
          outline: 4px solid rgba(190, 80, 80, 0.22);
          outline-offset: 3px;
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .opportunity-detail-body,
        .preference-text-large .dashboard-progress-note,
        .preference-text-large .match-detail-heading p,
        .preference-text-large .match-helper-note,
        .preference-text-large .volunteer-safety-copy p,
        .preference-text-large .organisation-identity-copy p,
        .preference-text-large .role-public-safety-copy p {
          font-size: 1.04em;
        }

        .preference-text-large .dashboard-title {
          letter-spacing: -0.035em;
        }

        .preference-view-simple .dashboard-grid {
          gap: 18px;
        }

        .preference-view-simple .opportunity-detail-card {
          min-height: 190px;
        }

        .preference-view-simple .dashboard-card-icon {
          font-size: 2rem;
        }

        .preference-view-detailed .opportunity-detail-card {
          min-height: 230px;
        }

        .preference-theme-calm_green {
          background:
            radial-gradient(circle at top left, rgba(200, 243, 221, 0.58), transparent 34%),
            linear-gradient(135deg, #f3fff8 0%, #f7fbf5 46%, #fffaf2 100%);
        }

        .preference-theme-calm_green .dashboard-welcome-card,
        .preference-theme-calm_green .info-card,
        .preference-theme-calm_green .dashboard-progress-card,
        .preference-theme-calm_green .match-detail-card,
        .preference-theme-calm_green .organisation-identity-card,
        .preference-theme-calm_green .volunteer-safety-card,
        .preference-theme-calm_green .role-public-safety-panel,
        .preference-theme-calm_green .role-detail-guide-panel {
          border-color: rgba(83, 111, 99, 0.2);
        }

        .preference-theme-calm_green .dashboard-card-icon,
        .preference-theme-calm_green .dashboard-progress-icon,
        .preference-theme-calm_green .match-detail-icon,
        .preference-theme-calm_green .organisation-identity-logo {
          background: rgba(226, 255, 239, 0.86);
        }

        .preference-theme-soft_blue {
          background:
            radial-gradient(circle at top left, rgba(197, 226, 255, 0.62), transparent 34%),
            linear-gradient(135deg, #f3f9ff 0%, #f8fbff 48%, #fffaf2 100%);
        }

        .preference-theme-soft_blue .dashboard-welcome-card,
        .preference-theme-soft_blue .info-card,
        .preference-theme-soft_blue .dashboard-progress-card,
        .preference-theme-soft_blue .match-detail-card,
        .preference-theme-soft_blue .organisation-identity-card,
        .preference-theme-soft_blue .volunteer-safety-card,
        .preference-theme-soft_blue .role-public-safety-panel,
        .preference-theme-soft_blue .role-detail-guide-panel {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .preference-theme-soft_blue .dashboard-card-icon,
        .preference-theme-soft_blue .dashboard-progress-icon,
        .preference-theme-soft_blue .match-detail-icon,
        .preference-theme-soft_blue .organisation-identity-logo {
          background: rgba(231, 244, 255, 0.92);
        }

        .preference-theme-warm_peach {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.58), transparent 34%),
            linear-gradient(135deg, #fff8f1 0%, #fffaf6 48%, #f7fff8 100%);
        }

        .preference-theme-warm_peach .dashboard-welcome-card,
        .preference-theme-warm_peach .info-card,
        .preference-theme-warm_peach .dashboard-progress-card,
        .preference-theme-warm_peach .match-detail-card,
        .preference-theme-warm_peach .organisation-identity-card,
        .preference-theme-warm_peach .volunteer-safety-card,
        .preference-theme-warm_peach .role-public-safety-panel,
        .preference-theme-warm_peach .role-detail-guide-panel {
          border-color: rgba(190, 118, 76, 0.2);
        }

        .preference-theme-warm_peach .dashboard-card-icon,
        .preference-theme-warm_peach .dashboard-progress-icon,
        .preference-theme-warm_peach .match-detail-icon,
        .preference-theme-warm_peach .organisation-identity-logo {
          background: rgba(255, 239, 226, 0.92);
        }

        .preference-theme-high_contrast {
          background: #f8fafc;
        }

        .preference-theme-high_contrast .dashboard-welcome-card,
        .preference-theme-high_contrast .info-card,
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .opportunity-chip,
        .preference-theme-high_contrast .supporting-statement-box,
        .preference-theme-high_contrast .match-detail-card,
        .preference-theme-high_contrast .match-reason-list span,
        .preference-theme-high_contrast .safe-location-note,
        .preference-theme-high_contrast .organisation-identity-card,
        .preference-theme-high_contrast .volunteer-safety-card,
        .preference-theme-high_contrast .role-public-safety-panel,
        .preference-theme-high_contrast .role-public-safety-note,
        .preference-theme-high_contrast .role-public-safety-empty,
        .preference-theme-high_contrast .role-public-safety-badge,
        .preference-theme-high_contrast .interest-safety-reminder,
        .preference-theme-high_contrast .interest-contact-reminder,
        .preference-theme-high_contrast .role-detail-guide-panel,
        .preference-theme-high_contrast .role-detail-guide-step {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .match-detail-heading h2,
        .preference-theme-high_contrast .organisation-identity-copy h2,
        .preference-theme-high_contrast .volunteer-safety-copy h2,
        .preference-theme-high_contrast .role-public-safety-copy h2,
        .preference-theme-high_contrast .role-detail-guide-heading h2,
        .preference-theme-high_contrast .role-detail-guide-step-copy h3 {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .opportunity-detail-body,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .dashboard-muted-action,
        .preference-theme-high_contrast .opportunity-chip,
        .preference-theme-high_contrast .match-detail-heading p,
        .preference-theme-high_contrast .match-helper-note,
        .preference-theme-high_contrast .match-reason-list span,
        .preference-theme-high_contrast .safe-location-note,
        .preference-theme-high_contrast .organisation-identity-copy p,
        .preference-theme-high_contrast .volunteer-safety-copy p,
        .preference-theme-high_contrast .role-public-safety-copy p,
        .preference-theme-high_contrast .role-public-safety-badge,
        .preference-theme-high_contrast .interest-safety-reminder,
        .preference-theme-high_contrast .interest-safety-reminder p,
        .preference-theme-high_contrast .interest-contact-reminder,
        .preference-theme-high_contrast .interest-contact-reminder p,
        .preference-theme-high_contrast .role-detail-guide-heading p,
        .preference-theme-high_contrast .role-detail-guide-step-copy p {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-card-icon,
        .preference-theme-high_contrast .dashboard-progress-icon,
        .preference-theme-high_contrast .match-detail-icon,
        .preference-theme-high_contrast .organisation-identity-logo,
        .preference-theme-high_contrast .volunteer-safety-icon,
        .preference-theme-high_contrast .role-public-safety-icon,
        .preference-theme-high_contrast .role-detail-guide-heading > span,
        .preference-theme-high_contrast .role-detail-guide-step-icon {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
        }

        .preference-theme-neon_arcade {
          background:
            radial-gradient(circle at top left, rgba(34, 211, 238, 0.28), transparent 34%),
            radial-gradient(circle at top right, rgba(217, 70, 239, 0.24), transparent 30%),
            linear-gradient(135deg, #101827 0%, #15132c 46%, #071827 100%);
        }

        .preference-theme-neon_arcade .dashboard-welcome-card,
        .preference-theme-neon_arcade .dashboard-progress-card,
        .preference-theme-neon_arcade .info-card,
        .preference-theme-neon_arcade .supporting-statement-box,
        .preference-theme-neon_arcade .match-detail-card,
        .preference-theme-neon_arcade .organisation-identity-card,
        .preference-theme-neon_arcade .volunteer-safety-card,
        .preference-theme-neon_arcade .role-public-safety-panel,
        .preference-theme-neon_arcade .role-public-safety-note,
        .preference-theme-neon_arcade .role-public-safety-empty,
        .preference-theme-neon_arcade .interest-safety-reminder,
        .preference-theme-neon_arcade .interest-contact-reminder,
        .preference-theme-neon_arcade .role-detail-guide-panel,
        .preference-theme-neon_arcade .role-detail-guide-step {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .dashboard-title,
        .preference-theme-neon_arcade .dashboard-card-copy h2,
        .preference-theme-neon_arcade .dashboard-progress-card h2,
        .preference-theme-neon_arcade .dashboard-progress-note strong,
        .preference-theme-neon_arcade .opportunity-detail-body strong,
        .preference-theme-neon_arcade .match-detail-heading h2,
        .preference-theme-neon_arcade .organisation-identity-copy h2,
        .preference-theme-neon_arcade .volunteer-safety-copy h2,
        .preference-theme-neon_arcade .role-public-safety-copy h2,
        .preference-theme-neon_arcade .role-detail-guide-heading h2,
        .preference-theme-neon_arcade .role-detail-guide-step-copy h3 {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-card-label,
        .preference-theme-neon_arcade .opportunity-detail-body,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .dashboard-muted-action,
        .preference-theme-neon_arcade .match-detail-heading p,
        .preference-theme-neon_arcade .match-helper-note,
        .preference-theme-neon_arcade .organisation-identity-copy p,
        .preference-theme-neon_arcade .volunteer-safety-copy p,
        .preference-theme-neon_arcade .role-public-safety-copy p,
        .preference-theme-neon_arcade .interest-safety-reminder p,
        .preference-theme-neon_arcade .interest-contact-reminder p,
        .preference-theme-neon_arcade .role-detail-guide-heading p,
        .preference-theme-neon_arcade .role-detail-guide-step-copy p {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-card-icon,
        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .match-detail-icon,
        .preference-theme-neon_arcade .organisation-identity-logo,
        .preference-theme-neon_arcade .volunteer-safety-icon,
        .preference-theme-neon_arcade .role-public-safety-icon,
        .preference-theme-neon_arcade .role-detail-guide-heading > span,
        .preference-theme-neon_arcade .role-detail-guide-step-icon {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .opportunity-chip,
        .preference-theme-neon_arcade .text-link,
        .preference-theme-neon_arcade .match-reason-list span,
        .preference-theme-neon_arcade .safe-location-note,
        .preference-theme-neon_arcade .organisation-identity-meta span,
        .preference-theme-neon_arcade .role-public-safety-badge {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
        }

        .preference-theme-neon_arcade .remove-interest-button {
          border-color: rgba(248, 113, 113, 0.5);
          background: rgba(127, 29, 29, 0.28);
          color: #fecaca;
        }

        @media (max-width: 1180px) {
          .role-detail-guide-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .opportunity-trust-panel {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .opportunity-primary-actions {
            grid-template-columns: 1fr;
            width: 100%;
          }

          .role-detail-guide-heading,
          .role-public-safety-panel {
            grid-template-columns: 1fr;
          }

          .role-detail-guide-heading > span,
          .role-public-safety-icon {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .role-detail-guide-grid {
            grid-template-columns: 1fr;
          }

          .opportunity-primary-actions .primary-button,
          .opportunity-primary-actions .secondary-button {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .organisation-identity-card,
          .volunteer-safety-card,
          .match-detail-heading {
            grid-template-columns: 1fr;
          }

          .organisation-identity-card,
          .volunteer-safety-card,
          .role-public-safety-panel,
          .match-detail-card,
          .role-detail-guide-panel {
            border-radius: 24px;
          }

          .organisation-identity-logo,
          .volunteer-safety-icon,
          .role-public-safety-icon,
          .match-detail-icon {
            width: 58px;
            height: 58px;
            border-radius: 20px;
          }

          .organisation-identity-meta span {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .role-public-safety-badge,
          .match-reason-list span {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .role-public-safety-empty {
            grid-template-columns: 1fr;
          }

          .opportunity-detail-card {
            min-height: 0;
          }

          .opportunity-detail-copy {
            gap: 14px;
          }

          .opportunity-chip-list {
            gap: 8px;
          }

          .opportunity-chip,
          .safe-location-note {
            width: 100%;
            justify-content: center;
            border-radius: 18px;
            font-size: 0.86rem;
            text-align: center;
          }

          .interest-management-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .remove-interest-button {
            width: 100%;
          }

          .interest-safety-reminder,
          .interest-contact-reminder {
            grid-template-columns: 1fr;
            text-align: left;
          }

          .preference-text-large {
            font-size: 1.03rem;
          }

          .preference-view-simple .opportunity-detail-card,
          .preference-view-detailed .opportunity-detail-card {
            min-height: 0;
          }
        }
      `}</style>
    </main>
  );
}
