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
  const supportNeeds = String(formData.get("support_needs") || "").trim();

  const shareAccessibilityNeeds =
    String(formData.get("share_accessibility_needs") || "false") === "true";

  const wantsWellbeingSupport =
    String(formData.get("wants_wellbeing_support") || "false") === "true";

  const { error: profileError } = await supabase
    .from("volunteer_profiles")
    .upsert({
      user_id: user.id,
      support_needs: supportNeeds,
      share_support_needs: shareAccessibilityNeeds,
      share_accessibility_needs: shareAccessibilityNeeds,
      wants_wellbeing_support: wantsWellbeingSupport,
      accessibility_completed: true,
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    redirect(
      `/onboarding/volunteer/accessibility?error=${encodeURIComponent(
        profileError.message
      )}`
    );
  }

  await supabase
    .from("volunteer_accessibility_needs")
    .delete()
    .eq("volunteer_id", user.id);

  if (accessibilityNeedIds.length > 0) {
    const rows = accessibilityNeedIds.map((accessibilityNeedId) => ({
      volunteer_id: user.id,
      accessibility_need_id: accessibilityNeedId,
      details: supportNeeds,
      share_with_organisations: shareAccessibilityNeeds
    }));

    const { error: needsError } = await supabase
      .from("volunteer_accessibility_needs")
      .insert(rows);

    if (needsError) {
      redirect(
        `/onboarding/volunteer/accessibility?error=${encodeURIComponent(
          needsError.message
        )}`
      );
    }
  }

  redirect("/dashboard");
}
