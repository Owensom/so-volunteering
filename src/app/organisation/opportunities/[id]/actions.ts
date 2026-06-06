"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

type OrganisationProfile = {
  profile_completed: boolean | null;
};

type OpportunityOwner = {
  id: string;
  organisation_user_id: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseStatus(value: string) {
  if (value === "published") return "published";
  if (value === "closed") return "closed";
  return "draft";
}

function normaliseLocationType(value: string) {
  if (value === "remote" || value === "hybrid") {
    return value;
  }

  return "in_person";
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

async function requireOrganisationUser() {
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

  return { supabase, user };
}

export async function updateOpportunity(formData: FormData) {
  const { supabase, user } = await requireOrganisationUser();

  const opportunityId = getText(formData, "opportunity_id");

  if (!opportunityId) {
    redirect("/organisation/opportunities");
  }

  const { data: existingOpportunity } = await supabase
    .from("opportunities")
    .select("id,organisation_user_id")
    .eq("id", opportunityId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<OpportunityOwner>();

  if (!existingOpportunity) {
    redirect("/organisation/opportunities");
  }

  const { data: organisationProfile } = await supabase
    .from("organisation_profiles")
    .select("profile_completed")
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
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Please add an opportunity title.",
      )}`,
    );
  }

  if (!summary) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Please add a short plain-language description.",
      )}`,
    );
  }

  if (locationType !== "remote" && !safeLocation) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Please add a town, city or area for in-person or hybrid roles.",
      )}`,
    );
  }

  if (!timeCommitment) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Please choose a time commitment.",
      )}`,
    );
  }

  if (!contactEmail) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Please add a contact email for this opportunity.",
      )}`,
    );
  }

  if (status === "published" && organisationProfile?.profile_completed !== true) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Complete your organisation profile before publishing an opportunity. You can keep this as a draft for now.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("opportunities")
    .update({
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
      contact_name: contactName || null,
      contact_email: contactEmail,
      safety_notes: safetyNotes || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId)
    .eq("organisation_user_id", user.id);

  if (error) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  redirect("/organisation/opportunities");
}
