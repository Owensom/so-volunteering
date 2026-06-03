"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveVolunteerAccessibility(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const accessibilityNeedIds = formData.getAll("accessibility_needs").map(String);
  const supportOptions = formData.getAll("support_options").map(String);
  const supportNeedsFreeText = String(formData.get("support_needs") || "").trim();

  const combinedSupportNeeds = [
    ...supportOptions,
    supportNeedsFreeText ? `Other: ${supportNeedsFreeText}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const shareAccessibilityNeeds =
    String(formData.get("share_accessibility_needs") || "false") === "true";

  const wantsWellbeingSupport =
    String(formData.get("wants_wellbeing_support") || "false") === "true";

  const { error: profileError } = await supabase
    .from("volunteer_profiles")
    .upsert(
      {
        user_id: user.id,
        support_needs: combinedSupportNeeds || null,
        share_support_needs: shareAccessibilityNeeds,
        share_accessibility_needs: shareAccessibilityNeeds,
        wants_wellbeing_support: wantsWellbeingSupport,
        accessibility_completed
