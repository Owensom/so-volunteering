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

async function requireOrganisationUser() {
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

  return { supabase, user };
}

export async function updateOpportunity(formData: FormData) {
  const { supabase, user } = await requireOrganisationUser();

  const opportunityId = String(formData.get("opportunity_id") || "").trim();

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
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Please add an opportunity title."
      )}`
    );
  }

  if (!summary) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Please add a short plain-language description."
      )}`
    );
  }

  if (locationType !== "remote" && !location) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Please add a town, city or area for in-person or hybrid roles."
      )}`
    );
  }

  if (!timeCommitment) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Please choose a time commitment."
      )}`
    );
  }

  if (!contactEmail) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Please add a contact email for this opportunity."
      )}`
    );
  }

  if (status === "published" && organisationProfile?.profile_completed !== true) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        "Complete your organisation profile before publishing an opportunity. You can keep this as a draft for now."
      )}`
    );
  }

  const { error } = await supabase
    .from("opportunities")
    .update({
      title,
      summary,
      location_type: locationType,
      location: location || null,
      time_commitment: timeCommitment,
      interests,
      skills,
      support_offered: supportOffered,
      contact_name: contactName || null,
      contact_email: contactEmail,
      safety_notes: safetyNotes || null,
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", opportunityId)
    .eq("organisation_user_id", user.id);

  if (error) {
    redirect(
      `/organisation/opportunities/${opportunityId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/organisation/opportunities");
}
