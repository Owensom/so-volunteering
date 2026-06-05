"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  full_name: string | null;
  email: string | null;
  user_type: string | null;
};

const allowedCategories = new Set([
  "stuck_using_app",
  "something_not_working",
  "account_or_profile",
  "opportunity_help",
  "report_problem",
  "safety_or_safeguarding"
]);

function normaliseUserType(value: string | null | undefined) {
  if (value?.trim().toLowerCase() === "organisation") {
    return "organisation";
  }

  if (value?.trim().toLowerCase() === "volunteer") {
    return "volunteer";
  }

  return "unknown";
}

export async function submitAppHelpRequest(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const category = String(formData.get("category") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const pageContext = String(formData.get("page_context") || "").trim();

  if (!allowedCategories.has(category)) {
    redirect(
      `/help?error=${encodeURIComponent(
        "Please choose what you need help with."
      )}`
    );
  }

  if (!message) {
    redirect(
      `/help?error=${encodeURIComponent(
        "Please add a short message so we know how to help."
      )}`
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : null;

  const userType = normaliseUserType(profile?.user_type || metadataUserType);

  const fallbackName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  const { error } = await supabase.from("support_requests").insert({
    user_id: user.id,
    user_type: userType,
    name: profile?.full_name || fallbackName || null,
    email: profile?.email || user.email || null,
    category,
    message,
    page_context: pageContext || null,
    status: "new",
    updated_at: new Date().toISOString()
  });

  if (error) {
    redirect(`/help?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/help?message=${encodeURIComponent(
      "Your request has been saved. We will review it as soon as possible."
    )}`
  );
}
