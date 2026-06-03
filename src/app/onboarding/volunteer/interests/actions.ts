"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveVolunteerInterests(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const interests = formData.getAll("interests").map(String);

  if (!interests.length) {
    redirect(
      `/onboarding/volunteer/interests?error=${encodeURIComponent(
        "Please choose at least one interest or thing you might like to try."
      )}`
    );
  }

  const { error } = await supabase
    .from("volunteer_profiles")
    .upsert(
      {
        user_id: user.id,
        interests,
        onboarding_completed: false,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
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
