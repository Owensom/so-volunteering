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

export async function createOpportunity(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
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

  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const locationType = normaliseLocationType(
    String(formData.get("location_type") || "in_person")
  );
  const location = String(formData.get("location") || "").trim();
  const timeCommitment = String(formData.get("time_commitment") || "").trim();
  const contactName = String(formData.get("contact_name") || "").trim();
  const contactEmail = String(formData.get("contact_email") || "").trim();
  const safetyNotes = String(formData.get("safety_notes") || "").trim();

  const interests = formData.getAll("interests").map(String);
  const skills = formData.getAll("skills").map(String);
  const supportOffered = formData.getAll("support_offered").map(String);
  const status = normaliseStatus(String(formData.get("status") || "draft"));

  if (!title) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Please add an opportunity title."
      )}`
    );
  }

  if (!summary) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Please add a short plain-language description."
      )}`
    );
  }

  if (locationType !== "remote" && !location) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Please add a town, city or area for in-person or hybrid roles."
      )}`
    );
  }

  if (!timeCommitment) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Please choose a time commitment."
      )}`
    );
  }

  if (!contactEmail) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Please add a contact email for this opportunity."
      )}`
    );
  }

  if (status === "published" && organisationProfile?.profile_completed !== true) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        "Complete your organisation profile before publishing an opportunity. You can save this as a draft for now."
      )}`
    );
  }

  const { error } = await supabase.from("opportunities").insert({
    organisation_user_id: user.id,
    title,
    summary,
    location_type: locationType,
    location: location || null,
    time_commitment: timeCommitment,
    interests,
    skills,
    support_offered: supportOffered,
    contact_name:
      contactName ||
      organisationProfile?.organisation_name ||
      null,
    contact_email:
      contactEmail ||
      organisationProfile?.contact_email ||
      null,
    safety_notes: safetyNotes || null,
    status,
    updated_at: new Date().toISOString()
  });

  if (error) {
    redirect(
      `/organisation/opportunities/new?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/organisation/opportunities");
}
