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

const allowedInterests = new Set([
  "Helping people",
  "Animals and nature",
  "Events and activities",
  "Creative tasks",
  "Practical tasks",
  "Digital or admin",
  "Sport and movement",
  "Music and performance",
  "Learning and mentoring",
  "Food and hospitality",
  "Community projects",
  "Open to ideas"
]);

export async function saveVolunteerInterests(formData: FormData) {
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

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  const selectedInterests = formData
    .getAll("interests")
    .map(String)
    .map((value) => value.trim())
    .filter((value) => allowedInterests.has(value));

  if (selectedInterests.length === 0) {
    redirect(
      `/onboarding/volunteer/interests?error=${encodeURIComponent(
        "Choose at least one interest to continue."
      )}`
    );
  }

  const { error } = await supabase.from("volunteer_profiles").upsert(
    {
      user_id: user.id,
      interests: selectedInterests,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "user_id"
    }
  );

  if (error) {
    redirect(
      `/onboarding/volunteer/interests?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/onboarding/volunteer/skills");
}
