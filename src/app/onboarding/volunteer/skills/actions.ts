"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveVolunteerSkills(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const skills = formData.getAll("skills").map(String);
  const bio = String(formData.get("bio") || "").trim();

  if (!skills.length) {
    redirect(
      `/onboarding/volunteer/skills?error=${encodeURIComponent(
        "Please choose at least one skill, even if you are still finding your skills."
      )}`
    );
  }

  const { error } = await supabase
    .from("volunteer_profiles")
    .upsert(
      {
        user_id: user.id,
        skills,
        bio: bio || null,
        onboarding_completed: false,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );

  if (error) {
    redirect(
      `/onboarding/volunteer/skills?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/onboarding/volunteer/accessibility");
}
