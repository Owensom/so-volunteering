"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function normalisePreferredContactMethod(value: string | null | undefined) {
  if (value === "email" || value === "phone" || value === "sms" || value === "not_sure") {
    return value;
  }

  return "email";
}

function normaliseVolunteeringPreference(value: string | null | undefined) {
  if (value === "in_person" || value === "remote" || value === "both") {
    return value;
  }

  return "both";
}

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
  const volunteeringPreference = normaliseVolunteeringPreference(
    String(formData.get("volunteering_preference") || "both")
  );
  const preferredContactMethod = normalisePreferredContactMethod(
    String(formData.get("preferred_contact_method") || "email")
  );

  if (!city) {
    redirect(
      `/onboarding/volunteer?error=${encodeURIComponent(
        "Please add your nearest town or city."
      )}`
    );
  }

  if (!goals.length) {
    redirect(
      `/onboarding/volunteer?error=${encodeURIComponent(
        "Please choose at least one goal."
      )}`
    );
  }

  const { error } = await supabase.from("volunteer_profiles").upsert(
    {
      user_id: user.id,
      city,
      goals,
      volunteering_preference: volunteeringPreference,
      preferred_contact_method: preferredContactMethod,
      onboarding_completed: false,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    redirect(`/onboarding/volunteer?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding/volunteer/interests");
}
