"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normalisePreferredContactMethod(value: string | null | undefined) {
  if (
    value === "email" ||
    value === "phone" ||
    value === "sms" ||
    value === "not_sure"
  ) {
    return value;
  }

  return "email";
}

export async function saveVolunteerContactOptions(formData: FormData) {
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
    .maybeSingle<{ user_type: string | null }>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  const preferredContactMethod = normalisePreferredContactMethod(
    String(formData.get("preferred_contact_method") || "email"),
  );

  const phone = String(formData.get("phone") || "").trim();

  if (phone.length > 40) {
    redirect(
      `/profile/contact?error=${encodeURIComponent(
        "Please check the phone or text number. It looks too long.",
      )}`,
    );
  }

  const { error } = await supabase.from("volunteer_profiles").upsert(
    {
      user_id: user.id,
      preferred_contact_method: preferredContactMethod,
      phone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    redirect(`/profile/contact?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/profile/contact?message=${encodeURIComponent(
      "Contact options saved.",
    )}`,
  );
}
