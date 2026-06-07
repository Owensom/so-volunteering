"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

type SchoolProfile = {
  user_id: string;
  organisation_name: string | null;
  organisation_type: string | null;
};

type JoinCodeStatus = "active" | "paused" | "expired";
type MembershipStatus = "pending" | "active" | "paused" | "left" | "removed";
type PupilStage =
  | "not_set"
  | "s1"
  | "s2"
  | "s3"
  | "s4"
  | "s5"
  | "s6"
  | "college"
  | "other";

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseJoinCodeStatus(value: string | null | undefined): JoinCodeStatus {
  if (value === "paused") return "paused";
  if (value === "expired") return "expired";
  return "active";
}

function normaliseMembershipStatus(
  value: string | null | undefined,
): MembershipStatus {
  if (value === "pending") return "pending";
  if (value === "paused") return "paused";
  if (value === "left") return "left";
  if (value === "removed") return "removed";
  return "active";
}

function normalisePupilStage(value: string | null | undefined): PupilStage {
  if (value === "s1") return "s1";
  if (value === "s2") return "s2";
  if (value === "s3") return "s3";
  if (value === "s4") return "s4";
  if (value === "s5") return "s5";
  if (value === "s6") return "s6";
  if (value === "college") return "college";
  if (value === "other") return "other";
  return "not_set";
}

function getText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function redirectWithError(message: string): never {
  redirect(
    `/organisation/school-approvals/pupils?error=${encodeURIComponent(message)}`,
  );
}

function redirectWithMessage(message: string): never {
  redirect(
    `/organisation/school-approvals/pupils?message=${encodeURIComponent(message)}`,
  );
}

function normaliseJoinCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/--+/g, "-")
    .slice(0, 32);
}

function generateJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "SO-";

  for (let index = 0; index < 8; index += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return result;
}

function parseOptionalPositiveInteger(value: string) {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseOptionalExpiry(value: string) {
  if (!value) return null;

  const date = new Date(`${value}T23:59:59.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

async function requireSchoolOrganisationUser() {
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

  const { data: schoolProfile } = await supabase
    .from("organisation_profiles")
    .select("user_id,organisation_name,organisation_type")
    .eq("user_id", user.id)
    .maybeSingle<SchoolProfile>();

  if (!schoolProfile || schoolProfile.organisation_type !== "school_college") {
    redirect("/organisation/dashboard");
  }

  return {
    supabase,
    user,
    schoolProfile,
  };
}

export async function createSchoolJoinCode(formData: FormData) {
  const { supabase, user } = await requireSchoolOrganisationUser();

  const label = getText(formData, "label");
  const suppliedCode = normaliseJoinCode(getText(formData, "code"));
  const code = suppliedCode || generateJoinCode();

  if (code.length < 6) {
    redirectWithError("Join code must be at least 6 characters.");
  }

  const maxUses = parseOptionalPositiveInteger(getText(formData, "max_uses"));
  const expiresAt = parseOptionalExpiry(getText(formData, "expires_at"));

  const { error } = await supabase.from("school_join_codes").insert({
    school_user_id: user.id,
    code,
    label: label || null,
    status: "active",
    max_uses: maxUses,
    expires_at: expiresAt,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/organisation/school-approvals/pupils");
  redirectWithMessage("Join code created.");
}

export async function updateSchoolJoinCode(formData: FormData) {
  const { supabase, user } = await requireSchoolOrganisationUser();

  const joinCodeId = getText(formData, "join_code_id");

  if (!joinCodeId) {
    redirectWithError("Join code record missing.");
  }

  const label = getText(formData, "label");
  const status = normaliseJoinCodeStatus(getText(formData, "status"));
  const maxUses = parseOptionalPositiveInteger(getText(formData, "max_uses"));
  const expiresAt = parseOptionalExpiry(getText(formData, "expires_at"));

  const { error } = await supabase
    .from("school_join_codes")
    .update({
      label: label || null,
      status,
      max_uses: maxUses,
      expires_at: expiresAt,
    })
    .eq("id", joinCodeId)
    .eq("school_user_id", user.id);

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/organisation/school-approvals/pupils");
  redirectWithMessage("Join code updated.");
}

export async function deleteSchoolJoinCode(formData: FormData) {
  const { supabase, user } = await requireSchoolOrganisationUser();

  const joinCodeId = getText(formData, "join_code_id");

  if (!joinCodeId) {
    redirectWithError("Join code record missing.");
  }

  const { error } = await supabase
    .from("school_join_codes")
    .delete()
    .eq("id", joinCodeId)
    .eq("school_user_id", user.id);

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/organisation/school-approvals/pupils");
  redirectWithMessage("Join code removed.");
}

export async function updatePupilMembership(formData: FormData) {
  const { supabase, user } = await requireSchoolOrganisationUser();

  const membershipId = getText(formData, "membership_id");

  if (!membershipId) {
    redirectWithError("Pupil membership record missing.");
  }

  const membershipStatus = normaliseMembershipStatus(
    getText(formData, "membership_status"),
  );
  const pupilStage = normalisePupilStage(getText(formData, "pupil_stage"));
  const pupilNotes = getText(formData, "pupil_notes");
  const parentCarerConsentConfirmed = getBoolean(
    formData,
    "parent_carer_consent_confirmed",
  );
  const schoolStaffConfirmed = getBoolean(formData, "school_staff_confirmed");

  const { error } = await supabase
    .from("school_pupil_memberships")
    .update({
      membership_status: membershipStatus,
      pupil_stage: pupilStage,
      pupil_notes: pupilNotes || null,
      parent_carer_consent_confirmed: parentCarerConsentConfirmed,
      school_staff_confirmed: schoolStaffConfirmed,
    })
    .eq("id", membershipId)
    .eq("school_user_id", user.id);

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/organisation/school-approvals/pupils");
  redirectWithMessage("Pupil membership updated.");
}

export async function removePupilMembership(formData: FormData) {
  const { supabase, user } = await requireSchoolOrganisationUser();

  const membershipId = getText(formData, "membership_id");

  if (!membershipId) {
    redirectWithError("Pupil membership record missing.");
  }

  const { error } = await supabase
    .from("school_pupil_memberships")
    .delete()
    .eq("id", membershipId)
    .eq("school_user_id", user.id);

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/organisation/school-approvals/pupils");
  redirectWithMessage("Pupil membership removed.");
}
