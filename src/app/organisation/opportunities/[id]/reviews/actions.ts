"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

type OpportunityInterest = {
  id: string;
  opportunity_id: string;
  organisation_user_id: string;
  volunteer_user_id: string;
  volunteer_name: string | null;
  volunteer_email: string | null;
};

type Opportunity = {
  id: string;
  title: string;
  organisation_user_id: string;
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

function normaliseReviewStatus(value: string) {
  if (value === "draft" || value === "hidden" || value === "shared") {
    return value;
  }

  return "shared";
}

function redirectWithError(opportunityId: string, message: string): never {
  redirect(
    `/organisation/opportunities/${opportunityId}/reviews?error=${encodeURIComponent(
      message,
    )}`,
  );
}

export async function saveVolunteerSkillReview(formData: FormData) {
  const supabase = await createClient();

  const opportunityId = getText(formData, "opportunity_id");
  const opportunityInterestId = getText(formData, "opportunity_interest_id");

  if (!opportunityId || !opportunityInterestId) {
    redirect("/organisation/opportunities");
  }

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

  if (userType !== "organisation") {
    redirect("/dashboard");
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,organisation_user_id")
    .eq("id", opportunityId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<Opportunity>();

  if (!opportunity) {
    redirectWithError(opportunityId, "Opportunity not found.");
  }

  const opportunityRow = opportunity;

  const { data: interest } = await supabase
    .from("opportunity_interests")
    .select(
      "id,opportunity_id,organisation_user_id,volunteer_user_id,volunteer_name,volunteer_email",
    )
    .eq("id", opportunityInterestId)
    .eq("opportunity_id", opportunityId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<OpportunityInterest>();

  if (!interest) {
    redirectWithError(opportunityId, "Volunteer interest not found.");
  }

  const interestRow = interest;

  const status = normaliseReviewStatus(getText(formData, "status"));

  const positiveComment = getText(formData, "positive_comment");
  const privateOrganisationNote = getText(
    formData,
    "private_organisation_note",
  );

  const { error } = await supabase.from("volunteer_skill_reviews").upsert(
    {
      opportunity_interest_id: interestRow.id,
      opportunity_id: opportunityRow.id,
      organisation_user_id: user.id,
      volunteer_user_id: interestRow.volunteer_user_id,

      volunteer_name: interestRow.volunteer_name,
      volunteer_email: interestRow.volunteer_email,
      opportunity_title: opportunityRow.title,

      reliability: getBoolean(formData, "reliability"),
      teamwork: getBoolean(formData, "teamwork"),
      communication: getBoolean(formData, "communication"),
      confidence: getBoolean(formData, "confidence"),
      kindness: getBoolean(formData, "kindness"),
      problem_solving: getBoolean(formData, "problem_solving"),
      following_instructions: getBoolean(formData, "following_instructions"),
      initiative: getBoolean(formData, "initiative"),
      timekeeping: getBoolean(formData, "timekeeping"),
      practical_skills: getBoolean(formData, "practical_skills"),
      community_interaction: getBoolean(formData, "community_interaction"),

      positive_comment: positiveComment || null,
      private_organisation_note: privateOrganisationNote || null,
      status,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "opportunity_interest_id",
    },
  );

  if (error) {
    redirectWithError(opportunityId, "Could not save the skills review.");
  }

  revalidatePath(`/organisation/opportunities/${opportunityId}/reviews`);
  revalidatePath(`/organisation/opportunities/${opportunityId}`);
  revalidatePath("/pathway");
  revalidatePath("/dashboard");

  redirect(
    `/organisation/opportunities/${opportunityId}/reviews?message=${encodeURIComponent(
      "Skills review saved.",
    )}`,
  );
}
