"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedStatuses = new Set(["new", "reviewing", "resolved", "closed"]);

type SupportAdminRow = {
  user_id: string;
};

async function requireSupportAdmin() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: supportAdmin } = await supabase
    .from("support_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle<SupportAdminRow>();

  if (!supportAdmin) {
    redirect("/dashboard");
  }

  return { supabase, user };
}

export async function updateAppHelpRequest(formData: FormData) {
  const { supabase } = await requireSupportAdmin();

  const requestId = String(formData.get("request_id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const adminNote = String(formData.get("admin_note") || "").trim();

  if (!requestId) {
    redirect("/admin/app-help?error=Missing%20request%20id.");
  }

  if (!allowedStatuses.has(status)) {
    redirect("/admin/app-help?error=Choose%20a%20valid%20status.");
  }

  const { error } = await supabase
    .from("support_requests")
    .update({
      status,
      admin_note: adminNote || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", requestId);

  if (error) {
    redirect(`/admin/app-help?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/admin/app-help?message=${encodeURIComponent(
      "Help request updated."
    )}`
  );
}
