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
