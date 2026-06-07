import Link from "next/link";
import { redirect } from "next/navigation";
import { updateOpportunity } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  email: string | null;
  user_type: string | null;
};

type OrganisationProfile = {
  organisation_name: string | null;
  contact_email: string | null;
  support_offered: string[] | null;
  profile_completed: boolean | null;
  organisation_type: string | null;
  safeguarding_region: string | null;
  works_with_children_or_pupils: boolean | null;
};

type Opportunity = {
  id: string;
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

type ChoiceOption = {
  value: string;
  label: string;
  icon: string;
  helpText: string;
};

type ReadinessItem = {
  icon: string;
  title: string;
  text: string;
  status: "ready" | "attention" | "optional";
  label: string;
};

type GuideStep = {
  icon: string;
  title: string;
  text: string;
  isComplete: boolean;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function isChecked(savedValues: string[] | null | undefined, value: string) {
  return Array.isArray(savedValues) && savedValues.includes(value);
}

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function hasLongEnoughText(value: string | null | undefined, minimum = 40) {
  return Boolean(value && value.trim().length >= minimum);
}

function hasAny(values: string[] | null | undefined) {
  return Array.isArray(values) && values.length > 0;
}

function getSafeguardingRegionLabel(value: string | null | undefined) {
  if (value === "england_wales") return "England / Wales - DBS";
  if (value === "northern_ireland") return "Northern Ireland - AccessNI";
  if (value === "other") return "Other / country-specific guidance";

  return "Scotland - PVG";
}

function getOrganisationTypeLabel(value: string | null | undefined) {
  if (value === "school_college") return "School / college";
  if (value === "local_authority_employability") {
    return "Local authority / employability partner";
  }
  if (value === "other") return "Other organisation";

  return "Charity / community organisation";
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

  return "Not set yet";
}

function getSafeguardingCheckRegionLabel(value: string | null | undefined) {
  if (value === "scotland_pvg") return "Scotland - PVG";
  if (value === "england_wales_dbs") return "England / Wales - DBS";
  if (value === "northern_ireland_accessni") {
    return "Northern Ireland - AccessNI";
  }
  if (value === "not_expected") return "Not expected for this role";
  if (value === "not_sure") return "Not sure - needs review";

  return "Use organisation default";
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

  return "Not set yet";
}

function hasLegalSafeguardingReadiness(opportunity: Opportunity) {
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

function getReadinessItems(opportunity: Opportunity): ReadinessItem[] {
  const hasUsefulLocation =
    opportunity.location_type === "remote" ||
    hasText(opportunity.location_town_city) ||
    hasText(opportunity.location_area) ||
    hasText(opportunity.location);

  const hasTravelOrAccess =
    hasText(opportunity.travel_notes) || hasText(opportunity.accessibility_notes);

  const exactLocationConsidered =
    opportunity.hide_exact_location === true ||
    hasText(opportunity.location_venue) ||
    hasText(opportunity.location_postcode) ||
    opportunity.location_type === "remote";

  const hasLegalReadiness = hasLegalSafeguardingReadiness(opportunity);

  const needsSafeguardingAttention =
    opportunity.suitable_for_pupils === true ||
    opportunity.safeguarding_review_required === true ||
    opportunity.school_approval_required === true ||
    opportunity.parent_carer_consent_required === true ||
    opportunity.role_frequency_pattern === "more_than_three_days_in_thirty" ||
    opportunity.role_frequency_pattern === "overnight" ||
    opportunity.role_frequency_pattern === "not_sure" ||
    opportunity.safeguarding_check_region === "not_sure";

  const hasSafeguardingNotes =
    hasText(opportunity.legal_safeguarding_notes) ||
    hasText(opportunity.named_safeguarding_contact) ||
    opportunity.risk_assessment_completed === true ||
    opportunity.supervision_required === true;

  return [
    {
      icon: "💬",
      title: "Plain-language summary",
      text: hasLongEnoughText(opportunity.summary)
        ? "The role has a useful plain-language summary."
        : "Add a little more detail so volunteers understand what they will do.",
      status: hasLongEnoughText(opportunity.summary) ? "ready" : "attention",
      label: hasLongEnoughText(opportunity.summary) ? "Ready" : "Needs detail",
    },
    {
      icon: "📍",
      title: "Location is realistic",
      text: hasUsefulLocation
        ? "The role has enough location information for volunteers to start deciding."
        : "Add town/city, area or remote details so people can judge if this is realistic.",
      status: hasUsefulLocation ? "ready" : "attention",
      label: hasUsefulLocation ? "Ready" : "Needs detail",
    },
    {
      icon: "🚌",
      title: "Travel and access notes",
      text: hasTravelOrAccess
        ? "Travel or accessibility notes have been added."
        : "Travel and accessibility notes are optional, but very helpful for inclusive roles.",
      status: hasTravelOrAccess ? "ready" : "optional",
      label: hasTravelOrAccess ? "Ready" : "Helpful",
    },
    {
      icon: "🕒",
      title: "Time commitment",
      text: hasText(opportunity.time_commitment)
        ? "The role has a clear time commitment."
        : "Choose a time commitment so volunteers know what to expect.",
      status: hasText(opportunity.time_commitment) ? "ready" : "attention",
      label: hasText(opportunity.time_commitment) ? "Ready" : "Needs detail",
    },
    {
      icon: "💛",
      title: "Support available",
      text: hasAny(opportunity.support_offered)
        ? "Support options are listed for this role."
        : "Select support options such as clear instructions, named contact or check-ins.",
      status: hasAny(opportunity.support_offered) ? "ready" : "attention",
      label: hasAny(opportunity.support_offered) ? "Ready" : "Needs detail",
    },
    {
      icon: "⭐",
      title: "Skills and interests",
      text:
        hasAny(opportunity.interests) && hasAny(opportunity.skills)
          ? "The role has interests and skills for matching."
          : "Add interests and helpful skills so volunteers can understand why it may suit them.",
      status:
        hasAny(opportunity.interests) && hasAny(opportunity.skills)
          ? "ready"
          : "attention",
      label:
        hasAny(opportunity.interests) && hasAny(opportunity.skills)
          ? "Ready"
          : "Needs detail",
    },
    {
      icon: "🛡️",
      title: "Safety and supervision",
      text: hasText(opportunity.safety_notes)
        ? "Safety or supervision notes have been added."
        : "Add who welcomes volunteers, who supervises, and who they can ask for help.",
      status: hasText(opportunity.safety_notes) ? "ready" : "attention",
      label: hasText(opportunity.safety_notes) ? "Ready" : "Needs detail",
    },
    {
      icon: "🔒",
      title: "Exact location privacy",
      text: exactLocationConsidered
        ? "Location privacy has been considered for this role."
        : "Consider whether exact venue or postcode should be hidden until after contact.",
      status: exactLocationConsidered ? "ready" : "optional",
      label: exactLocationConsidered ? "Ready" : "Helpful",
    },
    {
      icon: "⚖️",
      title: "Legal and safeguarding",
      text: hasLegalReadiness
        ? "Role-level legal and safeguarding readiness has been started."
        : "Complete the legal and safeguarding section before relying on this role for pupils or younger volunteers.",
      status: hasLegalReadiness ? "ready" : "attention",
      label: hasLegalReadiness ? "Ready" : "Needs detail",
    },
    {
      icon: "🏫",
      title: "Pupil suitability review",
      text: needsSafeguardingAttention
        ? hasSafeguardingNotes
          ? "This role has pupil/safeguarding flags and supporting review information."
          : "This role has pupil/safeguarding flags. Add review notes, a named contact or risk assessment status."
        : "No pupil-specific or high-risk safeguarding flags are currently selected.",
      status:
        needsSafeguardingAttention && !hasSafeguardingNotes
          ? "attention"
          : "optional",
      label:
        needsSafeguardingAttention && !hasSafeguardingNotes
          ? "Needs review"
          : "Checked",
    },
  ];
}

function getReadinessSummary(items: ReadinessItem[]) {
  const attentionCount = items.filter((item) => item.status === "attention").length;
  const readyCount = items.filter((item) => item.status === "ready").length;

  if (attentionCount === 0) {
    return {
      icon: "✅",
      title: "Role display looks ready",
      text: "This role has the key information volunteers need before they decide.",
      readyCount,
      attentionCount,
    };
  }

  return {
    icon: "🌱",
    title: "Role display needs a little more detail",
    text: `${attentionCount} item${
      attentionCount === 1 ? "" : "s"
    } need attention before this role will feel fully clear and inclusive.`,
    readyCount,
    attentionCount,
  };
}

const interestOptions: ChoiceOption[] = [
  {
    value: "Helping people",
    label: "Helping people",
    icon: "🤝",
    helpText: "Welcoming, supporting or helping community members.",
  },
  {
    value: "Animals and nature",
    label: "Animals and nature",
    icon: "🌿",
    helpText: "Gardens, green spaces, animals or outdoor roles.",
  },
  {
    value: "Events and activities",
    label: "Events and activities",
    icon: "🎪",
    helpText: "Events, groups, clubs, fundraisers or activities.",
  },
  {
    value: "Creative tasks",
    label: "Creative tasks",
    icon: "🎨",
    helpText: "Music, art, design, photography, writing or making.",
  },
  {
    value: "Practical tasks",
    label: "Practical tasks",
    icon: "🧰",
    helpText: "Set up, sort items, pack things or hands-on help.",
  },
  {
    value: "Digital or admin",
    label: "Digital or admin",
    icon: "💻",
    helpText: "Simple forms, emails, organising or computer tasks.",
  },
  {
    value: "Food and hospitality",
    label: "Food and hospitality",
    icon: "☕",
    helpText: "Refreshments, cafe support, kitchen help or hosting.",
  },
  {
    value: "Sport and wellbeing",
    label: "Sport and wellbeing",
    icon: "⚽",
    helpText: "Active roles, walking groups or wellbeing activities.",
  },
  {
    value: "Shops and donations",
    label: "Shops and donations",
    icon: "🛍️",
    helpText: "Shop support, stock sorting, donations or customers.",
  },
  {
    value: "Open to ideas",
    label: "Open to ideas",
    icon: "🌈",
    helpText: "Good for volunteers exploring what suits them.",
  },
];

const skillOptions: ChoiceOption[] = [
  {
    value: "Being friendly and welcoming",
    label: "Friendly and welcoming",
    icon: "😊",
    helpText: "Helping people feel comfortable and included.",
  },
  {
    value: "Listening to people",
    label: "Listening",
    icon: "👂",
    helpText: "Giving people time, patience and attention.",
  },
  {
    value: "Following instructions",
    label: "Following instructions",
    icon: "✅",
    helpText: "Working through clear steps safely and carefully.",
  },
  {
    value: "Teamwork",
    label: "Teamwork",
    icon: "👥",
    helpText: "Working with others towards a shared goal.",
  },
  {
    value: "Organising things",
    label: "Organising things",
    icon: "🗂️",
    helpText: "Sorting, planning, arranging or keeping tasks on track.",
  },
  {
    value: "Using a phone or computer",
    label: "Phone or computer",
    icon: "📱",
    helpText: "Using messages, forms or simple digital tools.",
  },
  {
    value: "Practical hands-on help",
    label: "Hands-on help",
    icon: "🛠️",
    helpText: "Moving, carrying, preparing, tidying or setting up.",
  },
  {
    value: "Problem solving",
    label: "Problem solving",
    icon: "🧩",
    helpText: "Finding practical ways to help when things change.",
  },
  {
    value: "Staying calm",
    label: "Staying calm",
    icon: "🌤️",
    helpText: "Taking things one step at a time.",
  },
  {
    value: "No experience needed",
    label: "No experience needed",
    icon: "🌱",
    helpText: "A gentle role where people can learn as they go.",
  },
];

const supportOptions: ChoiceOption[] = [
  {
    value: "Clear written instructions",
    label: "Clear instructions",
    icon: "📝",
    helpText: "Volunteers know what to expect before starting.",
  },
  {
    value: "Named contact person",
    label: "Named contact",
    icon: "👋",
    helpText: "A clear person volunteers can ask for help.",
  },
  {
    value: "Shorter starter shifts",
    label: "Shorter shifts",
    icon: "🌱",
    helpText: "People can start gently and build confidence.",
  },
  {
    value: "Flexible timings where possible",
    label: "Flexible timings",
    icon: "🕒",
    helpText: "Times can be adjusted where the role allows.",
  },
  {
    value: "Quiet space or calmer option",
    label: "Quiet option",
    icon: "🌙",
    helpText: "A quieter space or lower-pressure task where possible.",
  },
  {
    value: "Check-ins and encouragement",
    label: "Check-ins",
    icon: "💛",
    helpText: "Regular supportive check-ins from the organisation.",
  },
];

function ChoiceGrid({
  name,
  options,
  savedValues,
}: {
  name: string;
  options: ChoiceOption[];
  savedValues: string[] | null | undefined;
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <label key={option.value} className="choice-card">
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={isChecked(savedValues, option.value)}
          />

          <span className="choice-card-icon" aria-hidden="true">
            {option.icon}
          </span>

          <span className="choice-card-copy">
            <span className="choice-card-title">{option.label}</span>
            <small className="choice-help">{option.helpText}</small>
          </span>
        </label>
      ))}
    </div>
  );
}

