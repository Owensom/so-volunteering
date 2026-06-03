"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveVolunteerAvailability(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const availabilityChoices = formData.getAll("availability").map(String);

  const contactMethod = String(
    formData.get("preferred_contact_method") || "email"
  );

  const availabilityFreeText = String(
    formData.get("availability_notes") || ""
  ).trim();

  if (!availabilityChoices.length) {
    redirect(
      `/onboarding/volunteer/availability?error=${encodeURIComponent(
        "Please choose at least one availability option."
      )}`
    );
  }

  const availabilityNotes = [
    ...availabilityChoices,
    availabilityFreeText ? `Other: ${availabilityFreeText}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await supabase
    .from("volunteer_profiles")
    .upsert(
      {
        user_id: user.id,
        availability_notes: availabilityNotes,
        preferred_contact_method: contactMethod,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );

  if (error) {
    redirect(
      `/onboarding/volunteer/availability?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/dashboard");
}
