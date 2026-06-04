"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

type InterestOwner = {
  id: string;
  volunteer_user_id: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

export async function removeInterest(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const interestId = String(formData.get("interest_id") || "").trim();

  if (!interestId) {
    redirect("/my-interests");
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

  const { data: interest } = await supabase
    .from("opportunity_interests")
    .select("id,volunteer_user_id")
    .eq("id", interestId)
    .eq("volunteer_user_id", user.id)
    .maybeSingle<InterestOwner>();

  if (!interest) {
    redirect("/my-interests");
  }

  const { error } = await supabase
    .from("opportunity_interests")
    .delete()
    .eq("id", interest.id)
    .eq("volunteer_user_id", user.id);

  if (error) {
    redirect(`/my-interests?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/my-interests?message=${encodeURIComponent(
      "Interest removed. The organisation will no longer see this interest."
    )}`
  );
}
