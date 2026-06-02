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

  const interests = formData.getAll("interests").map(String);
  const skills = formData.getAll("skills").map(String);
  const bio = String(formData.get("bio") || "").trim();

  const { error } = await supabase.from("volunteer_profiles").upsert({
    user_id: user.id,
    interests,
    skills,
    bio: bio || null,
    updated_at: new Date().toISOString()
  });

  if (error) {
    redirect(
      `/onboarding/volunteer/skills?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/onboarding/volunteer/accessibility");
}
