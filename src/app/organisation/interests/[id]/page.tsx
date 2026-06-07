import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updateInterestStatus } from "./actions";
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
  volunteer_goals: string[] | null;
  volunteer_interests: string[] | null;
  volunteer_skills: string[] | null;
  volunteer_support_shared: boolean | null;
  volunteer_support_needs: string | null;
  volunteer_preferred_contact_method: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  summary: string;
  location_type: string | null;
  location: string | null;
  time_commitment: string | null;
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

type InterestStatus = "new" | "contacted" | "accepted" | "closed";

type GuideStep = {
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

function normaliseInterestStatus(
  status: string | null | undefined,
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

  if (normalisedStatus === "accepted") return "interest-detail-status-accepted";
  if (normalisedStatus === "contacted") return "interest-detail-status-contacted";
  if (normalisedStatus === "closed") return "interest-detail-status-closed";
  return "interest-detail-status-new";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

function formatContactMethod(value: string | null | undefined) {
  if (value === "sms") return "Text message";
  if (value === "phone") return "Phone call";
  if (value === "email") return "Email";
  if (value === "not_sure") return "Not sure yet";
  return "Not chosen yet";
}

function shouldShowPhone(value: string | null | undefined) {
  return value === "phone" || value === "sms";
}

function getSafePhoneHref(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, "");
}

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildContactEmail({
  volunteerName,
  roleTitle,
}: {
  volunteerName: string;
  roleTitle: string;
}) {
  return `Hi ${volunteerName},

Thank you for expressing interest in ${roleTitle}.

It was lovely to see your interest come through on SO Volunteering. We would like to find out a little more and talk about whether this role feels like a good fit for you.

The next step would be a short, friendly conversation about the role, what support might help, and any questions you have.

Please let us know if you are still interested and what would be a good time to contact you.

Best wishes`;
}

function buildContactText({
  volunteerName,
  roleTitle,
}: {
  volunteerName: string;
  roleTitle: string;
}) {
  return `Hi ${volunteerName}, thanks for your interest in ${roleTitle}. We’d love to chat about whether it feels like a good fit. Is there a good time to contact you? Thanks.`;
}

function buildCallNotes({
  volunteerName,
  roleTitle,
  preferredContactMethod,
}: {
  volunteerName: string;
  roleTitle: string;
  preferredContactMethod: string;
}) {
  return [
    `Ask for ${volunteerName}.`,
    `Introduce yourself and say you are calling about ${roleTitle}.`,
    "Thank them for expressing interest.",
    "Ask if now is still a good time to talk.",
    "Briefly explain the role in plain language.",
    "Ask what support would help them feel comfortable.",
    `Note that their preferred contact method is ${preferredContactMethod}.`,
    "Agree the next step before ending the call.",
  ];
}

function buildMailtoHref({
  email,
  subject,
  body,
}: {
  email: string | null;
  subject: string;
  body: string;
}) {
  if (!email || !email.trim()) {
    return "";
  }

  return `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

function buildSmsHref({
  phoneNumber,
  body,
}: {
  phoneNumber: string;
  body: string;
}) {
  const safePhone = getSafePhoneHref(phoneNumber);

  if (!safePhone) {
    return "";
  }

  return `sms:${encodeURIComponent(safePhone)}?&body=${encodeURIComponent(body)}`;
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
    interest.volunteer_support_shared && interest.volunteer_support_needs?.trim(),
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
      className: "review-strength-strong",
    };
  }

  if (score >= 4) {
    return {
      icon: "✨",
      label: "Good starting point",
      text: "There is some useful information. A short conversation will help.",
      className: "review-strength-good",
    };
  }

  return {
    icon: "🌱",
    label: "Needs conversation",
    text: "The volunteer has shared less detail, so keep the first contact simple and supportive.",
    className: "review-strength-light",
  };
}

function getNextStepText(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") {
    return "This volunteer is ready to move forward. After they complete a task, add a positive skills review so their Pathway CV can grow.";
  }

  if (normalisedStatus === "contacted") {
    return "A conversation has started. Agree the next step and update this status when ready.";
  }

  if (normalisedStatus === "closed") {
    return "This interest is closed. No further action is needed unless the situation changes.";
  }

  return "Open the contact helper, reach out kindly, then mark this interest as Contacted.";
}

function getMinimumAgeStageLabel(value: string | null | undefined) {
  if (value === "adults_only") return "Adults only";
  if (value === "sixteen_plus") return "16+";
  if (value === "fourteen_plus") return "14+";
  if (value === "school_pupils_with_approval") {
    return "School approval needed";
  }
  if (value === "school_pupils_with_parent_carer_consent") {
    return "Parent/carer consent needed";
  }

  return "";
}

function getSafeguardingCheckRegionLabel(value: string | null | undefined) {
  if (value === "scotland_pvg") return "Scotland - PVG";
  if (value === "england_wales_dbs") return "England / Wales - DBS";
  if (value === "northern_ireland_accessni") return "Northern Ireland - AccessNI";
  if (value === "not_expected") return "No check expected";
  if (value === "not_sure") return "Check needs review";

  return "";
}

function getFrequencyPatternLabel(value: string | null | undefined) {
  if (value === "one_off") return "One-off";
  if (value === "occasional") return "Occasional";
  if (value === "weekly_or_regular") return "Weekly or regular";
  if (value === "more_than_three_days_in_thirty") {
    return "More than 3 days in 30";
  }
  if (value === "overnight") return "Overnight / late-night";
  if (value === "not_sure") return "Frequency unsure";

  return "";
}

function hasRoleSafetyInformation(opportunity: OpportunityRow | null | undefined) {
  if (!opportunity) return false;

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

function needsSafeguardingAttention(opportunity: OpportunityRow | null | undefined) {
  if (!opportunity) return false;

  return Boolean(
    opportunity.suitable_for_pupils === true ||
      opportunity.parent_carer_consent_required === true ||
      opportunity.school_approval_required === true ||
      opportunity.safeguarding_review_required === true ||
      opportunity.role_frequency_pattern === "more_than_three_days_in_thirty" ||
      opportunity.role_frequency_pattern === "overnight" ||
      opportunity.role_frequency_pattern === "not_sure" ||
      opportunity.safeguarding_check_region === "not_sure",
  );
}

function hasSafeguardingSupportInfo(opportunity: OpportunityRow | null | undefined) {
  if (!opportunity) return false;

  return Boolean(
    opportunity.risk_assessment_completed === true ||
      opportunity.supervision_required === true ||
      opportunity.no_lone_working === true ||
      opportunity.no_home_visits === true ||
      opportunity.no_money_handling === true ||
      opportunity.no_personal_care === true ||
      opportunity.no_private_messaging === true ||
      hasText(opportunity.named_safeguarding_contact) ||
      hasText(opportunity.legal_safeguarding_notes),
  );
}

function getRoleSafetySummary(opportunity: OpportunityRow | null | undefined) {
  const hasSafety = hasRoleSafetyInformation(opportunity);
  const needsAttention = needsSafeguardingAttention(opportunity);
  const hasSupportInfo = hasSafeguardingSupportInfo(opportunity);

  if (!opportunity) {
    return {
      icon: "⚠️",
      label: "Role not loaded",
      text: "The role could not be loaded, so safety context cannot be reviewed here.",
      className: "role-safety-attention",
    };
  }

  if (!hasSafety) {
    return {
      icon: "⚖️",
      label: "Safety context not started",
      text: "This role does not yet have role-level legal or safeguarding readiness recorded.",
      className: "role-safety-attention",
    };
  }

  if (needsAttention && !hasSupportInfo) {
    return {
      icon: "⚠️",
      label: "Needs safeguarding review",
      text: "This role has pupil or safeguarding flags. Add review notes, supervision, risk assessment or a named safeguarding contact before relying on it.",
      className: "role-safety-attention",
    };
  }

  if (needsAttention) {
    return {
      icon: "🏫",
      label: "Safeguarding review flagged",
      text: "This role has pupil or safeguarding flags and supporting readiness information. Check this before contacting or accepting the volunteer.",
      className: "role-safety-warning",
    };
  }

  return {
    icon: "✅",
    label: "Safety context started",
    text: "Role-level safety and safeguarding readiness has been started for this opportunity.",
    className: "role-safety-ready",
  };
}

function getSafetyBadges(opportunity: OpportunityRow | null | undefined): SafetyBadge[] {
  if (!opportunity) return [];

  const badges: SafetyBadge[] = [];

  const minimumAgeLabel = getMinimumAgeStageLabel(opportunity.minimum_age_stage);

  if (minimumAgeLabel) {
    badges.push({
      icon: "👥",
      label: minimumAgeLabel,
      className: "role-safety-badge-info",
    });
  }

  const checkLabel = getSafeguardingCheckRegionLabel(
    opportunity.safeguarding_check_region,
  );

  if (checkLabel) {
    badges.push({
      icon: "🛡️",
      label: checkLabel,
      className:
        opportunity.safeguarding_check_region === "not_sure"
          ? "role-safety-badge-warning"
          : "role-safety-badge-info",
    });
  }

  const frequencyLabel = getFrequencyPatternLabel(
    opportunity.role_frequency_pattern,
  );

  if (frequencyLabel) {
    badges.push({
      icon: "🔁",
      label: frequencyLabel,
      className:
        opportunity.role_frequency_pattern === "not_sure" ||
        opportunity.role_frequency_pattern === "more_than_three_days_in_thirty" ||
        opportunity.role_frequency_pattern === "overnight"
          ? "role-safety-badge-warning"
          : "role-safety-badge-info",
    });
  }

  if (opportunity.suitable_for_pupils === true) {
    badges.push({
      icon: "🏫",
      label: "Pupil suitable",
      className: "role-safety-badge-warning",
    });
  }

  if (opportunity.school_approval_required === true) {
    badges.push({
      icon: "✅",
      label: "School approval",
      className: "role-safety-badge-warning",
    });
  }

  if (opportunity.parent_carer_consent_required === true) {
    badges.push({
      icon: "👪",
      label: "Parent/carer consent",
      className: "role-safety-badge-warning",
    });
  }

  if (opportunity.safeguarding_review_required === true) {
    badges.push({
      icon: "⚖️",
      label: "Review required",
      className: "role-safety-badge-warning",
    });
  }

  if (opportunity.supervision_required === true) {
    badges.push({
      icon: "👀",
      label: "Supervision",
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
      label: "Approved contact only",
      className: "role-safety-badge-ready",
    });
  }

  if (opportunity.risk_assessment_completed === true) {
    badges.push({
      icon: "📋",
      label: "Risk checked",
      className: "role-safety-badge-ready",
    });
  }

  if (hasText(opportunity.named_safeguarding_contact)) {
    badges.push({
      icon: "👤",
      label: "Named safeguarding contact",
      className: "role-safety-badge-ready",
    });
  }

  return badges;
}

function RoleSafetyPanel({
  opportunity,
}: {
  opportunity: OpportunityRow | null | undefined;
}) {
  const summary = getRoleSafetySummary(opportunity);
  const badges = getSafetyBadges(opportunity);

  return (
    <article className={`role-safety-panel ${summary.className}`}>
      <div className="role-safety-heading">
        <span className="role-safety-heading-icon" aria-hidden="true">
          {summary.icon}
        </span>

        <div>
          <p className="dashboard-card-label">Role safety context</p>
          <h2>{summary.label}</h2>
          <p>{summary.text}</p>
        </div>
      </div>

      {badges.length > 0 ? (
        <div className="role-safety-badge-grid">
          {badges.map((badge) => (
            <span
              key={`${badge.icon}-${badge.label}`}
              className={`role-safety-badge ${badge.className}`}
            >
              <span aria-hidden="true">{badge.icon}</span>
              {badge.label}
            </span>
          ))}
        </div>
      ) : (
        <p className="dashboard-muted-action">
          No role-level safety badges have been added yet.
        </p>
      )}

      {opportunity?.legal_safeguarding_notes ? (
        <div className="role-safety-note">
          <strong>Organisation note</strong>
          <p>{opportunity.legal_safeguarding_notes}</p>
        </div>
      ) : null}

      {opportunity?.named_safeguarding_contact ? (
        <p className="role-safety-contact">
          Named safeguarding contact:{" "}
          <strong>{opportunity.named_safeguarding_contact}</strong>
        </p>
      ) : null}
    </article>
  );
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
    <div className="interest-chip-list">
      {values.map((value) => (
        <span key={value} className="interest-chip">
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
  children: ReactNode;
}) {
  return (
    <article className="info-card dashboard-pathway-card interest-detail-card">
      <div
        className="dashboard-card-icon interest-detail-icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="dashboard-card-copy interest-detail-copy">
        <div>
          <p className="dashboard-card-label">{label}</p>
          <h2>{title}</h2>
        </div>

        <div className="interest-detail-body">{children}</div>
      </div>
    </article>
  );
}

function GuidedSection({
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
  children: ReactNode;
}) {
  return (
    <section
      className={
        isComplete
          ? "interest-step-section interest-step-complete"
          : "interest-step-section"
      }
    >
      <div className="interest-step-heading">
        <span className="interest-step-icon" aria-hidden="true">
          {icon}
        </span>

        <div className="interest-step-copy">
          <p className="interest-step-kicker">
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

      <div className="interest-step-body">{children}</div>
    </section>
  );
}

export default async function OrganisationInterestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const interestId = resolvedParams.id;

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

  if (userType !== "organisation") {
    redirect("/dashboard");
  }

  const { data: interest } = await supabase
    .from("opportunity_interests")
    .select(
      "id,opportunity_id,volunteer_user_id,volunteer_name,volunteer_email,volunteer_phone,volunteer_city,volunteer_goals,volunteer_interests,volunteer_skills,volunteer_support_shared,volunteer_support_needs,volunteer_preferred_contact_method,message,status,created_at",
    )
    .eq("id", interestId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<InterestRow>();

  if (!interest) {
    redirect("/organisation/interests");
  }

  const normalisedStatus = normaliseInterestStatus(interest.status);

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id,title,summary,location_type,location,time_commitment,status,minimum_age_stage,suitable_for_pupils,parent_carer_consent_required,school_approval_required,safeguarding_check_region,safeguarding_review_required,supervision_required,no_lone_working,no_home_visits,no_money_handling,no_personal_care,no_private_messaging,risk_assessment_completed,named_safeguarding_contact,legal_safeguarding_notes,role_frequency_pattern",
    )
    .eq("id", interest.opportunity_id)
    .eq("organisation_user_id", user.id)
    .maybeSingle<OpportunityRow>();

  const preferredContactMethod = formatContactMethod(
    interest.volunteer_preferred_contact_method,
  );

  const showPhoneNumber = shouldShowPhone(
    interest.volunteer_preferred_contact_method,
  );

  const phoneNumber = interest.volunteer_phone?.trim() || "";
  const safePhoneHref = getSafePhoneHref(phoneNumber);

  const volunteerName = interest.volunteer_name || "Volunteer";
  const roleTitle = opportunity?.title || "this volunteering role";

  const contactEmailSubject = `Your interest in ${roleTitle}`;
  const contactEmailBody = buildContactEmail({
    volunteerName,
    roleTitle,
  });

  const contactTextBody = buildContactText({
    volunteerName,
    roleTitle,
  });

  const callNotes = buildCallNotes({
    volunteerName,
    roleTitle,
    preferredContactMethod,
  });

  const contactMailtoHref = buildMailtoHref({
    email: interest.volunteer_email,
    subject: contactEmailSubject,
    body: contactEmailBody,
  });

  const contactSmsHref = phoneNumber
    ? buildSmsHref({
        phoneNumber,
        body: contactTextBody,
      })
    : "";

  const contactHelperMode =
    interest.volunteer_preferred_contact_method === "sms"
      ? "sms"
      : interest.volunteer_preferred_contact_method === "phone"
        ? "phone"
        : "email";

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

  const hasAcceptedVolunteer = normalisedStatus === "accepted";
  const hasSharedProfile =
    goalsCount > 0 || interestsCount > 0 || skillsCount > 0;
  const hasContactRoute =
    Boolean(contactMailtoHref) ||
    Boolean(contactSmsHref) ||
    (contactHelperMode === "phone" && Boolean(safePhoneHref));
  const hasSupportReviewed =
    interest.volunteer_support_shared === true
      ? hasText(interest.volunteer_support_needs)
      : true;
  const hasRoleSafety = hasRoleSafetyInformation(opportunity);

  const step1Complete = Boolean(opportunity);
  const step2Complete = hasRoleSafety;
  const step3Complete =
    hasText(interest.volunteer_name) ||
    hasText(interest.volunteer_email) ||
    hasSharedProfile ||
    hasText(interest.message);
  const step4Complete =
    hasText(interest.volunteer_preferred_contact_method) &&
    (contactHelperMode === "email" ||
      ((contactHelperMode === "sms" || contactHelperMode === "phone") &&
        hasText(phoneNumber)));
  const step5Complete = hasContactRoute;
  const step6Complete = normalisedStatus !== "new";
  const step7Complete = hasAcceptedVolunteer;

  const guideSteps: GuideStep[] = [
    {
      icon: "📣",
      title: "Review the role",
      text: "Check which opportunity this volunteer is interested in.",
      isComplete: step1Complete,
    },
    {
      icon: "⚖️",
      title: "Check role safety",
      text: "Review minimum age, consent, supervision and safeguarding context before contact.",
      isComplete: step2Complete,
    },
    {
      icon: "👤",
      title: "Read volunteer snapshot",
      text: "Review goals, interests, skills, statement and shared support.",
      isComplete: step3Complete,
    },
    {
      icon: "📞",
      title: "Check contact preference",
      text: "Use the volunteer’s preferred contact method where possible.",
      isComplete: step4Complete,
    },
    {
      icon: "🛡️",
      title: "Contact safely",
      text: "Use the helper and do not ask for money, bank details, passwords or financial information.",
      isComplete: step5Complete,
    },
    {
      icon: "📌",
      title: "Update status",
      text: "Mark as Contacted, Accepted or Closed when the next step is clear.",
      isComplete: step6Complete,
    },
    {
      icon: "⭐",
      title: "Add pathway evidence",
      text: "If accepted, add a positive skills review after meaningful activity.",
      isComplete: step7Complete,
    },
  ];

  const completedSteps = guideSteps.filter((step) => step.isComplete).length;
  const completionPercent = Math.round((completedSteps / guideSteps.length) * 100);

  const listenText =
    "You are on a volunteer interest detail page. Step 1 is reviewing the role. Step 2 is checking the role safety context, including age, pupil suitability, consent, supervision, PVG, DBS or AccessNI wording, no lone working, no home visits, no money handling, no personal care and approved contact routes. Step 3 is reading the volunteer snapshot. Step 4 is checking the preferred contact method. Step 5 is contacting safely. Step 6 is updating the status. Step 7 is adding positive pathway evidence if the volunteer is accepted. SO Volunteering and organisations using this platform should never ask volunteers for money, bank details, passwords or financial information.";

  return (
    <main className="dashboard-bg organisation-interest-page">
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
              href="/organisation/interests"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Interest inbox</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card organisation-interest-hero"
          aria-labelledby="interest-detail-title"
        >
          <div className="dashboard-welcome-copy organisation-interest-hero-copy">
            <p className="dashboard-kicker">Volunteer interest</p>

            <h1
              id="interest-detail-title"
              className="dashboard-title organisation-interest-title"
            >
              <span aria-hidden="true">📬</span>
              <span>{volunteerName}</span>
            </h1>

            <p className="dashboard-lead organisation-interest-lead">
              Review this interest, check role safety, prepare kind contact, and
              update the status when the next step is clear.
            </p>

            <div className="organisation-interest-hero-meta">
              <span
                className={`interest-detail-status-pill ${getStatusToneClass(
                  normalisedStatus,
                )}`}
              >
                <span aria-hidden="true">{getStatusIcon(normalisedStatus)}</span>
                <span>{formatStatus(normalisedStatus)}</span>
              </span>

              <span className="interest-detail-meta-pill">
                <span aria-hidden="true">📅</span>
                <span>Received {formatDate(interest.created_at)}</span>
              </span>

              <span className="interest-detail-meta-pill">
                <span aria-hidden="true">📞</span>
                <span>{preferredContactMethod}</span>
              </span>

              <span
                className={
                  hasRoleSafety
                    ? "interest-detail-meta-pill role-safety-meta-ready"
                    : "interest-detail-meta-pill role-safety-meta-warning"
                }
              >
                <span aria-hidden="true">⚖️</span>
                <span>
                  {hasRoleSafety ? "Role safety added" : "Role safety not started"}
                </span>
              </span>
            </div>

            <div className="dashboard-primary-actions organisation-interest-actions">
              <Link
                href="/organisation/interests"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📬</span>
                  <span>Back to inbox</span>
                </span>
              </Link>

              {opportunity ? (
                <Link
                  href={`/organisation/opportunities/${opportunity.id}`}
                  className="secondary-button dashboard-main-action"
                >
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">📣</span>
                    <span>Open role</span>
                  </span>
                </Link>
              ) : null}

              {opportunity && hasAcceptedVolunteer ? (
                <Link
                  href={`/organisation/opportunities/${opportunity.id}/reviews`}
                  className="secondary-button dashboard-main-action"
                >
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">⭐</span>
                    <span>Positive skills reviews</span>
                  </span>
                </Link>
              ) : null}
            </div>
          </div>

          <aside
            className="dashboard-progress-card organisation-interest-status-card"
            aria-label="Interest status"
          >
            <div className="dashboard-progress-header organisation-interest-status-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {hasAcceptedVolunteer ? "🌱" : reviewStrength.icon}
              </span>
              <div>
                <h2>
                  {hasAcceptedVolunteer
                    ? "Pathway ready"
                    : reviewStrength.label}
                </h2>
                <p>
                  {hasAcceptedVolunteer
                    ? "This volunteer can now build positive evidence through your role."
                    : reviewStrength.text}
                </p>
              </div>
            </div>

            <div
              className="interest-profile-summary-grid"
              aria-label="Shared profile summary"
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

            <div className="interest-progress-summary">
              <div className="interest-progress-label">
                <span>Interest progress</span>
                <strong>{completedSteps}/7 steps</strong>
              </div>
              <div className="interest-progress-meter" aria-hidden="true">
                <span style={{ width: `${completionPercent}%` }} />
              </div>
            </div>

            <p className="dashboard-progress-note organisation-interest-status-note">
              <strong>Next step:</strong> {getNextStepText(normalisedStatus)}
            </p>
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <section
          className="interest-guide-panel"
          aria-labelledby="interest-guide-title"
        >
          <div className="interest-guide-heading">
            <span aria-hidden="true">🧭</span>

            <div>
              <p className="dashboard-kicker">Step-by-step guide</p>
              <h2 id="interest-guide-title">How to handle this interest</h2>
              <p>
                Work through the steps in order. Completed steps are green and
                show a tick. Check role safety before moving a volunteer forward.
              </p>
            </div>
          </div>

          <div className="interest-guide-grid">
            {guideSteps.map((step, index) => (
              <article
                key={step.title}
                className={
                  step.isComplete
                    ? "interest-guide-step interest-guide-step-complete"
                    : "interest-guide-step"
                }
              >
                <span className="interest-guide-step-number">
                  {step.isComplete ? "✓" : index + 1}
                </span>

                <div className="interest-guide-step-icon" aria-hidden="true">
                  {step.icon}
                </div>

                <div className="interest-guide-step-copy">
                  <p className="interest-guide-step-kicker">
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
          className="organisation-contact-safety-card"
          aria-labelledby="organisation-contact-safety-title"
        >
          <div className="organisation-contact-safety-icon" aria-hidden="true">
            🛡️
          </div>

          <div>
            <p className="dashboard-kicker">Safe contact reminder</p>
            <h2 id="organisation-contact-safety-title">
              Keep first contact safe and supportive
            </h2>
            <p>
              SO Volunteering and organisations using this platform should never
              ask volunteers for money, bank details, passwords or financial
              information. For in-person volunteering, you can agree practical
              meeting details, but do not ask for a volunteer’s full home
              address through the app.
            </p>
          </div>
        </section>

        {hasAcceptedVolunteer ? (
          <section
            className="accepted-pathway-panel"
            aria-labelledby="accepted-pathway-title"
          >
            <div className="accepted-pathway-icon" aria-hidden="true">
              🌱
            </div>

            <div className="accepted-pathway-copy">
              <p className="dashboard-kicker">Volunteer pathway</p>
              <h2 id="accepted-pathway-title">
                Ready for positive pathway evidence
              </h2>
              <p>
                This volunteer has been accepted and is ready to move forward.
                After they complete a task or take part in the role, add a
                positive skills review. Shared reviews can support their
                Positive Pathway CV.
              </p>

              <div className="accepted-pathway-steps">
                <span>
                  <strong>1</strong>
                  Agree the first task
                </span>
                <span>
                  <strong>2</strong>
                  Support the volunteer
                </span>
                <span>
                  <strong>3</strong>
                  Add positive evidence
                </span>
              </div>

              <div className="accepted-pathway-actions">
                {opportunity ? (
                  <Link
                    href={`/organisation/opportunities/${opportunity.id}/reviews`}
                    className="primary-button"
                  >
                    <span className="dashboard-button-inner">
                      <span aria-hidden="true">⭐</span>
                      <span>Open positive skills reviews</span>
                    </span>
                  </Link>
                ) : null}

                {opportunity ? (
                  <Link
                    href={`/organisation/opportunities/${opportunity.id}`}
                    className="secondary-button"
                  >
                    <span className="dashboard-button-inner">
                      <span aria-hidden="true">📣</span>
                      <span>Open role</span>
                    </span>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <div className="interest-guided-flow">
          <GuidedSection
            stepNumber={1}
            icon="📣"
            title="Review the role"
            description="Check which opportunity this volunteer is interested in."
            isComplete={step1Complete}
          >
            <DetailCard icon="📣" label="Role" title="Opportunity">
              {opportunity ? (
                <>
                  <p>
                    Role: <strong>{opportunity.title}</strong>
                  </p>
                  <p>{opportunity.summary}</p>
                  <p className="dashboard-muted-action">
                    {formatLocationType(opportunity.location_type)}
                    {opportunity.location ? ` · ${opportunity.location}` : ""}
                    {opportunity.time_commitment
                      ? ` · ${opportunity.time_commitment}`
                      : ""}
                  </p>
                </>
              ) : (
                <p className="dashboard-muted-action">
                  This opportunity could not be loaded.
                </p>
              )}
            </DetailCard>
          </GuidedSection>

          <GuidedSection
            stepNumber={2}
            icon="⚖️"
            title="Check role safety"
            description="Review the role-level legal, safeguarding and contact-safety context before moving this volunteer forward."
            isComplete={step2Complete}
          >
            <RoleSafetyPanel opportunity={opportunity} />
          </GuidedSection>

          <GuidedSection
            stepNumber={3}
            icon="👤"
            title="Read volunteer snapshot"
            description="Review the volunteer’s contact details, statement, goals, interests, skills and shared support."
            isComplete={step3Complete}
          >
            <section
              className="dashboard-grid interest-detail-grid"
              aria-label="Volunteer snapshot"
            >
              <DetailCard icon="👤" label="Volunteer" title="Contact details">
                <p>
                  Name:{" "}
                  <strong>
                    {interest.volunteer_name || "Volunteer name not shared"}
                  </strong>
                </p>
                <p>
                  Email:{" "}
                  <strong>
                    {interest.volunteer_email || "Email not available"}
                  </strong>
                </p>
                <p>
                  Preferred contact: <strong>{preferredContactMethod}</strong>
                </p>
                {showPhoneNumber ? (
                  <p>
                    Phone/text number:{" "}
                    <strong>{phoneNumber || "Not supplied"}</strong>
                  </p>
                ) : null}
                <p>
                  Area:{" "}
                  <strong>{interest.volunteer_city || "Area not shared"}</strong>
                </p>
              </DetailCard>

              <DetailCard
                icon="💬"
                label="Statement"
                title="Supporting statement"
              >
                {interest.message ? (
                  <p>{interest.message}</p>
                ) : (
                  <p className="dashboard-muted-action">
                    No supporting statement was added.
                  </p>
                )}
              </DetailCard>

              <DetailCard icon="🌱" label="Goals" title="Volunteer goals">
                <ChipList
                  values={interest.volunteer_goals}
                  emptyText="No goals shared."
                />
              </DetailCard>

              <DetailCard
                icon="💚"
                label="Interests"
                title="Volunteer interests"
              >
                <ChipList
                  values={interest.volunteer_interests}
                  emptyText="No interests shared."
                />
              </DetailCard>

              <DetailCard icon="⭐" label="Skills" title="Volunteer skills">
                <ChipList
                  values={interest.volunteer_skills}
                  emptyText="No skills shared."
                />
              </DetailCard>

              <DetailCard icon="💛" label="Support" title="Shared support">
                {interest.volunteer_support_shared &&
                interest.volunteer_support_needs ? (
                  <p>{interest.volunteer_support_needs}</p>
                ) : (
                  <p className="dashboard-muted-action">
                    Support preferences were not shared with organisations.
                  </p>
                )}

                {!hasSupportReviewed ? (
                  <p className="dashboard-muted-action">
                    Support was marked as shared, but no support details are
                    currently available.
                  </p>
                ) : null}
              </DetailCard>
            </section>
          </GuidedSection>

          <GuidedSection
            stepNumber={4}
            icon="📞"
            title="Check contact preference"
            description="Use the volunteer’s preferred contact method where possible."
            isComplete={step4Complete}
          >
            <section
              className="dashboard-grid interest-detail-grid"
              aria-label="Contact preference"
            >
              <DetailCard
                icon={
                  contactHelperMode === "sms"
                    ? "💬"
                    : contactHelperMode === "phone"
                      ? "📞"
                      : "✉️"
                }
                label="Contact preference"
                title={preferredContactMethod}
              >
                <p>
                  Preferred method: <strong>{preferredContactMethod}</strong>
                </p>
                <p>
                  Email:{" "}
                  <strong>
                    {interest.volunteer_email || "Email not available"}
                  </strong>
                </p>
                {showPhoneNumber ? (
                  <p>
                    Phone/text number:{" "}
                    <strong>{phoneNumber || "Not supplied"}</strong>
                  </p>
                ) : (
                  <p className="dashboard-muted-action">
                    Phone/text number is only shown when the volunteer has chosen
                    text message or phone call.
                  </p>
                )}
              </DetailCard>

              <DetailCard icon="📌" label="Status guide" title="Where this sits">
                <div
                  className="status-guide-list"
                  aria-label="Interest status guide"
                >
                  <div
                    className={
                      normalisedStatus === "new"
                        ? "status-guide-item status-guide-current"
                        : "status-guide-item"
                    }
                  >
                    <span className="status-guide-badge">1</span>
                    <div>
                      <p>
                        <strong>New interest</strong>
                      </p>
                      <p>Waiting for first contact.</p>
                    </div>
                  </div>

                  <div
                    className={
                      normalisedStatus === "contacted"
                        ? "status-guide-item status-guide-current"
                        : "status-guide-item"
                    }
                  >
                    <span className="status-guide-badge">2</span>
                    <div>
                      <p>
                        <strong>Contacted</strong>
                      </p>
                      <p>Conversation started.</p>
                    </div>
                  </div>

                  <div
                    className={
                      normalisedStatus === "accepted"
                        ? "status-guide-item status-guide-current"
                        : "status-guide-item"
                    }
                  >
                    <span className="status-guide-badge">3</span>
                    <div>
                      <p>
                        <strong>Accepted</strong>
                      </p>
                      <p>Ready to move forward.</p>
                    </div>
                  </div>

                  <div
                    className={
                      normalisedStatus === "closed"
                        ? "status-guide-item status-guide-current"
                        : "status-guide-item"
                    }
                  >
                    <span className="status-guide-badge">4</span>
                    <div>
                      <p>
                        <strong>Closed</strong>
                      </p>
                      <p>No further action.</p>
                    </div>
                  </div>
                </div>
              </DetailCard>
            </section>
          </GuidedSection>

          <GuidedSection
            stepNumber={5}
            icon="🛡️"
            title="Contact safely"
            description="Use the contact helper and keep the first message kind, clear and safe."
            isComplete={step5Complete}
          >
            <DetailCard
              icon={
                contactHelperMode === "sms"
                  ? "💬"
                  : contactHelperMode === "phone"
                    ? "📞"
                    : "✉️"
              }
              label="Contact helper"
              title={
                contactHelperMode === "sms"
                  ? "Prepare text"
                  : contactHelperMode === "phone"
                    ? "Prepare call"
                    : "Prepare email"
              }
            >
              {contactHelperMode === "sms" ? (
                <>
                  <p>
                    The volunteer chose text message. Use a short, friendly first
                    message and keep the next step clear.
                  </p>

                  <p>
                    Phone/text number:{" "}
                    <strong>{phoneNumber || "Not supplied"}</strong>
                  </p>

                  <div className="contact-email-preview" aria-label="Suggested text">
                    <pre>{contactTextBody}</pre>
                  </div>

                  {contactSmsHref ? (
                    <a href={contactSmsHref} className="contact-email-button">
                      Open text app
                    </a>
                  ) : (
                    <p className="dashboard-muted-action">
                      No phone number is available, so a text link cannot be
                      prepared.
                    </p>
                  )}
                </>
              ) : null}

              {contactHelperMode === "phone" ? (
                <>
                  <p>
                    The volunteer chose phone call. Use these notes to keep the
                    call clear, kind and supportive.
                  </p>

                  <p>
                    Phone number: <strong>{phoneNumber || "Not supplied"}</strong>
                  </p>

                  <div className="call-notes-box" aria-label="Suggested call notes">
                    <ol>
                      {callNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ol>
                  </div>

                  {safePhoneHref ? (
                    <a
                      href={`tel:${safePhoneHref}`}
                      className="contact-email-button"
                    >
                      Open phone app
                    </a>
                  ) : (
                    <p className="dashboard-muted-action">
                      No phone number is available, so a phone link cannot be
                      prepared.
                    </p>
                  )}
                </>
              ) : null}

              {contactHelperMode === "email" ? (
                <>
                  <p>
                    The volunteer chose email or has not chosen a method yet. A
                    friendly first message is ready. Open the preview only if you
                    want to check or copy the full wording.
                  </p>

                  <p>
                    Suggested subject: <strong>{contactEmailSubject}</strong>
                  </p>

                  <details className="contact-email-details">
                    <summary>Preview suggested email</summary>
                    <div
                      className="contact-email-preview"
                      aria-label="Suggested email"
                    >
                      <pre>{contactEmailBody}</pre>
                    </div>
                  </details>

                  {contactMailtoHref ? (
                    <a href={contactMailtoHref} className="contact-email-button">
                      Open email app
                    </a>
                  ) : (
                    <p className="dashboard-muted-action">
                      No volunteer email is available, so an email link cannot be
                      prepared.
                    </p>
                  )}
                </>
              ) : null}
            </DetailCard>
          </GuidedSection>

          <GuidedSection
            stepNumber={6}
            icon="📌"
            title="Update status"
            description="Mark this interest as Contacted, Accepted or Closed when the next step is clear."
            isComplete={step6Complete}
          >
            <article className="info-card dashboard-pathway-card interest-detail-card">
              <div
                className="dashboard-card-icon interest-detail-icon"
                aria-hidden="true"
              >
                ✅
              </div>

              <div className="dashboard-card-copy interest-detail-copy">
                <div>
                  <p className="dashboard-card-label">Manage</p>
                  <h2>Update status</h2>
                </div>

                <div className="interest-detail-body">
                  <form action={updateInterestStatus} className="form-stack">
                    <input type="hidden" name="interest_id" value={interest.id} />

                    <label className="field-label">
                      <span className="field-label-row">
                        <span className="field-label-icon" aria-hidden="true">
                          📌
                        </span>
                        <span>Interest status</span>
                      </span>
                      <select name="status" defaultValue={normalisedStatus}>
                        <option value="new">New interest</option>
                        <option value="contacted">Contacted</option>
                        <option value="accepted">Accepted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>

                    <button type="submit" className="primary-button">
                      <span className="button-balanced-inner">
                        <span aria-hidden="true">✅</span>
                        <span>Save status</span>
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </article>
          </GuidedSection>

          <GuidedSection
            stepNumber={7}
            icon="⭐"
            title="Add positive pathway evidence"
            description="If the volunteer is accepted, add a positive skills review after meaningful activity."
            isComplete={step7Complete}
          >
            <DetailCard
              icon={hasAcceptedVolunteer ? "🌱" : "🧭"}
              label={hasAcceptedVolunteer ? "Pathway" : "Next steps"}
              title={
                hasAcceptedVolunteer
                  ? "Ready for positive pathway evidence"
                  : "What happens next?"
              }
            >
              <p>{getNextStepText(normalisedStatus)}</p>

              {hasAcceptedVolunteer ? (
                <>
                  <p>
                    Keep the first task manageable, agree what support will help,
                    and add a positive skills review once the volunteer has
                    completed a meaningful activity.
                  </p>

                  {hasSharedProfile ? (
                    <p className="dashboard-muted-action">
                      This volunteer has shared profile information that can help
                      you choose a supportive first task.
                    </p>
                  ) : (
                    <p className="dashboard-muted-action">
                      This volunteer has shared limited profile information, so
                      use the first conversation to agree what feels comfortable.
                    </p>
                  )}

                  {opportunity ? (
                    <Link
                      href={`/organisation/opportunities/${opportunity.id}/reviews`}
                      className="contact-email-button"
                    >
                      Open positive skills reviews
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <p>
                    Contact should stay kind, clear and supportive. Use the
                    volunteer’s preferred contact method where possible.
                  </p>

                  {opportunity ? (
                    <p>
                      If this volunteer is accepted and later completes a task,
                      use the role review page to add positive skills evidence.
                    </p>
                  ) : null}

                  {opportunity ? (
                    <Link
                      href={`/organisation/opportunities/${opportunity.id}/reviews`}
                      className="contact-email-button"
                    >
                      Open positive skills reviews
                    </Link>
                  ) : null}
                </>
              )}
            </DetailCard>
          </GuidedSection>
        </div>
      </section>

      <style>{`
        .organisation-interest-page,
        .organisation-interest-page * {
          box-sizing: border-box;
        }

        .organisation-interest-hero,
        .organisation-interest-status-card,
        .interest-detail-card,
        .accepted-pathway-panel,
        .interest-guide-panel,
        .organisation-contact-safety-card,
        .interest-step-section,
        .role-safety-panel {
          overflow: hidden;
        }

        .organisation-interest-hero-copy,
        .organisation-interest-status-card,
        .organisation-interest-status-card *,
        .interest-detail-card,
        .interest-detail-card *,
        .accepted-pathway-panel,
        .accepted-pathway-panel *,
        .interest-guide-panel,
        .interest-guide-panel *,
        .organisation-contact-safety-card,
        .organisation-contact-safety-card *,
        .interest-step-section,
        .interest-step-section *,
        .role-safety-panel,
        .role-safety-panel * {
          min-width: 0;
        }

        .organisation-interest-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-top: 18px;
        }

        .interest-detail-status-pill,
        .interest-detail-meta-pill {
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: fit-content;
          max-width: 100%;
          padding: 8px 12px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.84);
          color: #536f63;
          font-size: 0.88rem;
          font-weight: 950;
          line-height: 1.1;
        }

        .interest-detail-meta-pill {
          color: #5d6677;
          font-weight: 850;
        }

        .role-safety-meta-ready {
          border-color: rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.96);
          color: #536f63;
        }

        .role-safety-meta-warning {
          border-color: rgba(190, 118, 76, 0.28);
          background: rgba(255, 248, 241, 0.94);
          color: #8a6630;
        }

        .interest-detail-status-new {
          border-color: rgba(108, 92, 160, 0.18);
          background: rgba(248, 245, 255, 0.92);
          color: #6c5ca0;
        }

        .interest-detail-status-contacted {
          border-color: rgba(74, 112, 160, 0.22);
          background: rgba(243, 249, 255, 0.94);
          color: #4a70a0;
        }

        .interest-detail-status-accepted {
          border-color: rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.96);
          color: #536f63;
        }

        .interest-detail-status-closed {
          border-color: rgba(100, 100, 110, 0.18);
          background: rgba(248, 248, 252, 0.94);
          color: #5d6677;
        }

        .interest-profile-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin: 16px 0;
        }

        .interest-profile-summary-grid span {
          display: grid;
          gap: 3px;
          min-width: 0;
          padding: 11px 10px;
          border: 1px solid rgba(108, 92, 160, 0.1);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.64);
          color: #5d6677;
          font-size: 0.78rem;
          font-weight: 850;
          line-height: 1.12;
          text-align: center;
        }

        .interest-profile-summary-grid strong {
          display: block;
          color: #536f63;
          font-size: 1.35rem;
          font-weight: 950;
          line-height: 1;
        }

        .interest-progress-summary {
          display: grid;
          gap: 8px;
          margin: 12px 0;
        }

        .interest-progress-label {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          color: #60706a;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .interest-progress-label strong {
          color: #315f48;
        }

        .interest-progress-meter {
          width: 100%;
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
        }

        .interest-progress-meter span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8fb29e, #4f8d68);
        }

        .interest-guide-panel {
          display: grid;
          gap: 18px;
          margin: 22px 0;
          padding: 20px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.92), rgba(255, 255, 255, 0.9));
          box-shadow: 0 18px 42px rgba(33, 56, 48, 0.07);
        }

        .interest-guide-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .interest-guide-heading > span {
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

        .interest-guide-heading h2 {
          margin: 0 0 8px;
          color: #4f4b82;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .interest-guide-heading p {
          margin: 0;
          color: #5f6072;
          font-weight: 760;
          line-height: 1.5;
        }

        .interest-guide-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .interest-guide-step {
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

        .interest-guide-step-complete {
          border-color: rgba(34, 124, 78, 0.26);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.28), transparent 34%),
            rgba(244, 255, 249, 0.92);
          box-shadow: 0 14px 30px rgba(33, 96, 61, 0.08);
        }

        .interest-guide-step-number {
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

        .interest-guide-step-complete .interest-guide-step-number {
          background: rgba(34, 124, 78, 0.14);
          color: #145c38;
        }

        .interest-guide-step-icon {
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

        .interest-guide-step-complete .interest-guide-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .interest-guide-step-copy {
          display: grid;
          gap: 6px;
        }

        .interest-guide-step-kicker {
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

        .interest-guide-step-kicker span {
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

        .interest-guide-step-complete .interest-guide-step-kicker,
        .interest-guide-step-complete .interest-guide-step-kicker span {
          color: #145c38;
        }

        .interest-guide-step-complete .interest-guide-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .interest-guide-step-copy h3 {
          margin: 0;
          padding-right: 32px;
          color: #315f48;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.14;
        }

        .interest-guide-step-copy p {
          margin: 0;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 740;
          line-height: 1.42;
        }

        .organisation-contact-safety-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
          margin: 22px 0;
          padding: 20px;
          border: 1px solid rgba(34, 124, 78, 0.24);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.4), transparent 32%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.94), rgba(255, 255, 255, 0.9));
          box-shadow: 0 18px 42px rgba(33, 96, 61, 0.1);
        }

        .organisation-contact-safety-icon {
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

        .organisation-contact-safety-card h2 {
          margin: 0 0 8px;
          color: #145c38;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .organisation-contact-safety-card p {
          margin: 0;
          color: #275f45;
          font-weight: 780;
          line-height: 1.5;
        }

        .interest-guided-flow {
          display: grid;
          gap: 22px;
        }

        .interest-step-section {
          display: grid;
          gap: 18px;
          padding: 20px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.68);
          box-shadow: 0 14px 34px rgba(33, 56, 48, 0.05);
        }

        .interest-step-complete {
          border-color: rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.22), transparent 34%),
            rgba(244, 255, 249, 0.86);
        }

        .interest-step-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .interest-step-icon {
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

        .interest-step-complete .interest-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .interest-step-copy {
          display: grid;
          gap: 7px;
        }

        .interest-step-kicker {
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

        .interest-step-kicker span {
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

        .interest-step-complete .interest-step-kicker,
        .interest-step-complete .interest-step-kicker span {
          color: #145c38;
        }

        .interest-step-complete .interest-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .interest-step-copy h2 {
          margin: 0;
          color: #315f48;
          font-size: clamp(1.22rem, 3vw, 1.55rem);
          font-weight: 950;
          letter-spacing: -0.03em;
          line-height: 1.12;
        }

        .interest-step-copy p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.45;
        }

        .interest-step-body {
          display: grid;
          gap: 16px;
        }

        .role-safety-panel {
          display: grid;
          gap: 16px;
          padding: clamp(18px, 4vw, 24px);
          border-radius: 28px;
          box-shadow: 0 18px 48px rgba(33, 56, 48, 0.08);
        }

        .role-safety-ready {
          border: 1px solid rgba(83, 111, 99, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.28), transparent 34%),
            rgba(244, 255, 249, 0.92);
        }

        .role-safety-warning {
          border: 1px solid rgba(191, 146, 72, 0.28);
          background:
            radial-gradient(circle at top left, rgba(255, 229, 184, 0.32), transparent 34%),
            rgba(255, 250, 241, 0.94);
        }

        .role-safety-attention {
          border: 1px solid rgba(190, 118, 76, 0.3);
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.34), transparent 34%),
            rgba(255, 248, 241, 0.94);
        }

        .role-safety-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .role-safety-heading-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.72);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.12);
          font-size: 1.85rem;
        }

        .role-safety-heading h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .role-safety-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 760;
          line-height: 1.5;
        }

        .role-safety-badge-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .role-safety-badge {
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
          background: rgba(244, 255, 249, 0.96);
          color: #536f63;
        }

        .role-safety-badge-info {
          border: 1px solid rgba(108, 92, 160, 0.16);
          background: rgba(248, 245, 255, 0.94);
          color: #5c5488;
        }

        .role-safety-badge-warning {
          border: 1px solid rgba(191, 146, 72, 0.24);
          background: rgba(255, 250, 241, 0.96);
          color: #8a6630;
        }

        .role-safety-note {
          display: grid;
          gap: 6px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
        }

        .role-safety-note strong,
        .role-safety-contact strong {
          color: #315f48;
        }

        .role-safety-note p,
        .role-safety-contact {
          margin: 0;
          color: #60706a;
          font-weight: 760;
          line-height: 1.45;
        }

        .accepted-pathway-panel {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 18px;
          align-items: start;
          margin: 22px 0;
          padding: 24px;
          border: 1px solid rgba(34, 124, 78, 0.34);
          border-radius: 30px;
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.62), transparent 34%),
            linear-gradient(135deg, rgba(229, 255, 238, 0.98), rgba(244, 255, 249, 0.94));
          box-shadow:
            0 20px 48px rgba(33, 96, 61, 0.13),
            inset 0 0 0 1px rgba(255, 255, 255, 0.52);
        }

        .accepted-pathway-icon {
          display: inline-flex;
          width: 68px;
          height: 68px;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          background: rgba(34, 124, 78, 0.14);
          color: #1f6f46;
          box-shadow:
            inset 0 0 0 1px rgba(34, 124, 78, 0.18),
            0 12px 26px rgba(33, 96, 61, 0.12);
          font-size: 2.05rem;
        }

        .accepted-pathway-copy {
          display: grid;
          gap: 12px;
        }

        .accepted-pathway-copy h2 {
          margin: 0;
          color: #145c38;
          font-size: clamp(1.55rem, 3vw, 2.1rem);
          font-weight: 950;
          line-height: 1.08;
          letter-spacing: -0.04em;
        }

        .accepted-pathway-copy p {
          margin: 0;
          color: #275f45;
          font-size: 1rem;
          font-weight: 750;
          line-height: 1.52;
          overflow-wrap: anywhere;
        }

        .accepted-pathway-steps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 4px;
        }

        .accepted-pathway-steps span {
          display: grid;
          gap: 5px;
          min-height: 86px;
          padding: 12px;
          border: 1px solid rgba(34, 124, 78, 0.2);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
          color: #275f45;
          font-size: 0.9rem;
          font-weight: 850;
          line-height: 1.25;
        }

        .accepted-pathway-steps strong {
          display: inline-flex;
          width: 28px;
          height: 28px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(34, 124, 78, 0.14);
          color: #145c38;
          font-size: 0.84rem;
          font-weight: 950;
        }

        .accepted-pathway-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 4px;
        }

        .interest-detail-grid {
          align-items: stretch;
        }

        .interest-detail-card {
          min-height: 228px;
          height: 100%;
          align-items: stretch;
        }

        .interest-detail-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          gap: 18px;
        }

        .interest-detail-body {
          display: grid;
          gap: 10px;
          color: #5d6677;
          line-height: 1.55;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .interest-detail-body p,
        .organisation-interest-status-note {
          margin: 0;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .interest-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-start;
        }

        .interest-chip {
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
        }

        .status-guide-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .status-guide-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px;
          align-items: start;
          min-height: 78px;
          padding: 9px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.66);
        }

        .status-guide-current {
          border-color: rgba(83, 111, 99, 0.34);
          background: rgba(244, 255, 249, 0.92);
          box-shadow: 0 10px 24px rgba(33, 56, 48, 0.06);
        }

        .status-guide-badge {
          display: inline-flex;
          width: 26px;
          height: 26px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(83, 111, 99, 0.1);
          color: #536f63;
          font-size: 0.76rem;
          font-weight: 950;
          flex: 0 0 auto;
        }

        .status-guide-item p {
          margin: 0;
          color: #60706a;
          font-size: 0.86rem;
          font-weight: 750;
          line-height: 1.28;
        }

        .status-guide-item strong {
          display: block;
          color: #536f63;
          font-size: 0.92rem;
          line-height: 1.1;
          margin-bottom: 2px;
        }

        .contact-email-details {
          display: grid;
          gap: 10px;
        }

        .contact-email-details summary {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          min-height: 40px;
          align-items: center;
          justify-content: center;
          padding: 9px 14px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.84);
          color: #536f63;
          cursor: pointer;
          font-weight: 900;
          line-height: 1.15;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
          list-style: none;
        }

        .contact-email-details summary::-webkit-details-marker {
          display: none;
        }

        .contact-email-preview,
        .call-notes-box {
          display: grid;
          max-height: 260px;
          overflow: auto;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.74);
        }

        .contact-email-preview pre {
          margin: 0;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: normal;
          color: #35453f;
          font: inherit;
          line-height: 1.55;
        }

        .call-notes-box ol {
          margin: 0;
          padding-left: 1.25rem;
        }

        .call-notes-box li {
          margin: 0 0 8px;
          color: #35453f;
          line-height: 1.5;
        }

        .call-notes-box li:last-child {
          margin-bottom: 0;
        }

        .contact-email-button {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          border: 1px solid rgba(83, 111, 99, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.88);
          color: #536f63;
          font-size: 0.94rem;
          font-weight: 900;
          line-height: 1.15;
          text-decoration: none;
          box-shadow: 0 10px 24px rgba(33, 56, 48, 0.07);
        }

        .contact-email-button:hover {
          border-color: rgba(83, 111, 99, 0.34);
          background: rgba(244, 255, 249, 0.96);
        }

        @media (max-width: 1120px) {
          .interest-guide-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 980px) {
          .interest-guide-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .organisation-interest-page .dashboard-shell {
            width: min(100%, 100vw);
            padding-left: 18px;
            padding-right: 18px;
          }

          .organisation-interest-page .dashboard-topbar {
            gap: 14px;
          }

          .organisation-interest-page .dashboard-topbar-actions {
            width: 100%;
            justify-content: stretch;
          }

          .organisation-interest-page .dashboard-topbar-actions > *,
          .organisation-interest-page .dashboard-topbar-actions a,
          .organisation-interest-page .dashboard-topbar-actions button {
            width: 100%;
          }

          .organisation-interest-hero {
            gap: 22px;
            padding: 28px 22px;
            border-radius: 30px;
          }

          .organisation-interest-title {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            max-width: 100%;
            font-size: clamp(2.15rem, 11vw, 3rem);
            line-height: 0.98;
            letter-spacing: -0.055em;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .organisation-interest-title span:last-child {
            min-width: 0;
          }

          .organisation-interest-lead {
            max-width: 100%;
            font-size: 1.08rem;
            line-height: 1.48;
            overflow-wrap: anywhere;
          }

          .organisation-interest-hero-meta {
            align-items: stretch;
          }

          .interest-detail-status-pill,
          .interest-detail-meta-pill {
            width: 100%;
          }

          .organisation-interest-actions {
            width: 100%;
            gap: 12px;
          }

          .organisation-interest-actions .dashboard-main-action {
            width: 100%;
          }

          .organisation-interest-status-card {
            width: 100%;
            padding: 22px;
            border-radius: 26px;
          }

          .organisation-interest-status-header {
            align-items: flex-start;
            gap: 14px;
          }

          .organisation-interest-status-header h2 {
            font-size: 1.45rem;
            line-height: 1.08;
            overflow-wrap: anywhere;
          }

          .organisation-interest-status-header p,
          .organisation-interest-status-note {
            font-size: 1rem;
            line-height: 1.35;
          }

          .organisation-interest-status-note {
            margin-top: 10px;
          }

          .interest-profile-summary-grid {
            grid-template-columns: 1fr;
          }

          .interest-profile-summary-grid span {
            grid-template-columns: auto 1fr;
            align-items: center;
            text-align: left;
          }

          .interest-guide-panel,
          .organisation-contact-safety-card,
          .interest-step-section,
          .role-safety-panel {
            padding: 18px;
            border-radius: 24px;
          }

          .interest-guide-heading,
          .organisation-contact-safety-card,
          .interest-step-heading,
          .role-safety-heading {
            grid-template-columns: 1fr;
          }

          .interest-guide-heading > span,
          .organisation-contact-safety-icon,
          .interest-step-icon,
          .role-safety-heading-icon {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .interest-guide-grid {
            grid-template-columns: 1fr;
          }

          .interest-guide-step {
            min-height: 0;
          }

          .role-safety-badge {
            width: 100%;
            text-align: center;
          }

          .accepted-pathway-panel {
            grid-template-columns: 1fr;
            padding: 22px;
            border-radius: 26px;
          }

          .accepted-pathway-icon {
            width: 58px;
            height: 58px;
            border-radius: 20px;
            font-size: 1.85rem;
          }

          .accepted-pathway-steps {
            grid-template-columns: 1fr;
          }

          .accepted-pathway-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .accepted-pathway-actions .primary-button,
          .accepted-pathway-actions .secondary-button {
            width: 100%;
          }

          .interest-detail-card {
            min-height: 0;
            padding: 22px;
          }

          .interest-detail-copy {
            gap: 14px;
          }

          .interest-detail-copy h2 {
            font-size: 1.45rem;
            line-height: 1.14;
            overflow-wrap: anywhere;
          }

          .interest-detail-body {
            font-size: 1rem;
            line-height: 1.48;
          }

          .interest-chip-list {
            gap: 8px;
          }

          .interest-chip {
            border-radius: 18px;
            font-size: 0.86rem;
          }

          .status-guide-list {
            grid-template-columns: 1fr;
          }

          .status-guide-item {
            min-height: 0;
          }

          .status-guide-item p {
            font-size: 0.95rem;
          }

          .status-guide-item strong {
            font-size: 1rem;
          }

          .contact-email-details summary,
          .contact-email-button {
            width: 100%;
          }

          .contact-email-preview,
          .call-notes-box {
            max-height: 220px;
          }
        }

        @media (max-width: 420px) {
          .organisation-interest-page .dashboard-shell {
            padding-left: 14px;
            padding-right: 14px;
          }

          .organisation-interest-hero {
            padding: 24px 18px;
            border-radius: 28px;
          }

          .organisation-interest-title {
            font-size: clamp(1.95rem, 10.5vw, 2.55rem);
          }

          .organisation-interest-status-card,
          .interest-detail-card,
          .accepted-pathway-panel {
            padding: 18px;
          }
        }
      `}</style>
    </main>
  );
}
