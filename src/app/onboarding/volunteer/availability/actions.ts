"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ExistingVolunteerProfile = {
  user_id: string;
};

function normaliseContactMethod(value: string) {
  if (value === "phone") return "phone";
  if (value === "sms" || value === "text" || value === "text_message") {
    return "sms";
  }

  return "email";
}

function normalisePhoneNumber(value: string) {
  return value.replace(/[^\d+() -]/g, "").trim();
}

export async function saveVolunteerAvailability(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const availabilityChoices = formData.getAll("availability").map(String);

  const contactMethod = normaliseContactMethod(
    String(formData.get("preferred_contact_method") || "email")
  );

  const phoneNumber = normalisePhoneNumber(
    String(formData.get("phone_number") || "")
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

  if ((contactMethod === "phone" || contactMethod === "sms") && !phoneNumber) {
    redirect(
      `/onboarding/volunteer/availability?error=${encodeURIComponent(
        "Please add a phone number if you choose phone call or text message."
      )}`
    );
  }

  const availabilityNotes = [
    ...availabilityChoices,
    availabilityFreeText ? `Other: ${availabilityFreeText}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("volunteer_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle<ExistingVolunteerProfile>();

  if (existingProfileError) {
    redirect(
      `/onboarding/volunteer/availability?error=${encodeURIComponent(
        existingProfileError.message
      )}`
    );
  }

  if (!existingProfile) {
    redirect(
      `/onboarding/volunteer?error=${encodeURIComponent(
        "Please start your profile setup before choosing availability."
      )}`
    );
  }

  const { error } = await supabase
    .from("volunteer_profiles")
    .update({
      availability_notes: availabilityNotes,
      preferred_contact_method: contactMethod,
      phone_number: phoneNumber || null,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `/onboarding/volunteer/availability?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/dashboard");
}
