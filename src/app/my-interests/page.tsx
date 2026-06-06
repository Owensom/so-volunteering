import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { removeInterest } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
};

type InterestRow = {
  id: string;
  opportunity_id: string;
  organisation_user_id: string;
  message: string | null;
  status: string;
  created_at: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  summary: string;
  location_type: string;
  location: string | null;
  time_commitment: string | null;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseViewMode(value: string | null | undefined) {
  if (value === "simple" || value === "detailed") return value;
  return "standard";
}

function normaliseColourTheme(value: string | null | undefined) {
  if (
    value === "calm_green" ||
    value === "soft_blue" ||
    value === "warm_peach" ||
    value === "high_contrast" ||
    value === "neon_arcade"
  ) {
    return value;
  }

  return "default";
}

function normaliseTextSize(value: string | null | undefined) {
  return value === "large" ? "large" : "standard";
}

function normaliseAvatarIcon(value: string | null | undefined) {
  return value && value.trim() ? value : "🌱";
}

function normaliseListenMode(value: string | null | undefined) {
  return value === "context" ? "context" : "always";
}

function normaliseInterestStatus(status: string | null | undefined) {
  if (
    status === "contacted" ||
    status === "accepted" ||
    status === "closed" ||
    status === "new"
  ) {
    return status;
  }

  if (status === "reviewed") {
    return "contacted";
  }

  return "new";
}

function getThemeClass(colourTheme: string) {
  return `preference-theme-${colourTheme}`;
}

function getTextClass(textSize: string) {
  return textSize === "large"
    ? "preference-text-large"
    : "preference-text-standard";
}

function getViewClass(viewMode: string) {
  return `preference-view-${viewMode}`;
}

function getViewLabel(viewMode: string) {
  if (viewMode === "simple") return "Simple view";
  if (viewMode === "detailed") return "Detailed view";
  return "Standard view";
}

function getThemeLabel(colourTheme: string) {
  if (colourTheme === "calm_green") return "Calm green";
  if (colourTheme === "soft_blue") return "Soft blue";
  if (colourTheme === "warm_peach") return "Warm peach";
  if (colourTheme === "high_contrast") return "High contrast";
  if (colourTheme === "neon_arcade") return "Neon arcade";
  return "SO default";
}

function formatStatus(status: string) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "Accepted";
  if (normalisedStatus === "contacted") return "Contacted";
  if (normalisedStatus === "closed") return "Closed";
  return "Sent";
}

function statusIcon(status: string) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "✅";
  if (normalisedStatus === "contacted") return "📬";
  if (normalisedStatus === "closed") return "🌙";
  return "🌱";
}

function statusHelp(status: string, simpleView: boolean) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") {
    return simpleView
      ? "The organisation would like to move forward."
      : "Good news. The organisation has marked your interest as accepted and would like to move forward with you.";
  }

  if (normalisedStatus === "contacted") {
    return simpleView
      ? "The organisation has contacted you."
      : "The organisation has marked this as contacted. Check your email or any contact method you shared.";
  }

  if (normalisedStatus === "closed") {
    return simpleView
      ? "This role is not progressing."
      : "This role is not progressing at the moment. This does not mean you did anything wrong. You can keep looking for another role that feels right.";
  }

  return simpleView
    ? "Sent to the organisation."
    : "Your interest has been sent to the organisation. They can review it and update the status.";
}

function statusToneClass(status: string) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "status-panel-accepted";
  if (normalisedStatus === "contacted") return "status-panel-contacted";
  if (normalisedStatus === "closed") return "status-panel-closed";
  return "status-panel-new";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

export default async function MyInterestsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";
  const successMessage = params.message ? decodeURIComponent(params.message) : "";

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

  const { data: preferences } = await supabase
    .from("volunteer_preferences")
    .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerPreferences>();

  const { data: interests } = await supabase
    .from("opportunity_interests")
    .select("id,opportunity_id,organisation_user_id,message,status,created_at")
    .eq("volunteer_user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (interests as InterestRow[] | null) ?? [];
  const opportunityIds = Array.from(
    new Set(rows.map((row) => row.opportunity_id)),
  );

  const { data: opportunities } = opportunityIds.length
    ? await supabase
        .from("opportunities")
        .select(
          "id,title,summary,location_type,location,time_commitment,status,contact_name,contact_email",
        )
        .in("id", opportunityIds)
    : { data: [] as OpportunityRow[] };

  const opportunityMap = new Map(
    ((opportunities as OpportunityRow[] | null) ?? []).map((opportunity) => [
      opportunity.id,
      opportunity,
    ]),
  );

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";

  const sentCount = rows.filter(
    (row) => normaliseInterest
