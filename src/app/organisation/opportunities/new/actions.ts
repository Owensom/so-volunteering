"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

type OrganisationProfile = {
  organisation_name: string | null;
  contact_email: string | null;
  profile_completed: boolean | null;
};

type MinimumAgeStage =
  | "not_set"
  | "adults_only"
  | "sixteen_plus"
  | "fourteen_plus"
  | "school_pupils_with_approval"
  | "school_pupils_with_parent_carer_consent";

type SafeguardingCheckRegion =
  | "organisation_default"
  | "scotland_pvg"
  | "england_wales_dbs"
  | "northern_ireland_accessni"
  | "not_expected"
  | "not_sure";

type RoleFrequencyPattern =
  | "not_set"
  | "one_off"
  | "occasional"
  | "weekly_or_regular"
  | "more_than_three_days_in_thirty"
  | "overnight"
  | "not_sure";

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseStatus(value: string) {
  return value === "published" ? "published" : "draft";
}

function normaliseLocationType(value: string) {
  if (value === "remote" || value === "hybrid") {
    return value;
  }

  return "in_person";
}

function normaliseMinimumAgeStage(value: string): MinimumAgeStage {
  if (value === "adults_only") return "adults_only";
  if (value === "sixteen_plus") return "sixteen_plus";
  if (value === "fourteen_plus") return "fourteen_plus";
  if (value === "school_pupils_with_approval") {
    return "school_pupils_with_approval";
  }
  if (value === "school_pupils_with_parent_carer_consent") {
    return "school_pupils_with_parent_carer_consent";
  }

  return "not_set";
}

function normaliseSafeguardingCheckRegion(
  value: string,
): SafeguardingCheckRegion {
  if (value === "scotland_pvg") return "scotland_pvg";
  if (value === "england_wales_dbs") return "england_wales_dbs";
  if (value === "northern_ireland_accessni") {
    return "northern_ireland_accessni";
  }
  if (value === "not_expected") return "not_expected";
  if (value === "not_sure") return "not_sure";

  return "organisation_default";
}

function normaliseRoleFrequencyPattern(value: string): RoleFrequencyPattern {
  if (value === "one_off") return "one_off";
  if (value === "occasional") return "occasional";
  if (value === "weekly_or_regular") return "weekly_or_regular";
  if (value === "more_than_three_days_in_thirty") {
    return "more_than_three_days_in_thirty";
  }
  if (value === "overnight") return "overnight";
  if (value === "not_sure") return "not_sure";

  return "not_set";
}

function getText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function cleanArray(values: FormDataEntryValue[]) {
  return values.map(String).map((value) => value.trim()).filter(Boolean);
}

