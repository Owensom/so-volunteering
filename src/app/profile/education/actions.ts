"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

type EducationEntry = {
  id: string;
  volunteer_user_id: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function normaliseEntryType(value: string) {
  if (
    value === "school" ||
    value === "college" ||
    value === "university" ||
    value === "training_course" ||
    value === "online_course" ||
    value === "certificate" ||
    value === "work_related_training" ||
    value === "other"
  ) {
    return value;
  }

  return "school";
}

function safeDisplayOrder(value: string) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(parsed, 999));
}

function redirectWithError(message: string): never {
  redirect(`/profile/education?error=${encodeURIComponent(message)}`);
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

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  return { supabase, user };
}

export async function saveEducationEntry(formData: FormData) {
  const { supabase, user } = await requireVolunteerUser();

  const educationId = getText(formData, "education_id");
  const qualificationName = getText(formData, "qualification_name");

  if (!qualificationName) {
    redirectWithError("Please add a qualification, course or training name.");
  }

  const payload = {
    volunteer_user_id: user.id,
    entry_type: normaliseEntryType(getText(formData, "entry_type")),
    institution_name: getText(formData, "institution_name") || null,
    qualification_name: qualificationName,
    qualification_level: getText(formData, "qualification_level") || null,
    subject_or_area: getText(formData, "subject_or_area") || null,
    year_started: getText(formData, "year_started") || null,
    year_completed: getText(formData, "year_completed") || null,
    is_current: getBoolean(formData, "is_current"),
    notes: getText(formData, "notes") || null,
    display_order: safeDisplayOrder(getText(formData, "display_order")),
    updated_at: new Date().toISOString(),
  };

  if (educationId) {
    const { data: existingEntry } = await supabase
      .from("volunteer_education_entries")
      .select("id,volunteer_user_id")
      .eq("id", educationId)
      .eq("volunteer_user_id", user.id)
      .maybeSingle<EducationEntry>();

    if (!existingEntry) {
      redirectWithError("Education entry not found.");
    }

    const { error } = await supabase
      .from("volunteer_education_entries")
      .update(payload)
      .eq("id", educationId)
      .eq("volunteer_user_id", user.id);

    if (error) {
      redirectWithError("Could not update education entry.");
    }
  } else {
    const { error } = await supabase
      .from("volunteer_education_entries")
      .insert(payload);

    if (error) {
      redirectWithError("Could not save education entry.");
    }
  }

  revalidatePath("/profile/education");
  revalidatePath("/profile");
  revalidatePath("/pathway");
  revalidatePath("/pathway/cv");
  revalidatePath("/dashboard");

  redirect(
    `/profile/education?message=${encodeURIComponent(
      educationId ? "Education entry updated." : "Education entry added.",
    )}`,
  );
}

export async function deleteEducationEntry(formData: FormData) {
  const { supabase, user } = await requireVolunteerUser();

  const educationId = getText(formData, "education_id");

  if (!educationId) {
    redirectWithError("Education entry not found.");
  }

  const { data: existingEntry } = await supabase
    .from("volunteer_education_entries")
    .select("id,volunteer_user_id")
    .eq("id", educationId)
    .eq("volunteer_user_id", user.id)
    .maybeSingle<EducationEntry>();

  if (!existingEntry) {
    redirectWithError("Education entry not found.");
  }

  const { error } = await supabase
    .from("volunteer_education_entries")
    .delete()
    .eq("id", educationId)
    .eq("volunteer_user_id", user.id);

  if (error) {
    redirectWithError("Could not remove education entry.");
  }

  revalidatePath("/profile/education");
  revalidatePath("/profile");
  revalidatePath("/pathway");
  revalidatePath("/pathway/cv");
  revalidatePath("/dashboard");

  redirect(
    `/profile/education?message=${encodeURIComponent(
      "Education entry removed.",
    )}`,
  );
}
