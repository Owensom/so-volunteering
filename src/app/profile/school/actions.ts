"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

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

function normaliseJoinCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/--+/g, "-")
    .slice(0, 32);
}

function redirectWithError(message: string): never {
  redirect(`/profile/school?error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(message: string): never {
  redirect(`/profile/school?message=${encodeURIComponent(message)}`);
}

async function requireVolunteerUser() {
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

  if (userType !== "volunteer") {
    redirect("/organisation/dashboard");
  }

  return {
    supabase,
    user,
  };
}

export async function joinSchoolWithCode(formData: FormData) {
  const { supabase } = await requireVolunteerUser();

  const joinCode = normaliseJoinCode(getText(formData, "join_code"));
  const pupilStage = normalisePupilStage(getText(formData, "pupil_stage"));

  if (joinCode.length < 6) {
    redirectWithError("Please enter the school join code exactly as given.");
  }

  const { error } = await supabase.rpc("claim_school_join_code", {
    join_code_value: joinCode,
    pupil_stage_value: pupilStage,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/profile/school");
  revalidatePath("/dashboard");
  redirectWithMessage("School link saved.");
}

export async function leaveSchoolMembership(formData: FormData) {
  const { supabase, user } = await requireVolunteerUser();

  const membershipId = getText(formData, "membership_id");

  if (!membershipId) {
    redirectWithError("School membership record missing.");
  }

  const { error } = await supabase
    .from("school_pupil_memberships")
    .update({
      membership_status: "left",
    })
    .eq("id", membershipId)
    .eq("volunteer_user_id", user.id);

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/profile/school");
  revalidatePath("/dashboard");
  redirectWithMessage("School link left.");
}