export async function createOpportunity(formData: FormData) {
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

  const { data: organisationProfile } = await supabase
    .from("organisation_profiles")
    .select("organisation_name,contact_email,profile_completed")
    .eq("user_id", user.id)
    .maybeSingle<OrganisationProfile>();

  const title = getText(formData, "title");
  const summary = getText(formData, "summary");
  const locationType = normaliseLocationType(
    getText(formData, "location_type") || "in_person",
  );

  const location = getText(formData, "location");
  const locationTownCity = getText(formData, "location_town_city");
  const locationArea = getText(formData, "location_area");
  const locationVenue = getText(formData, "location_venue");
  const locationPostcode = getText(formData, "location_postcode");
  const travelNotes = getText(formData, "travel_notes");
  const accessibilityNotes = getText(formData, "accessibility_notes");
  const hideExactLocation = getBoolean(formData, "hide_exact_location");

  const timeCommitment = getText(formData, "time_commitment");
  const contactName = getText(formData, "contact_name");
  const contactEmail = getText(formData, "contact_email");
  const safetyNotes = getText(formData, "safety_notes");

  const minimumAgeStage = normaliseMinimumAgeStage(
    getText(formData, "minimum_age_stage"),
  );
  const suitableForPupils = getBoolean(formData, "suitable_for_pupils");
  const parentCarerConsentRequired = getBoolean(
    formData,
    "parent_carer_consent_required",
  );
  const schoolApprovalRequired = getBoolean(
    formData,
    "school_approval_required",
  );
  const safeguardingCheckRegion = normaliseSafeguardingCheckRegion(
    getText(formData, "safeguarding_check_region"),
  );
  const safeguardingReviewRequired = getBoolean(
    formData,
    "safeguarding_review_required",
  );
  const supervisionRequired = getBoolean(formData, "supervision_required");
  const noLoneWorking = getBoolean(formData, "no_lone_working");
  const noHomeVisits = getBoolean(formData, "no_home_visits");
  const noMoneyHandling = getBoolean(formData, "no_money_handling");
  const noPersonalCare = getBoolean(formData, "no_personal_care");
  const noPrivateMessaging = getBoolean(formData, "no_private_messaging");
  const riskAssessmentCompleted = getBoolean(
    formData,
    "risk_assessment_completed",
  );
  const namedSafeguardingContact = getText(
    formData,
    "named_safeguarding_contact",
  );
  const legalSafeguardingNotes = getText(
    formData,
    "legal_safeguarding_notes",
  );
  const roleFrequencyPattern = normaliseRoleFrequencyPattern(
    getText(formData, "role_frequency_pattern"),
  );

  const interests = cleanArray(formData.getAll("interests"));
  const skills = cleanArray(formData.getAll("skills"));
  const supportOffered = cleanArray(formData.getAll("support_offered"));
  const status = normaliseStatus(getText(formData, "status") || "draft");

  const safeLocation =
    locationTownCity || locationArea || location || locationVenue;

  const legacyLocation =
    location ||
    [locationTownCity, locationArea].filter(Boolean).join(" · ") ||
    null;

  if (!title) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Please add an opportunity title.",
      )}`,
    );
  }

  if (!summary) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Please add a short plain-language description.",
      )}`,
    );
  }

  if (locationType !== "remote" && !safeLocation) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Please add a town, city or area for in-person or hybrid roles.",
      )}`,
    );
  }

  if (!timeCommitment) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Please choose a time commitment.",
      )}`,
    );
  }

  if (!contactEmail) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Please add a contact email for this opportunity.",
      )}`,
    );
  }

  if (status === "published" && organisationProfile?.profile_completed !== true) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Complete your organisation profile before publishing an opportunity. You can save this as a draft for now.",
      )}`,
    );
  }

  const { error } = await supabase.from("opportunities").insert({
    organisation_user_id: user.id,
    title,
    summary,
    location_type: locationType,
    location: legacyLocation,
    location_town_city: locationTownCity || null,
    location_area: locationArea || null,
    location_venue: locationVenue || null,
    location_postcode: locationPostcode || null,
    travel_notes: travelNotes || null,
    accessibility_notes: accessibilityNotes || null,
    hide_exact_location: hideExactLocation,
    time_commitment: timeCommitment,
    interests,
    skills,
    support_offered: supportOffered,
    contact_name: contactName || organisationProfile?.organisation_name || null,
    contact_email: contactEmail || organisationProfile?.contact_email || null,
    safety_notes: safetyNotes || null,

    minimum_age_stage: minimumAgeStage,
    suitable_for_pupils: suitableForPupils,
    parent_carer_consent_required: parentCarerConsentRequired,
    school_approval_required: schoolApprovalRequired,
    safeguarding_check_region: safeguardingCheckRegion,
    safeguarding_review_required: safeguardingReviewRequired,
    supervision_required: supervisionRequired,
    no_lone_working: noLoneWorking,
    no_home_visits: noHomeVisits,
    no_money_handling: noMoneyHandling,
    no_personal_care: noPersonalCare,
    no_private_messaging: noPrivateMessaging,
    risk_assessment_completed: riskAssessmentCompleted,
    named_safeguarding_contact: namedSafeguardingContact || null,
    legal_safeguarding_notes: legalSafeguardingNotes || null,
    role_frequency_pattern: roleFrequencyPattern,

    status,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  redirect("/organisation/opportunities");
}
