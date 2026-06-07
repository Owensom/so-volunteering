"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ORGANISATION_ASSETS_BUCKET = "organisation-assets";
const MAX_LOGO_SIZE_BYTES = 3 * 1024 * 1024;

type Profile = {
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

type UploadableLogoFile = {
  name?: string;
  type?: string;
  size?: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseOrganisationType(value: string): OrganisationType {
  if (value === "school_college") return "school_college";
  if (value === "local_authority_employability") {
    return "local_authority_employability";
  }
  if (value === "other") return "other";

  return "charity_community";
}

function normaliseSafeguardingRegion(value: string): SafeguardingRegion {
  if (value === "england_wales") return "england_wales";
  if (value === "northern_ireland") return "northern_ireland";
  if (value === "other") return "other";

  return "scotland";
}

function normaliseSchoolVisibilityMode(
  value: string,
  organisationType: OrganisationType,
): SchoolVisibilityMode {
  if (organisationType !== "school_college") {
    return "not_applicable";
  }

  if (value === "trusted_local_only") return "trusted_local_only";
  if (value === "all_public_with_blocks") return "all_public_with_blocks";

  return "school_approved_only";
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

function isUploadableLogoFile(value: unknown): value is UploadableLogoFile {
  if (!value || typeof value === "string") {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  const maybeFile = value as {
    name?: unknown;
    type?: unknown;
    size?: unknown;
    arrayBuffer?: unknown;
  };

  return (
    typeof maybeFile.arrayBuffer === "function" &&
    typeof maybeFile.size === "number" &&
    maybeFile.size > 0
  );
}

function getLogoExtension(file: UploadableLogoFile) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/svg+xml") return "svg";

  const fileName = String(file.name || "").toLowerCase();

  if (fileName.endsWith(".png")) return "png";
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "jpg";
  if (fileName.endsWith(".webp")) return "webp";
  if (fileName.endsWith(".svg")) return "svg";

  return "";
}

function isAllowedLogoFile(file: UploadableLogoFile) {
  return (
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp" ||
    file.type === "image/svg+xml"
  );
}

async function uploadOrganisationLogo({
  supabase,
  userId,
  logoFile,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  logoFile: UploadableLogoFile;
}) {
  if (!logoFile.size || logoFile.size > MAX_LOGO_SIZE_BYTES) {
    redirect(
      `/organisation/profile?error=${encodeURIComponent(
        "Please upload a logo smaller than 3MB.",
      )}`,
    );
  }

  if (!isAllowedLogoFile(logoFile)) {
    redirect(
      `/organisation/profile?error=${encodeURIComponent(
        "Please upload a PNG, JPG, WEBP or SVG logo.",
      )}`,
    );
  }

  const extension = getLogoExtension(logoFile);

  if (!extension) {
    redirect(
      `/organisation/profile?error=${encodeURIComponent(
        "Please upload a PNG, JPG, WEBP or SVG logo.",
      )}`,
    );
  }

  const filePath = `organisation-logos/${userId}/logo-${Date.now()}.${extension}`;
  const fileBuffer = await logoFile.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(ORGANISATION_ASSETS_BUCKET)
    .upload(filePath, fileBuffer, {
      cacheControl: "3600",
      contentType: logoFile.type || undefined,
      upsert: true,
    });

  if (uploadError) {
    redirect(
      `/organisation/profile?error=${encodeURIComponent(uploadError.message)}`,
    );
  }

  const { data } = supabase.storage
    .from(ORGANISATION_ASSETS_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
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
  const manualLogoUrl = cleanLogoUrl(String(formData.get("logo_url") || ""));
  const rawManualLogoUrl = String(formData.get("logo_url") || "").trim();
  const logoFileValue = formData.get("logo_file");

  const location = String(formData.get("location") || "").trim();
  const purpose = String(formData.get("purpose") || "").trim();

  const organisationType = normaliseOrganisationType(
    String(formData.get("organisation_type") || ""),
  );

  const safeguardingRegion = normaliseSafeguardingRegion(
    String(formData.get("safeguarding_region") || ""),
  );

  const worksWithChildrenOrPupils =
    formData.get("works_with_children_or_pupils") === "on";

  const schoolVisibilityMode = normaliseSchoolVisibilityMode(
    String(formData.get("school_visibility_mode") || ""),
    organisationType,
  );

  const safeguardingNotes = String(
    formData.get("safeguarding_notes") || "",
  ).trim();

  const legalSafeguardingNotes = String(
    formData.get("legal_safeguarding_notes") || "",
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

  if (rawManualLogoUrl && !manualLogoUrl) {
    redirect(
      `/organisation/profile?error=${encodeURIComponent(
        "Please use a full logo URL starting with https:// or leave it blank.",
      )}`,
    );
  }

  let finalLogoUrl = manualLogoUrl || null;

  if (isUploadableLogoFile(logoFileValue)) {
    finalLogoUrl = await uploadOrganisationLogo({
      supabase,
      userId: user.id,
      logoFile: logoFileValue,
    });
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
      logo_url: finalLogoUrl,
      location,
      purpose,
      volunteer_types: volunteerTypes,
      support_offered: supportOffered,
      safeguarding_notes: safeguardingNotes || null,
      profile_completed: profileCompleted,
      organisation_type: organisationType,
      safeguarding_region: safeguardingRegion,
      works_with_children_or_pupils: worksWithChildrenOrPupils,
      school_visibility_mode: schoolVisibilityMode,
      legal_safeguarding_notes: legalSafeguardingNotes || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    redirect(`/organisation/profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/organisation/dashboard");
}
