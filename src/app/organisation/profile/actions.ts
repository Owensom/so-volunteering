"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function cleanWebsite(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function cleanLogoUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return "";
}

export async function saveOrganisationProfile(formData: FormData) {
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

  const organisationName = String(
    formData.get("organisation_name") || "",
  ).trim();

  const contactEmail = String(formData.get("contact_email") || "").trim();

  const phone = String(formData.get("phone") || "").trim();
  const website = cleanWebsite(String(formData.get("website") || ""));
  const logoUrl = cleanLogoUrl(String(formData.get("logo_url") || ""));
  const location = String(formData.get("location") || "").trim();
  const purpose = String(formData.get("purpose") || "").trim();
  const safeguardingNotes = String(
    formData.get("safeguarding_notes") || "",
  ).trim();

  const volunteerTypes = formData.getAll("volunteer_types").map(String);
  const supportOffered = formData.getAll("support_offered").map(String);

  if (!organisationName) {
    redirect(
      `/organisation/profile?error=${encodeURIComponent(
        "Please add your organisation name.",
      )}`,
    );
  }

  if (!contactEmail) {
    redirect(
      `/organisation/profile?error=${encodeURIComponent(
        "Please add a contact email.",
      )}`,
    );
  }

  if (!location) {
    redirect(
      `/organisation/profile?error=${encodeURIComponent(
        "Please add your town, city or area.",
      )}`,
    );
  }

  if (!purpose) {
    redirect(
      `/organisation/profile?error=${encodeURIComponent(
        "Please add a short description of what your organisation does.",
      )}`,
    );
  }

  const rawLogoUrl = String(formData.get("logo_url") || "").trim();

  if (rawLogoUrl && !logoUrl) {
    redirect(
      `/organisation/profile?error=${encodeURIComponent(
        "Please use a full logo URL starting with https:// or leave it blank.",
      )}`,
    );
  }

  const profileCompleted = Boolean(
    organisationName &&
      contactEmail &&
      location &&
      purpose &&
      volunteerTypes.length > 0 &&
      supportOffered.length > 0,
  );

  const { error } = await supabase.from("organisation_profiles").upsert(
    {
      user_id: user.id,
      organisation_name: organisationName,
      contact_email: contactEmail,
      phone: phone || null,
      website: website || null,
      logo_url: logoUrl || null,
      location,
      purpose,
      volunteer_types: volunteerTypes,
      support_offered: supportOffered,
      safeguarding_notes: safeguardingNotes || null,
      profile_completed: profileCompleted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    redirect(`/organisation/profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/organisation/dashboard");
}