function StepSection({
  stepNumber,
  icon,
  title,
  description,
  isComplete,
  children,
}: {
  stepNumber: number;
  icon: string;
  title: string;
  description: string;
  isComplete: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        isComplete
          ? "role-step-section role-step-complete"
          : "role-step-section"
      }
    >
      <div className="role-step-heading">
        <span className="role-step-icon" aria-hidden="true">
          {icon}
        </span>

        <div className="role-step-copy">
          <p className="role-step-kicker">
            Step {stepNumber}
            <span>
              <span aria-hidden="true">{isComplete ? "✅" : "○"}</span>
              {isComplete ? "Complete" : "To do"}
            </span>
          </p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="role-step-body">{children}</div>
    </section>
  );
}

function SafetyCheckbox({
  name,
  icon,
  title,
  text,
  defaultChecked = false,
}: {
  name: string;
  icon: string;
  title: string;
  text: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="safeguarding-check-card">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
      <span className="safeguarding-check-icon" aria-hidden="true">
        {icon}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </label>
  );
}

export default async function EditOpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const opportunityId = resolvedParams.id;
  const errorMessage = resolvedSearchParams.error
    ? decodeURIComponent(resolvedSearchParams.error)
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
    .select("email,user_type")
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
      "organisation_name,contact_email,support_offered,profile_completed,organisation_type,safeguarding_region,works_with_children_or_pupils",
    )
    .eq("user_id", user.id)
    .maybeSingle<OrganisationProfile>();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id,title,summary,location_type,location,location_town_city,location_area,location_venue,location_postcode,travel_notes,accessibility_notes,hide_exact_location,time_commitment,interests,skills,support_offered,contact_name,contact_email,safety_notes,status,minimum_age_stage,suitable_for_pupils,parent_carer_consent_required,school_approval_required,safeguarding_check_region,safeguarding_review_required,supervision_required,no_lone_working,no_home_visits,no_money_handling,no_personal_care,no_private_messaging,risk_assessment_completed,named_safeguarding_contact,legal_safeguarding_notes,role_frequency_pattern",
    )
    .eq("id", opportunityId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<Opportunity>();

  if (!opportunity) {
    redirect("/organisation/opportunities");
  }

  const profileCompleted = organisationProfile?.profile_completed === true;
  const readinessItems = getReadinessItems(opportunity);
  const readinessSummary = getReadinessSummary(readinessItems);

  const organisationTypeLabel = getOrganisationTypeLabel(
    organisationProfile?.organisation_type,
  );
  const safeguardingRegionLabel = getSafeguardingRegionLabel(
    organisationProfile?.safeguarding_region,
  );

  const step1Complete = Boolean(hasText(opportunity.title) && hasText(opportunity.summary));
  const step2Complete = Boolean(
    opportunity.location_type === "remote" ||
      hasText(opportunity.location_town_city) ||
      hasText(opportunity.location_area) ||
      hasText(opportunity.location) ||
      hasText(opportunity.location_venue),
  );
  const step3Complete = hasText(opportunity.time_commitment);
  const step4Complete = hasAny(opportunity.interests) && hasAny(opportunity.skills);
  const step5Complete = hasAny(opportunity.support_offered);
  const step6Complete = hasText(opportunity.contact_email);
  const step7Complete = Boolean(
    hasText(opportunity.safety_notes) ||
      hasText(opportunity.travel_notes) ||
      hasText(opportunity.accessibility_notes) ||
      opportunity.hide_exact_location === true,
  );
  const step8Complete = hasLegalSafeguardingReadiness(opportunity);
  const step9Complete = hasText(opportunity.status);

  const guideSteps: GuideStep[] = [
    {
      icon: "💬",
      title: "Review title and summary",
      text: "Check the role still explains what the volunteer will do.",
      isComplete: step1Complete,
    },
    {
      icon: "📍",
      title: "Review location and travel",
      text: "Check location, travel, access and privacy details are still helpful.",
      isComplete: step2Complete,
    },
    {
      icon: "🕒",
      title: "Review time commitment",
      text: "Make sure the timing is realistic and clear.",
      isComplete: step3Complete,
    },
    {
      icon: "⭐",
      title: "Review interests and skills",
      text: "These help matching and show what volunteers can build.",
      isComplete: step4Complete,
    },
    {
      icon: "💛",
      title: "Review support offered",
      text: "Check volunteers can see what support is available.",
      isComplete: step5Complete,
    },
    {
      icon: "👤",
      title: "Review contact person",
      text: "Use an inbox or contact person your organisation checks regularly.",
      isComplete: step6Complete,
    },
    {
      icon: "🛡️",
      title: "Review safety notes",
      text: "Explain welcome, supervision, first visit support or location privacy.",
      isComplete: step7Complete,
    },
    {
      icon: "⚖️",
      title: "Legal and safeguarding",
      text: "Review pupil suitability, supervision, consent and safeguarding checks.",
      isComplete: step8Complete,
    },
    {
      icon: "✅",
      title: "Save or publish",
      text: "Keep as draft, publish when ready, or close the role.",
      isComplete: step9Complete,
    },
  ];

  const completedSteps = guideSteps.filter((step) => step.isComplete).length;
  const completionPercent = Math.round((completedSteps / guideSteps.length) * 100);

  const listenText =
    `This is the edit opportunity page. The role is split into nine sections. Step 1 is title and summary. Step 2 is location and travel. Step 3 is time commitment. Step 4 is interests and skills. Step 5 is support offered. Step 6 is contact person. Step 7 is safety notes. Step 8 is legal and safeguarding. Step 9 is save or publish. Completed saved sections are green and show a tick. The role display readiness checklist shows whether the saved role has clear language, useful location details, support, skills, safety, privacy and safeguarding information. The organisation type is currently ${organisationTypeLabel}. The safeguarding region is currently ${safeguardingRegionLabel}. Scotland uses PVG wording. England and Wales use DBS wording. Northern Ireland uses AccessNI wording. This phase records role-level legal and safeguarding readiness only. It does not change what pupils or volunteers can see yet. Use Skills reviews to add positive skills feedback for volunteers who registered interest in this role. Save changes returns you to the opportunities list.`;

  return (
    <main className="onboarding-shell opportunity-edit-page">
      <section className="onboarding-panel">
        <div className="onboarding-top-row">
          <div>
            <p className="brand-eyebrow">Opportunity editor</p>
          </div>

          <div className="dashboard-topbar-actions opportunity-editor-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href={`/organisation/opportunities/${opportunity.id}/reviews`}
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">⭐</span>
                <span>Skills reviews</span>
              </span>
            </Link>

            <Link
              href="/organisation/opportunities"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Opportunities</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="onboarding-hero-grid">
          <div className="onboarding-hero-main">
            <div className="onboarding-title-lockup">
              <span className="onboarding-title-icon" aria-hidden="true">
                📝
              </span>

              <div>
                <h1 className="onboarding-title">Edit volunteering role</h1>
                <p className="onboarding-lead">
                  Review each step before volunteers see it. Keep the language
                  clear, supportive, practical and safe.
                </p>

                <div className="opportunity-editor-hero-actions">
                  <Link
                    href={`/organisation/opportunities/${opportunity.id}/reviews`}
                    className="primary-button"
                  >
                    <span className="button-balanced-inner">
                      <span aria-hidden="true">⭐</span>
                      <span>Skills reviews</span>
                    </span>
                  </Link>

                  <Link
                    href="/organisation/opportunities"
                    className="secondary-button"
                  >
                    <span className="button-balanced-inner">
                      <span aria-hidden="true">📣</span>
                      <span>All roles</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card role-progress-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {readinessSummary.icon}
              </span>
              <div>
                <h2>Current status</h2>
                <p>
                  {opportunity.status === "published"
                    ? "Published"
                    : opportunity.status === "closed"
                      ? "Closed"
                      : "Draft"}
                </p>
              </div>
            </div>

            <div className="role-progress-summary">
              <div className="role-progress-label">
                <span>Saved setup</span>
                <strong>{completedSteps}/9 steps</strong>
              </div>
              <div className="role-progress-meter" aria-hidden="true">
                <span style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <section
          className="role-form-guide"
          aria-labelledby="role-form-guide-title"
        >
          <div className="role-form-guide-heading">
            <span aria-hidden="true">🧭</span>

            <div>
              <p className="brand-eyebrow">Step-by-step guide</p>
              <h2 id="role-form-guide-title">How to review this role</h2>
              <p>
                Completed saved steps are green and show a tick. Edit any
                section that needs clearer wording, more support detail, safer
                location information, or safeguarding review.
              </p>
            </div>
          </div>

          <div className="role-form-guide-grid">
            {guideSteps.map((step, index) => (
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
                    <span>{step.isComplete ? "Complete" : "To do"}</span>
                  </p>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="role-readiness-panel"
          aria-labelledby="role-readiness-title"
        >
          <div className="role-readiness-heading">
            <span className="role-readiness-icon" aria-hidden="true">
              {readinessSummary.icon}
            </span>

            <div>
              <p className="brand-eyebrow">Role display readiness</p>
              <h2 id="role-readiness-title">{readinessSummary.title}</h2>
              <p>{readinessSummary.text}</p>
              <p className="role-readiness-count">
                Ready: <strong>{readinessSummary.readyCount}</strong> · Needs
                attention: <strong>{readinessSummary.attentionCount}</strong>
              </p>
            </div>
          </div>

          <div className="role-readiness-grid">
            {readinessItems.map((item) => (
              <article
                key={item.title}
                className={`role-readiness-card role-readiness-${item.status}`}
              >
                <span className="role-readiness-card-icon" aria-hidden="true">
                  {item.icon}
                </span>

                <div>
                  <p className="role-readiness-pill">{item.label}</p>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="role-safeguarding-summary"
          aria-labelledby="role-safeguarding-summary-title"
        >
          <div className="role-safeguarding-summary-icon" aria-hidden="true">
            ⚖️
          </div>

          <div>
            <p className="brand-eyebrow">School safety layer phase 1B</p>
            <h2 id="role-safeguarding-summary-title">
              Saved legal and safeguarding readiness
            </h2>
            <p>
              This phase records role-level readiness only. It does not yet
              change public visibility or pupil filtering.
            </p>

            <div className="role-safeguarding-summary-grid">
              <span>
                <strong>Organisation type:</strong> {organisationTypeLabel}
              </span>
              <span>
                <strong>Organisation region:</strong> {safeguardingRegionLabel}
              </span>
              <span>
                <strong>Minimum age/stage:</strong>{" "}
                {getMinimumAgeStageLabel(opportunity.minimum_age_stage)}
              </span>
              <span>
                <strong>Check wording:</strong>{" "}
                {getSafeguardingCheckRegionLabel(
                  opportunity.safeguarding_check_region,
                )}
              </span>
              <span>
                <strong>Frequency:</strong>{" "}
                {getFrequencyPatternLabel(opportunity.role_frequency_pattern)}
              </span>
              <span>
                <strong>Pupil suitable:</strong>{" "}
                {opportunity.suitable_for_pupils ? "Marked" : "Not marked"}
              </span>
            </div>
          </div>
        </section>

        {!profileCompleted ? (
          <div className="alert alert-error">
            Complete your organisation profile before publishing. You can still
            save this opportunity as a draft.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={updateOpportunity} className="form-stack">
          <input type="hidden" name="opportunity_id" value={opportunity.id} />

          <StepSection
            stepNumber={1}
            icon="💬"
            title="Role title and summary"
            description="Check the title and short description still make sense to a new volunteer."
            isComplete={step1Complete}
          >
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  📣
                </span>
                <span>Opportunity title</span>
              </span>
              <input
                name="title"
                type="text"
                required
                defaultValue={opportunity.title}
                placeholder="Example: Community cafe welcome volunteer"
              />
            </label>

            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  💬
                </span>
                <span>Short plain-language description</span>
              </span>
              <textarea
                name="summary"
                rows={5}
                required
                defaultValue={opportunity.summary}
                placeholder="Example: Help welcome visitors, offer tea and coffee, and keep the cafe area calm and friendly."
              />
            </label>
          </StepSection>

          <StepSection
            stepNumber={2}
            icon="📍"
            title="Location and travel"
            description="Check location, travel, access and privacy details are safe and useful."
            isComplete={step2Complete}
          >
            <section
              className="location-details-panel"
              aria-labelledby="location-details-title"
            >
              <div className="location-details-heading">
                <span className="location-details-icon" aria-hidden="true">
                  📍
                </span>
                <div>
                  <p className="brand-eyebrow">Location details</p>
                  <h2 id="location-details-title">
                    Help volunteers decide if the role is realistic
                  </h2>
                  <p>
                    Add enough location information to help people plan safely.
                    You can hide the exact venue or postcode from the public
                    page until you have contacted or accepted a volunteer.
                  </p>
                </div>
              </div>

              <div className="dashboard-grid">
                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      📍
                    </span>
                    <span>Location type</span>
                  </span>
                  <select
                    name="location_type"
                    defaultValue={opportunity.location_type || "in_person"}
                  >
                    <option value="in_person">In-person</option>
                    <option value="remote">Remote / online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      🏙️
                    </span>
                    <span>Town or city</span>
                  </span>
                  <input
                    name="location_town_city"
                    type="text"
                    defaultValue={opportunity.location_town_city || ""}
                    placeholder="Example: Aberdeen"
                  />
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      🗺️
                    </span>
                    <span>Area or neighbourhood optional</span>
                  </span>
                  <input
                    name="location_area"
                    type="text"
                    defaultValue={opportunity.location_area || ""}
                    placeholder="Example: City centre, Torry, Rosemount"
                  />
                </label>
              </div>

              <div className="dashboard-grid">
                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      🏢
                    </span>
                    <span>Venue or meeting place optional</span>
                  </span>
                  <input
                    name="location_venue"
                    type="text"
                    defaultValue={opportunity.location_venue || ""}
                    placeholder="Example: Community hub reception"
                  />
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      📮
                    </span>
                    <span>Postcode optional</span>
                  </span>
                  <input
                    name="location_postcode"
                    type="text"
                    defaultValue={opportunity.location_postcode || ""}
                    placeholder="Example: AB10"
                  />
                </label>

                <label className="field-label legacy-location-field">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      🗺️
                    </span>
                    <span>Public location summary fallback</span>
                  </span>
                  <input
                    name="location"
                    type="text"
                    defaultValue={opportunity.location || ""}
                    placeholder="Example: Aberdeen city centre"
                  />
                </label>
              </div>

              <label className="field-label privacy-check-row">
                <input
                  name="hide_exact_location"
                  type="checkbox"
                  defaultChecked={opportunity.hide_exact_location === true}
                />
                <span>
                  Hide exact venue and postcode from the public page until the
                  volunteer has been contacted or accepted.
                </span>
              </label>

              <div className="dashboard-grid">
                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      🚌
                    </span>
                    <span>Travel notes optional</span>
                  </span>
                  <textarea
                    name="travel_notes"
                    rows={4}
                    defaultValue={opportunity.travel_notes || ""}
                    placeholder="Example: Close to bus routes. Parking nearby. Volunteers can ask for help planning the first visit."
                  />
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      ♿
                    </span>
                    <span>Accessibility or building notes optional</span>
                  </span>
                  <textarea
                    name="accessibility_notes"
                    rows={4}
                    defaultValue={opportunity.accessibility_notes || ""}
                    placeholder="Example: Step-free entrance, quiet waiting area, accessible toilet, lift access, or any barriers volunteers should know about."
                  />
                </label>
              </div>
            </section>
          </StepSection>

          <StepSection
            stepNumber={3}
            icon="🕒"
            title="Time commitment"
            description="Check the time commitment is clear and realistic."
            isComplete={step3Complete}
          >
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  🕒
                </span>
                <span>Time commitment</span>
              </span>
              <select
                name="time_commitment"
                defaultValue={opportunity.time_commitment || ""}
              >
                <option value="">Choose one</option>
                <option value="One-off">One-off</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Flexible">Flexible</option>
                <option value="Short shifts to start">
                  Short shifts to start
                </option>
              </select>
            </label>
          </StepSection>

          <StepSection
            stepNumber={4}
            icon="⭐"
            title="Interests and skills"
            description="Check the matching choices still reflect this role."
            isComplete={step4Complete}
          >
            <fieldset className="choice-group">
              <legend>
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    💚
                  </span>
                  <span>Interests this role may suit</span>
                </span>
              </legend>
              <ChoiceGrid
                name="interests"
                options={interestOptions}
                savedValues={opportunity.interests}
              />
            </fieldset>

            <fieldset className="choice-group">
              <legend>
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    ⭐
                  </span>
                  <span>Helpful skills or skills volunteers can build</span>
                </span>
              </legend>
              <ChoiceGrid
                name="skills"
                options={skillOptions}
                savedValues={opportunity.skills}
              />
            </fieldset>
          </StepSection>

          <StepSection
            stepNumber={5}
            icon="💛"
            title="Support offered"
            description="Check volunteers can see what support or reassurance is available."
            isComplete={step5Complete}
          >
            <fieldset className="choice-group">
              <legend>
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    💛
                  </span>
                  <span>Support available for this role</span>
                </span>
              </legend>
              <ChoiceGrid
                name="support_offered"
                options={supportOptions}
                savedValues={opportunity.support_offered}
              />
            </fieldset>
          </StepSection>

          <StepSection
            stepNumber={6}
            icon="👤"
            title="Contact person"
            description="Check the contact name and email are still correct."
            isComplete={step6Complete}
          >
            <div className="dashboard-grid">
              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    👤
                  </span>
                  <span>Contact name optional</span>
                </span>
                <input
                  name="contact_name"
                  type="text"
                  defaultValue={
                    opportunity.contact_name ||
                    organisationProfile?.organisation_name ||
                    ""
                  }
                  placeholder="Example: Volunteer coordinator"
                />
              </label>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    ✉️
                  </span>
                  <span>Contact email</span>
                </span>
                <input
                  name="contact_email"
                  type="email"
                  required
                  defaultValue={
                    opportunity.contact_email ||
                    organisationProfile?.contact_email ||
                    profile?.email ||
                    user.email ||
                    ""
                  }
                  placeholder="volunteering@example.org"
                />
              </label>
            </div>
          </StepSection>

          <StepSection
            stepNumber={7}
            icon="🛡️"
            title="Safety and first visit notes"
            description="Check supervision, welcome, access or first-visit support details."
            isComplete={step7Complete}
          >
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  🛡️
                </span>
                <span>Safety or supervision notes optional</span>
              </span>
              <textarea
                name="safety_notes"
                rows={5}
                defaultValue={opportunity.safety_notes || ""}
                placeholder="Optional. Example: Volunteers will be welcomed by a named contact, shown the space, and told who to speak to if they need help."
              />
            </label>
          </StepSection>

          <StepSection
            stepNumber={8}
            icon="⚖️"
            title="Legal and safeguarding readiness"
            description="Review pupil suitability, consent, supervision and safeguarding checks before publishing."
            isComplete={step8Complete}
          >
            <section
              className="role-legal-panel"
              aria-labelledby="role-legal-title"
            >
              <div className="role-legal-heading">
                <span className="role-legal-icon" aria-hidden="true">
                  ⚖️
                </span>

                <div>
                  <p className="brand-eyebrow">Role-level readiness</p>
                  <h2 id="role-legal-title">
                    Legal and safeguarding questions
                  </h2>
                  <p>
                    These fields help your organisation review pupil suitability,
                    supervision, consent and safeguarding checks. They are saved
                    for readiness only in this phase.
                  </p>
                </div>
              </div>

              <div className="dashboard-grid">
                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      👥
                    </span>
                    <span>Minimum age / stage</span>
                  </span>
                  <select
                    name="minimum_age_stage"
                    defaultValue={opportunity.minimum_age_stage || "not_set"}
                  >
                    <option value="not_set">Not set yet</option>
                    <option value="adults_only">Adults only</option>
                    <option value="sixteen_plus">16+</option>
                    <option value="fourteen_plus">14+</option>
                    <option value="school_pupils_with_approval">
                      School pupils with school approval
                    </option>
                    <option value="school_pupils_with_parent_carer_consent">
                      School pupils with parent/carer consent
                    </option>
                  </select>
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      🛡️
                    </span>
                    <span>Safeguarding check wording</span>
                  </span>
                  <select
                    name="safeguarding_check_region"
                    defaultValue={
                      opportunity.safeguarding_check_region ||
                      "organisation_default"
                    }
                  >
                    <option value="organisation_default">
                      Use organisation default
                    </option>
                    <option value="scotland_pvg">Scotland - PVG</option>
                    <option value="england_wales_dbs">
                      England / Wales - DBS
                    </option>
                    <option value="northern_ireland_accessni">
                      Northern Ireland - AccessNI
                    </option>
                    <option value="not_expected">Not expected for this role</option>
                    <option value="not_sure">Not sure - needs review</option>
                  </select>
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      🔁
                    </span>
                    <span>Frequency pattern</span>
                  </span>
                  <select
                    name="role_frequency_pattern"
                    defaultValue={opportunity.role_frequency_pattern || "not_set"}
                  >
                    <option value="not_set">Not set yet</option>
                    <option value="one_off">One-off</option>
                    <option value="occasional">Occasional</option>
                    <option value="weekly_or_regular">Weekly or regular</option>
                    <option value="more_than_three_days_in_thirty">
                      More than 3 days in 30 days
                    </option>
                    <option value="overnight">
                      Overnight or late-night activity
                    </option>
                    <option value="not_sure">Not sure - needs review</option>
                  </select>
                </label>
              </div>

              <div className="safeguarding-warning-card">
                <span aria-hidden="true">⚠️</span>
                <div>
                  <strong>This is not legal advice.</strong>
                  <p>
                    Do not rely on a simple number of hours. Safeguarding checks
                    depend on the role activity, supervision, setting, frequency
                    and region. Roles involving children, pupils, care,
                    supervision, teaching, coaching, mentoring, transport or
                    overnight activity should be reviewed before publishing.
                  </p>
                </div>
              </div>

              <div className="safeguarding-check-grid">
                <SafetyCheckbox
                  name="suitable_for_pupils"
                  icon="🏫"
                  title="Potentially suitable for pupils"
                  text="Mark only if this role could later be shown in a school-approved pupil pathway."
                  defaultChecked={opportunity.suitable_for_pupils === true}
                />

                <SafetyCheckbox
                  name="parent_carer_consent_required"
                  icon="👪"
                  title="Parent/carer consent required"
                  text="Useful where pupils or younger volunteers may be involved."
                  defaultChecked={
                    opportunity.parent_carer_consent_required === true
                  }
                />

                <SafetyCheckbox
                  name="school_approval_required"
                  icon="✅"
                  title="School approval required"
                  text="Role should be approved by the school before school-linked pupils see it later."
                  defaultChecked={opportunity.school_approval_required === true}
                />

                <SafetyCheckbox
                  name="safeguarding_review_required"
                  icon="⚖️"
                  title="Safeguarding review required"
                  text="Use when the role needs a safeguarding lead or coordinator to review it."
                  defaultChecked={
                    opportunity.safeguarding_review_required === true
                  }
                />

                <SafetyCheckbox
                  name="supervision_required"
                  icon="👀"
                  title="Supervision required"
                  text="A named adult or approved staff member should supervise this role."
                  defaultChecked={opportunity.supervision_required === true}
                />

                <SafetyCheckbox
                  name="no_lone_working"
                  icon="🚫"
                  title="No lone working"
                  text="Volunteer should not be left alone with a child, pupil or vulnerable person."
                  defaultChecked={opportunity.no_lone_working === true}
                />

                <SafetyCheckbox
                  name="no_home_visits"
                  icon="🏠"
                  title="No home visits"
                  text="Role does not involve visiting someone's home."
                  defaultChecked={opportunity.no_home_visits === true}
                />

                <SafetyCheckbox
                  name="no_money_handling"
                  icon="💷"
                  title="No money handling"
                  text="Role does not involve handling money, payments or financial details."
                  defaultChecked={opportunity.no_money_handling === true}
                />

                <SafetyCheckbox
                  name="no_personal_care"
                  icon="🤲"
                  title="No personal care"
                  text="Role does not involve personal care tasks."
                  defaultChecked={opportunity.no_personal_care === true}
                />

                <SafetyCheckbox
                  name="no_private_messaging"
                  icon="📵"
                  title="No private messaging outside approved route"
                  text="Communication should stay through approved organisation contact routes."
                  defaultChecked={opportunity.no_private_messaging === true}
                />

                <SafetyCheckbox
                  name="risk_assessment_completed"
                  icon="📋"
                  title="Risk assessment completed"
                  text="Mark when your organisation has completed or checked the risk assessment."
                  defaultChecked={opportunity.risk_assessment_completed === true}
                />
              </div>

              <div className="dashboard-grid">
                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      👤
                    </span>
                    <span>Named safeguarding contact optional</span>
                  </span>
                  <input
                    name="named_safeguarding_contact"
                    type="text"
                    defaultValue={opportunity.named_safeguarding_contact || ""}
                    placeholder="Example: Safeguarding lead, volunteer coordinator, school contact"
                  />
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      📝
                    </span>
                    <span>Legal or safeguarding notes optional</span>
                  </span>
                  <textarea
                    name="legal_safeguarding_notes"
                    rows={4}
                    defaultValue={opportunity.legal_safeguarding_notes || ""}
                    placeholder="Optional. Example: School approval required before pupils can access this role. PVG/DBS/AccessNI requirements to be checked before activity starts."
                  />
                </label>
              </div>
            </section>
          </StepSection>

          <StepSection
            stepNumber={9}
            icon="✅"
            title="Save or publish"
            description="Keep as draft, publish when ready, close the role, or save changes."
            isComplete={step9Complete}
          >
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  📝
                </span>
                <span>Status</span>
              </span>
              <select name="status" defaultValue={opportunity.status || "draft"}>
                <option value="draft">Save as draft</option>
                <option value="published">Publish opportunity</option>
                <option value="closed">Close opportunity</option>
              </select>
            </label>

            <button
              type="submit"
              className="primary-button onboarding-submit-button"
            >
              <span className="button-balanced-inner">
                <span aria-hidden="true">✅</span>
                <span>Save changes</span>
              </span>
            </button>
          </StepSection>
        </form>
      </section>

      <style>{`
        .opportunity-edit-page,
        .opportunity-edit-page * {
          box-sizing: border-box;
        }

        .opportunity-editor-actions {
          gap: 10px;
        }

        .opportunity-editor-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .opportunity-editor-hero-actions .primary-button,
        .opportunity-editor-hero-actions .secondary-button {
          min-width: 190px;
        }

        .role-progress-card {
          display: grid;
          gap: 16px;
        }

        .role-progress-summary {
          display: grid;
          gap: 8px;
        }

        .role-progress-label {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          color: #60706a;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .role-progress-label strong {
          color: #315f48;
        }

        .role-progress-meter {
          width: 100%;
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
        }

        .role-progress-meter span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8fb29e, #4f8d68);
        }

        .role-form-guide,
        .role-safeguarding-summary {
          display: grid;
          gap: 18px;
          margin: 22px 0;
          padding: 20px;
          border-radius: 28px;
          box-shadow: 0 18px 42px rgba(33, 56, 48, 0.07);
        }

        .role-form-guide {
          border: 1px solid rgba(108, 92, 160, 0.16);
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.92), rgba(255, 255, 255, 0.9));
        }

        .role-safeguarding-summary {
          grid-template-columns: auto 1fr;
          border: 1px solid rgba(108, 92, 160, 0.18);
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.32), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.94), rgba(255, 255, 255, 0.9));
        }

        .role-safeguarding-summary-icon {
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

        .role-safeguarding-summary h2 {
          margin: 0 0 8px;
          color: #4f4b82;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .role-safeguarding-summary p {
          margin: 0;
          color: #5f6072;
          font-weight: 760;
          line-height: 1.5;
        }

        .role-safeguarding-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .role-safeguarding-summary-grid span {
          display: block;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.76);
          color: #5f6072;
          font-size: 0.88rem;
          font-weight: 800;
          line-height: 1.28;
          overflow-wrap: anywhere;
        }

        .role-safeguarding-summary-grid strong {
          color: #4f4b82;
        }

        .role-form-guide-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .role-form-guide-heading > span {
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

        .role-form-guide-heading h2 {
          margin: 0 0 8px;
          color: #4f4b82;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .role-form-guide-heading p {
          margin: 0;
          color: #5f6072;
          font-weight: 760;
          line-height: 1.5;
        }

        .role-form-guide-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .role-guide-step {
          position: relative;
          display: grid;
          gap: 10px;
          min-height: 190px;
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

        .role-readiness-panel,
        .location-details-panel,
        .role-legal-panel {
          display: grid;
          gap: 18px;
          padding: clamp(18px, 4vw, 24px);
          border-radius: 28px;
          box-shadow: 0 18px 48px rgba(33, 56, 48, 0.07);
        }

        .role-readiness-panel,
        .location-details-panel {
          border: 1px solid rgba(143, 178, 158, 0.22);
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.72), rgba(255, 255, 255, 0.86)),
            rgba(255, 255, 255, 0.82);
        }

        .role-legal-panel {
          border: 1px solid rgba(108, 92, 160, 0.18);
          background:
            linear-gradient(135deg, rgba(248, 245, 255, 0.88), rgba(255, 255, 255, 0.92)),
            rgba(255, 255, 255, 0.84);
        }

        .role-readiness-heading,
        .location-details-heading,
        .role-legal-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .role-readiness-icon,
        .location-details-icon,
        .role-legal-icon {
          display: inline-flex;
          width: 58px;
          height: 58px;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          font-size: 1.8rem;
        }

        .role-readiness-icon,
        .location-details-icon {
          background: rgba(143, 178, 158, 0.14);
        }

        .role-legal-icon {
          background: rgba(108, 92, 160, 0.12);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.14);
        }

        .role-readiness-heading h2,
        .location-details-heading h2,
        .role-legal-heading h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.25rem, 3vw, 1.65rem);
          letter-spacing: -0.035em;
          line-height: 1.12;
        }

        .role-legal-heading h2 {
          color: #4f4b82;
        }

        .role-readiness-heading p,
        .location-details-heading p,
        .role-legal-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.5;
        }

        .role-readiness-count {
          margin-top: 8px !important;
          color: #536f63 !important;
          font-size: 0.94rem;
          font-weight: 900 !important;
        }

        .role-readiness-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .role-readiness-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          min-height: 150px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
        }

        .role-readiness-ready {
          border-color: rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.88);
        }

        .role-readiness-attention {
          border-color: rgba(190, 118, 76, 0.28);
          background: rgba(255, 248, 241, 0.9);
        }

        .role-readiness-optional {
          border-color: rgba(108, 92, 160, 0.16);
          background: rgba(248, 248, 252, 0.9);
        }

        .role-readiness-card-icon {
          display: inline-flex;
          width: 44px;
          height: 44px;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.72);
          font-size: 1.35rem;
        }

        .role-readiness-pill {
          display: inline-flex;
          width: fit-content;
          margin: 0 0 8px !important;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.8);
          color: #536f63;
          font-size: 0.74rem;
          font-weight: 950 !important;
          line-height: 1.1;
        }

        .role-readiness-card h3 {
          margin: 0 0 5px;
          color: #315f48;
          font-size: 0.98rem;
          font-weight: 950;
          line-height: 1.18;
        }

        .role-readiness-card p {
          margin: 0;
          color: #60706a;
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.38;
        }

        .safeguarding-warning-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          padding: 16px;
          border: 1px solid rgba(191, 146, 72, 0.24);
          border-radius: 22px;
          background: rgba(255, 250, 241, 0.92);
        }

        .safeguarding-warning-card > span {
          display: inline-flex;
          width: 46px;
          height: 46px;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.78);
          font-size: 1.35rem;
        }

        .safeguarding-warning-card strong {
          display: block;
          margin-bottom: 5px;
          color: #8a6630;
          font-weight: 950;
          line-height: 1.2;
        }

        .safeguarding-warning-card p {
          margin: 0;
          color: #715529;
          font-weight: 760;
          line-height: 1.45;
        }

        .safeguarding-check-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .safeguarding-check-card {
          display: grid;
          grid-template-columns: auto auto 1fr;
          gap: 12px;
          align-items: start;
          padding: 15px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.76);
          color: #315f48;
          cursor: pointer;
        }

        .safeguarding-check-card input {
          width: 22px;
          height: 22px;
          margin-top: 2px;
          accent-color: #4f8d68;
        }

        .safeguarding-check-icon {
          font-size: 1.35rem;
          line-height: 1;
        }

        .safeguarding-check-card strong,
        .safeguarding-check-card small {
          display: block;
        }

        .safeguarding-check-card strong {
          margin-bottom: 5px;
          font-weight: 950;
          line-height: 1.2;
        }

        .safeguarding-check-card small {
          color: #60706a;
          font-weight: 740;
          line-height: 1.35;
        }

        .role-step-section {
          display: grid;
          gap: 18px;
          padding: 20px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.68);
          box-shadow: 0 14px 34px rgba(33, 56, 48, 0.05);
        }

        .role-step-complete {
          border-color: rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.22), transparent 34%),
            rgba(244, 255, 249, 0.86);
        }

        .role-step-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .role-step-icon {
          display: inline-flex;
          width: 58px;
          height: 58px;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: rgba(143, 178, 158, 0.14);
          box-shadow: inset 0 0 0 1px rgba(83, 111, 99, 0.08);
          font-size: 1.75rem;
        }

        .role-step-complete .role-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .role-step-copy {
          display: grid;
          gap: 7px;
          min-width: 0;
        }

        .role-step-kicker {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin: 0;
          color: #6c5ca0;
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .role-step-kicker span {
          display: inline-flex;
          min-height: 26px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 5px 9px;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.1);
          color: #6c5ca0;
          font-size: 0.72rem;
          letter-spacing: 0;
          text-transform: none;
        }

        .role-step-complete .role-step-kicker,
        .role-step-complete .role-step-kicker span {
          color: #145c38;
        }

        .role-step-complete .role-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .role-step-copy h2 {
          margin: 0;
          color: #315f48;
          font-size: clamp(1.22rem, 3vw, 1.55rem);
          font-weight: 950;
          letter-spacing: -0.03em;
          line-height: 1.12;
        }

        .role-step-copy p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.45;
        }

        .role-step-body {
          display: grid;
          gap: 16px;
        }

        .legacy-location-field {
          border-style: dashed;
        }

        .privacy-check-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          padding: 14px 16px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
          color: #4d5566;
          font-weight: 850;
          line-height: 1.45;
        }

        .privacy-check-row input {
          width: 22px;
          height: 22px;
          margin-top: 2px;
          accent-color: #536f63;
        }

        @media (max-width: 1180px) {
          .role-readiness-grid,
          .role-form-guide-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .role-safeguarding-summary-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .opportunity-editor-actions {
            width: 100%;
            justify-content: stretch;
          }

          .opportunity-editor-actions > *,
          .opportunity-editor-actions a,
          .opportunity-editor-actions button {
            width: 100%;
          }

          .opportunity-editor-hero-actions {
            display: grid;
            width: 100%;
          }

          .opportunity-editor-hero-actions .primary-button,
          .opportunity-editor-hero-actions .secondary-button {
            width: 100%;
            min-width: 0;
          }

          .role-form-guide-heading,
          .role-readiness-heading,
          .location-details-heading,
          .role-legal-heading,
          .role-step-heading,
          .role-safeguarding-summary {
            grid-template-columns: 1fr;
          }

          .role-form-guide,
          .role-readiness-panel,
          .location-details-panel,
          .role-legal-panel,
          .role-step-section,
          .role-safeguarding-summary {
            padding: 18px;
            border-radius: 24px;
          }

          .role-form-guide-heading > span,
          .role-readiness-icon,
          .location-details-icon,
          .role-legal-icon,
          .role-step-icon,
          .role-safeguarding-summary-icon {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .role-form-guide-grid,
          .role-readiness-grid,
          .safeguarding-check-grid {
            grid-template-columns: 1fr;
          }

          .role-guide-step,
          .role-readiness-card {
            min-height: 0;
          }

          .role-readiness-card,
          .privacy-check-row,
          .safeguarding-warning-card,
          .safeguarding-check-card {
            grid-template-columns: 1fr;
          }

          .safeguarding-check-icon {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
