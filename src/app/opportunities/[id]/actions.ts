"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  full_name: string | null;
  email: string | null;
  user_type: string | null;
};

type VolunteerProfile = {
  city: string | null;
  goals: string[] | null;
  interests: string[] | null;
  skills: string[] | null;
  support_needs: string | null;
  share_accessibility_needs: boolean | null;
  preferred_contact_method: string | null;
};

type Opportunity = {
  id: string;
  organisation_user_id: string;
  status: string;
};

type InterestOwner = {
  id: string;
  volunteer_user_id: string;
  opportunity_id: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normalisePreferredContactMethod(value: string | null | undefined) {
  if (value === "phone") return "phone";
  if (value === "sms") return "sms";
  return "email";
}

async function requireVolunteerUser() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,user_type")
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

  return { supabase, user, profile };
}

export async function expressInterest(formData: FormData) {
  const { supabase, user, profile } = await requireVolunteerUser();

  const opportunityId = String(formData.get("opportunity_id") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!opportunityId) {
    redirect("/opportunities");
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,organisation_user_id,status")
    .eq("id", opportunityId)
    .eq("status", "published")
    .maybeSingle<Opportunity>();

  if (!opportunity) {
    redirect("/opportunities");
  }

  const { data: existingInterest } = await supabase
    .from("opportunity_interests")
    .select("id")
    .eq("opportunity_id", opportunity.id)
    .eq("volunteer_user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (existingInterest) {
    redirect(
      `/opportunities/${opportunity.id}?message=${encodeURIComponent(
        "You have already expressed interest in this role."
      )}`
    );
  }

  const { data: volunteerProfile } = await supabase
    .from("volunteer_profiles")
    .select(
      "city,goals,interests,skills,support_needs,share_accessibility_needs,preferred_contact_method"
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const shareSupportNeeds =
    volunteerProfile?.share_accessibility_needs === true;

  const preferredContactMethod = normalisePreferredContactMethod(
    volunteerProfile?.preferred_contact_method
  );

  const { error } = await supabase.from("opportunity_interests").insert({
    opportunity_id: opportunity.id,
    organisation_user_id: opportunity.organisation_user_id,
    volunteer_user_id: user.id,
    volunteer_name:
      profile?.full_name ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null),
    volunteer_email: profile?.email || user.email || null,
    volunteer_city: volunteerProfile?.city || null,
    volunteer_goals: volunteerProfile?.goals || [],
    volunteer_interests: volunteerProfile?.interests || [],
    volunteer_skills: volunteerProfile?.skills || [],
    volunteer_support_shared: shareSupportNeeds,
    volunteer_support_needs: shareSupportNeeds
      ? volunteerProfile?.support_needs || null
      : null,
    volunteer_preferred_contact_method: preferredContactMethod,
    message: message || null,
    status: "new",
    updated_at: new Date().toISOString()
  });

  if (error) {
    redirect(
      `/opportunities/${opportunity.id}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(
    `/opportunities/${opportunity.id}?message=${encodeURIComponent(
      "Interest sent. The organisation can now see that you are interested."
    )}`
  );
}

export async function removeInterestFromOpportunity(formData: FormData) {
  const { supabase, user } = await requireVolunteerUser();

  const interestId = String(formData.get("interest_id") || "").trim();
  const opportunityId = String(formData.get("opportunity_id") || "").trim();

  if (!interestId || !opportunityId) {
    redirect("/opportunities");
  }

  const { data: interest } = await supabase
    .from("opportunity_interests")
    .select("id,volunteer_user_id,opportunity_id")
    .eq("id", interestId)
    .eq("volunteer_user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle<InterestOwner>();

  if (!interest) {
    redirect(`/opportunities/${opportunityId}`);
  }

  const { error } = await supabase
    .from("opportunity_interests")
    .delete()
    .eq("id", interest.id)
    .eq("volunteer_user_id", user.id);

  if (error) {
    redirect(
      `/opportunities/${opportunityId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(
    `/opportunities/${opportunityId}?message=${encodeURIComponent(
      "Interest removed. The organisation will no longer see this interest."
    )}`
  );
}
