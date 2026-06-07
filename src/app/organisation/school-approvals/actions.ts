"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

type SchoolProfile = {
  user_id: string;
  organisation_name: string | null;
  organisation_type: string | null;
};

type OrganisationProfile = {
  user_id: string;
  organisation_name: string | null;
  organisation_type: string | null;
};

type OpportunityOwner = {
  id: string;
  organisation_user_id: string;
};

type ApprovalStatus = "draft" | "approved" | "paused" | "declined";

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseApprovalStatus(value: string | null | undefined): ApprovalStatus {
  if (value === "approved") return "approved";
  if (value === "paused") return "paused";
  if (value === "declined") return "declined";
  return "draft";
}

function getText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function redirectWithError(message: string) {
  redirect(
    `/organisation/school-approvals?error=${encodeURIComponent(message)}`,
  );
}

function redirectWithMessage(message: string) {
  redirect(
    `/organisation/school-approvals?message=${encodeURIComponent(message)}`,
  );
}

async function requireSchoolOrganisationUser() {
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

  if (userType !== "organisation") {
    redirect("/dashboard");
  }

  const { data: schoolProfile } = await supabase
    .from("organisation_profiles")
    .select("user_id,organisation_name,organisation_type")
    .eq("user_id", user.id)
    .maybeSingle<SchoolProfile>();

  if (schoolProfile?.organisation_type !== "school_college") {
    redirect("/organisation/dashboard");
  }

  return {
    supabase,
    user,
    schoolProfile,
  };
}

function buildApprovalPayload(formData: FormData) {
  return {
    approval_status: normaliseApprovalStatus(getText(formData, "approval_status")),
    approval_notes: getText(formData, "approval_notes") || null,
    approval_conditions: getText(formData, "approval_conditions") || null,

    s5_s6_only: getBoolean(formData, "s5_s6_only"),
    duke_of_edinburgh_only: getBoolean(formData, "duke_of_edinburgh_only"),
    parent_carer_consent_required: getBoolean(
      formData,
      "parent_carer_consent_required",
    ),
    school_supervised_only: getBoolean(formData, "school_supervised_only"),
    safeguarding_check_review_required: getBoolean(
      formData,
      "safeguarding_check_review_required",
    ),
    no_lone_working: getBoolean(formData, "no_lone_working"),
    no_home_visits: getBoolean(formData, "no_home_visits"),
    no_money_handling: getBoolean(formData, "no_money_handling"),
    no_personal_care: getBoolean(formData, "no_personal_care"),
    daytime_only: getBoolean(formData, "daytime_only"),
  };
}

export async function saveOrganisationApproval(formData: FormData) {
  const { supabase, user } = await requireSchoolOrganisationUser();

  const approvedOrganisationUserId = getText(
    formData,
    "approved_organisation_user_id",
  );

  if (!approvedOrganisationUserId) {
    redirectWithError("Choose an organisation to approve.");
  }

  if (approvedOrganisationUserId === user.id) {
    redirectWithError("A school cannot approve itself.");
  }

  const { data: targetOrganisation } = await supabase
    .from("organisation_profiles")
    .select("user_id,organisation_name,organisation_type")
    .eq("user_id", approvedOrganisationUserId)
    .maybeSingle<OrganisationProfile>();

  if (!targetOrganisation) {
    redirectWithError("That organisation could not be found.");
  }

  if (targetOrganisation.organisation_type === "school_college") {
    redirectWithError("Schools cannot approve another school in this dashboard.");
  }

  const payload = buildApprovalPayload(formData);

  const { error } = await supabase
    .from("school_approval_organisations")
    .upsert(
      {
        school_user_id: user.id,
        approved_organisation_user_id: approvedOrganisationUserId,
        ...payload,
      },
      {
        onConflict: "school_user_id,approved_organisation_user_id",
      },
    );

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/organisation/school-approvals");
  redirectWithMessage("Organisation approval saved.");
}

export async function deleteOrganisationApproval(formData: FormData) {
  const { supabase, user } = await requireSchoolOrganisationUser();

  const approvalId = getText(formData, "approval_id");

  if (!approvalId) {
    redirectWithError("Approval record missing.");
  }

  const { error } = await supabase
    .from("school_approval_organisations")
    .delete()
    .eq("id", approvalId)
    .eq("school_user_id", user.id);

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/organisation/school-approvals");
  redirectWithMessage("Organisation approval removed.");
}

export async function saveOpportunityApproval(formData: FormData) {
  const { supabase, user } = await requireSchoolOrganisationUser();

  const opportunityId = getText(formData, "opportunity_id");

  if (!opportunityId) {
    redirectWithError("Choose an opportunity to approve.");
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,organisation_user_id")
    .eq("id", opportunityId)
    .maybeSingle<OpportunityOwner>();

  if (!opportunity) {
    redirectWithError("That opportunity could not be found.");
  }

  if (opportunity.organisation_user_id === user.id) {
    redirectWithError("A school cannot approve its own opportunity.");
  }

  const { data: targetOrganisation } = await supabase
    .from("organisation_profiles")
    .select("user_id,organisation_name,organisation_type")
    .eq("user_id", opportunity.organisation_user_id)
    .maybeSingle<OrganisationProfile>();

  if (!targetOrganisation) {
    redirectWithError("The opportunity organisation could not be found.");
  }

  if (targetOrganisation.organisation_type === "school_college") {
    redirectWithError("Schools cannot approve another school in this dashboard.");
  }

  const payload = buildApprovalPayload(formData);

  const { error } = await supabase
    .from("school_approval_opportunities")
    .upsert(
      {
        school_user_id: user.id,
        opportunity_id: opportunity.id,
        organisation_user_id: opportunity.organisation_user_id,
        ...payload,
      },
      {
        onConflict: "school_user_id,opportunity_id",
      },
    );

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/organisation/school-approvals");
  redirectWithMessage("Opportunity approval saved.");
}

export async function deleteOpportunityApproval(formData: FormData) {
  const { supabase, user } = await requireSchoolOrganisationUser();

  const approvalId = getText(formData, "approval_id");

  if (!approvalId) {
    redirectWithError("Approval record missing.");
  }

  const { error } = await supabase
    .from("school_approval_opportunities")
    .delete()
    .eq("id", approvalId)
    .eq("school_user_id", user.id);

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/organisation/school-approvals");
  redirectWithMessage("Opportunity approval removed.");
}
