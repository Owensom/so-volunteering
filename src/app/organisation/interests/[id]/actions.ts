"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

type InterestOwner = {
  id: string;
  organisation_user_id: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseInterestStatus(value: string) {
  if (value === "reviewed") return "reviewed";
  if (value === "contacted") return "contacted";
  if (value === "closed") return "closed";
  return "new";
}

async function requireOrganisationUser() {
  const supabase = await createClient();

  const {
    data: { user }
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

  if (userType !== "organisation") {
    redirect("/dashboard");
  }

  return { supabase, user };
}

export async function updateInterestStatus(formData: FormData) {
  const { supabase, user } = await requireOrganisationUser();

  const interestId = String(formData.get("interest_id") || "").trim();
  const status = normaliseInterestStatus(String(formData.get("status") || "new"));

  if (!interestId) {
    redirect("/organisation/interests");
  }

  const { data: interest } = await supabase
    .from("opportunity_interests")
    .select("id,organisation_user_id")
    .eq("id", interestId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<InterestOwner>();

  if (!interest) {
    redirect("/organisation/interests");
  }

  const { error } = await supabase
    .from("opportunity_interests")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", interest.id)
    .eq("organisation_user_id", user.id);

  if (error) {
    redirect(
      `/organisation/interests/${interest.id}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(
    `/organisation/interests/${interest.id}?message=${encodeURIComponent(
      "Interest status updated."
    )}`
  );
}
