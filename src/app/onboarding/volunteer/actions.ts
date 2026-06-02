"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveVolunteerOnboarding(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const goals = formData.getAll("goals").map(String);
  const city = String(formData.get("city") || "").trim();
  const volunteeringPreference = String(
    formData.get("volunteering_preference") || "both"
  );

  const { error } = await supabase.from("volunteer_profiles").upsert({
    user_id: user.id,
    city,
    goals,
    volunteering_preference: volunteeringPreference,
    onboarding_completed: false,
    updated_at: new Date().toISOString()
  });

  if (error) {
    redirect(`/onboarding/volunteer?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding/volunteer/skills");
}
