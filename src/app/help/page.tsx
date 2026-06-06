import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { submitAppHelpRequest } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  full_name: string | null;
  email: string | null;
  user_type: string | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
};

type HelpCategory = {
  value: string;
  icon: string;
  title: string;
  description: string;
};

function normaliseUserType(value: string | null | undefined) {
  if (value?.trim().toLowerCase() === "organisation") {
    return "organisation";
  }

  return "volunteer";
}

function getDashboardHref(userType: string) {
  return userType === "organisation" ? "/organisation/dashboard" : "/dashboard";
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
  return value && value.trim() ? value : "🧭";
}

function normaliseListenMode(value: string | null | undefined) {
  return value === "context" ? "context" : "always";
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

const helpCategories: HelpCategory[] = [
  {
    value: "stuck_using_app",
    icon: "🧭",
    title: "I am stuck using the app",
    description: "You are not sure where to go or what to do next.",
  },
  {
    value: "something_not_working",
    icon: "🛠️",
    title: "Something is not working",
    description: "A page, button, form or link is not working as expected.",
  },
  {
    value: "account_or_profile",
    icon: "👤",
    title: "I need help with my account or profile",
    description:
      "You need help with login, setup, profile details or contact information.",
  },
  {
    value: "opportunity_help",
    icon: "📣",
    title: "I need help with an opportunity",
    description:
      "You need help with a volunteering role, interest, or role information.",
  },
  {
    value: "report_problem",
    icon: "⚠️",
    title: "I want to report a problem",
    description:
      "Something looks wrong, confusing, inappropriate or unsafe in the app.",
  },
  {
    value: "safety_or_safeguarding",
    icon: "🛡️",
    title: "I have a safety or safeguarding concern",
    description: "Use this if your concern is serious or relates to safety.",
  },
];

export default async function HelpUsingAppPage({
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
    .select("full_name,email,user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);
  const dashboardHref = getDashboardHref(userType);

  const { data: preferences } =
    userType === "volunteer"
      ? await supabase
          .from("volunteer_preferences")
          .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
          .eq("user_id", user.id)
          .maybeSingle<VolunteerPreferences>()
      : { data: null as VolunteerPreferences | null };

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = userType === "volunteer" && viewMode === "simple";
  const detailedView = userType === "volunteer" && viewMode === "detailed";

  const displayName =
    profile?.full_name ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "there";

  const listenText = simpleView
    ? "This page is for help using the app. Choose one card, write a short message, then send. If someone is in immediate danger, contact emergency services first."
    : "This page is called Help using the app. It is for getting help if you are stuck, something is not working, or you want to report a problem with SO Volunteering. This is different from your personal support needs profile. Choose one help card, then write a short message about what happened. If someone is in immediate danger, contact emergency services first. This form is not monitored instantly.";

  const shellClassName =
    userType === "volunteer"
      ? [
          "dashboard-bg",
          "app-help-page",
          getThemeClass(colourTheme),
          getTextClass(textSize),
          getViewClass(viewMode),
        ].join(" ")
      : "dashboard-bg app-help-page";

  return (
    <main className={shellClassName}>
      <section className="dashboard-shell">
        <header className="dashboard-topbar app-help-topbar">
          <Link
            href={dashboardHref}
            className="dashboard-brand"
            aria-label="Back to dashboard"
          >
            <img
              src="/brand/so-volunteering-logo-mark.png"
              alt=""
              className="dashboard-brand-mark"
              aria-hidden="true"
            />
            <span className="dashboard-brand-text">
              <span className="dashboard-brand-name">SO Volunteering</span>
              <span className="dashboard-brand-tagline">
                Belong • Grow • Thrive
              </span>
            </span>
          </Link>

          <div className="dashboard-topbar-actions app-help-topbar-actions">
            {userType === "organisation" ||
            listenMode === "always" ||
            listenMode === "context" ? (
              <InclusiveAudioButton text={listenText} />
            ) : null}

            <Link
              href={dashboardHref}
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Dashboard</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card app-help-hero"
          aria-labelledby="help-title"
        >
          <div className="dashboard-welcome-copy app-help-hero-copy">
            <p className="dashboard-kicker">Help using the app</p>

            <h1 id="help-title" className="dashboard-title app-help-title">
              <span aria-hidden="true">
                {userType === "vol
