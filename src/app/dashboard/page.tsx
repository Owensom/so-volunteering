import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

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
  wants_wellbeing_support: boolean | null;
  accessibility_completed: boolean | null;
  availability_notes: string | null;
  preferred_contact_method: string | null;
  onboarding_completed: boolean | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
};

type InterestSummary = {
  status: string;
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
    status === "new" ||
    status === "contacted" ||
    status === "accepted" ||
    status === "closed"
  ) {
    return status;
  }

  if (status === "review" || status === "reviewed") {
    return "contacted";
  }

  return "new";
}

function hasArrayValue(value: string[] | null | undefined) {
  return Array.isArray(value) && value.length > 0;
}

function hasTextValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function getVolunteerProgress(volunteerProfile: VolunteerProfile | null) {
  if (!volunteerProfile) {
    return {
      completedSteps: 0,
      totalSteps: 5,
      percentage: 0,
      nextStepHref: "/onboarding/volunteer",
      nextStepLabel: "Start setup",
      nextStepIcon: "🌱",
      nextStepText: "Start with your goals and nearest town or city.",
    };
  }

  const goalsComplete =
    hasTextValue(volunteerProfile.city) && hasArrayValue(volunteerProfile.goals);

  const interestsComplete = hasArrayValue(volunteerProfile.interests);
  const skillsComplete = hasArrayValue(volunteerProfile.skills);

  const accessibilityComplete =
    volunteerProfile.accessibility_completed === true ||
    hasTextValue(volunteerProfile.support_needs) ||
    volunteerProfile.share_accessibility_needs === true ||
    volunteerProfile.wants_wellbeing_support === true;

  const availabilityComplete =
    volunteerProfile.onboarding_completed === true ||
    hasTextValue(volunteerProfile.availability_notes) ||
    hasTextValue(volunteerProfile.preferred_contact_method);

  const steps = [
    goalsComplete,
    interestsComplete,
    skillsComplete,
    accessibilityComplete,
    availabilityComplete,
  ];

  const completedSteps = steps.filter(Boolean).length;
  const totalSteps = steps.length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);

  if (!goalsComplete) {
    return {
      completedSteps,
      totalSteps,
      percentage,
      nextStepHref: "/onboarding/volunteer",
      nextStepLabel: "Continue goals",
      nextStepIcon: "🌱",
      nextStepText: "Tell us what you would like to achieve.",
    };
  }

  if (!interestsComplete) {
    return {
      completedSteps,
      totalSteps,
      percentage,
      nextStepHref: "/onboarding/volunteer/interests",
      nextStepLabel: "Continue interests",
      nextStepIcon: "💚",
      nextStepText: "Choose what you enjoy or might like to try.",
    };
  }

  if (!skillsComplete) {
    return {
      completedSteps,
      totalSteps,
      percentage,
      nextStepHref: "/onboarding/volunteer/skills",
      nextStepLabel: "Continue skills",
      nextStepIcon: "⭐",
      nextStepText: "Choose skills you have or want to build.",
    };
  }

  if (!accessibilityComplete) {
    return {
      completedSteps,
      totalSteps,
      percentage,
      nextStepHref: "/onboarding/volunteer/accessibility",
      nextStepLabel: "Continue support",
      nextStepIcon: "💛",
      nextStepText: "Choose anything that helps you feel comfortable and safe.",
    };
  }

  if (!availabilityComplete) {
    return {
      completedSteps,
      totalSteps,
      percentage,
      nextStepHref: "/onboarding/volunteer/availability",
      nextStepLabel: "Continue availability",
      nextStepIcon: "📅",
      nextStepText: "Tell us when volunteering might work for you.",
    };
  }

  return {
    completedSteps,
    totalSteps,
    percentage: 100,
    nextStepHref: "/opportunities",
    nextStepLabel: "Best roles for me",
    nextStepIcon: "🔎",
    nextStepText:
      "Your pathway profile is ready. You can now browse your best-matching published opportunities.",
  };
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

export default async function DashboardPage() {
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

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  const { data: volunteerProfile } = await supabase
    .from("volunteer_profiles")
    .select(
      "city,goals,interests,skills,support_needs,share_accessibility_needs,wants_wellbeing_support,accessibility_completed,availability_notes,preferred_contact_method,onboarding_completed",
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const { data: preferences } = await supabase
    .from("volunteer_preferences")
    .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerPreferences>();

  const { data: interests } = await supabase
    .from("opportunity_interests")
    .select("status")
    .eq("volunteer_user_id", user.id);

  const interestRows = (interests as InterestSummary[] | null) ?? [];

  const newInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "new",
  ).length;

  const contactedInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "contacted",
  ).length;

  const acceptedInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "accepted",
  ).length;

  const closedInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "closed",
  ).length;

  const activeInterestCount =
    newInterestCount + contactedInterestCount + acceptedInterestCount;

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const displayName =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "there";

  const progress = getVolunteerProgress(volunteerProfile);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";

  const listenText = simpleView
    ? "You are on your SO Volunteering dashboard. This is your home page. First, check your progress. Then use the main button to continue. You can open your Positive Pathway CV, find your best roles, check your saved roles, view your profile, change your app settings, or get help using the app."
    : "You are on your SO Volunteering dashboard. This is your home base. First, check the Profile progress card on the right to see how many setup steps are complete. Use the main button near the top to continue your next step, or to open Best roles for me if your setup is complete. Open Positive Pathway CV shows your strengths-based volunteering CV. Use the Roles I am interested in button to track roles where you clicked I’m interested. The cards below give quick links. Best roles for me opens published volunteering roles sorted by match. View my profile opens your saved details. See my pathway shows all setup steps and positive reviews. Wellbeing and support lets you review what helps you feel comfortable. Roles I am interested in shows roles you have saved and their current status. Personalise my app lets you choose view mode, colour theme, text size, avatar and Listen preference. Help using the app is for getting help if you are stuck, something is not working, or you want to report a problem with SO Volunteering.";

  const shellClassName = [
    "dashboard-bg",
    getThemeClass(colourTheme),
    getTextClass(textSize),
    getViewClass(viewMode),
  ].join(" ");

  return (
    <main className={shellClassName}>
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/dashboard"
            className="dashboard-brand"
            aria-label="SO Volunteering dashboard"
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

          <div className="dashboard-topbar-actions">
            {listenMode === "always" || listenMode === "context" ? (
              <InclusiveAudioButton text={listenText} />
            ) : null}

            <form action={signOut}>
              <button
                type="submit"
                className="secondary-button dashboard-signout-button"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🚪</span>
                  <span>Sign out</span>
                </span>
              </button>
            </form>
          </div>
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="dashboard-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Your home base</p>

            <h1 id="dashboard-title" className="dashboard-title">
              <span aria-hidden="true">{avatarIcon}</span>
              <span>Welcome, {displayName}</span>
            </h1>

            <p className="dashboard-lead">
              {simpleView
                ? "Choose what you want to do next."
                : "Your volunteering journey is ready. Use this dashboard to continue your pathway, open your Positive Pathway CV, track your interests and browse your best-matching opportunities."}
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href={progress.nextStepHref}
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">{progress.nextStepIcon}</span>
                  <span>{progress.nextStepLabel}</span>
                </span>
              </Link>

              <Link
                href="/pathway/cv"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📄</span>
                  <span>Positive Pathway CV</span>
                </span>
              </Link>

              <Link
                href="/my-interests"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📬</span>
                  <span>Roles I am interested in</span>
                </span>
              </Link>

              <Link href="/help" className="secondary-button dashboard-main-action">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🧭</span>
                  <span>Help using the app</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Profile progress">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {avatarIcon}
              </span>
              <div>
                <h2>Profile progress</h2>
                <p>
                  {progress.completedSteps} of {progress.totalSteps || 5} steps
                  complete.
                </p>
              </div>
            </div>

            <div className="progress-wrap dashboard-progress-wrap">
              <div className="progress-meta">
                <span>
                  {progress.percentage === 100 ? "Complete" : "In progress"}
                </span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span
                  className="progress-fill"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            <p className="dashboard-progress-note">{progress.nextStepText}</p>

            <div className="dashboard-interest-status-mini">
              <p className="dashboard-progress-note">
                Active interests: <strong>{activeInterestCount}</strong>
              </p>
              <p className="dashboard-progress-note">
                New: <strong>{newInterestCount}</strong> · Contacted:{" "}
                <strong>{contactedInterestCount}</strong>
              </p>
              <p className="dashboard-progress-note">
                Accepted: <strong>{acceptedInterestCount}</strong> · Closed:{" "}
                <strong>{closedInterestCount}</strong>
              </p>
            </div>

            {detailedView ? (
              <p className="dashboard-progress-note">
                App view: <strong>{getViewLabel(viewMode)}</strong> · Theme:{" "}
                <strong>{getThemeLabel(colourTheme)}</strong>
              </p>
            ) : null}
          </aside>
        </section>

        <section className="dashboard-grid" aria-label="Dashboard actions">
          <Link
            href="/opportunities"
            className="info-card dashboard-pathway-card best-roles-card"
          >
            <div className="dashboard-card-icon" aria-hidden="true">
              🔎
            </div>
            <div className="dashboard-card-copy">
              <div className="dashboard-card-main">
                <p className="dashboard-card-label">Matched roles</p>
                <h2>Best roles for me</h2>
                <p>
                  {simpleView
                    ? "Find volunteering roles."
                    : "Browse published volunteering roles sorted by the strongest links to your profile, interests, skills and preferences."}
                </p>
              </div>
              <span className="dashboard-card-action-pill">Open best roles</span>
            </div>
          </Link>

          <Link
            href="/pathway/cv"
            className="info-card dashboard-pathway-card positive-cv-card"
          >
            <div className="dashboard-card-icon" aria-hidden="true">
              📄
            </div>
            <div className="dashboard-card-copy">
              <div className="dashboard-card-main">
                <p className="dashboard-card-label">Positive pathway</p>
                <h2>Positive Pathway CV</h2>
                <p>
                  {simpleView
                    ? "See your strengths and feedback."
                    : "View your strengths-based volunteering CV, including goals, skills and positive feedback shared by organisations."}
                </p>
              </div>
              <span className="dashboard-card-action-pill">Open CV</span>
            </div>
          </Link>

          <Link href="/my-interests" className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              📬
            </div>
            <div className="dashboard-card-copy">
              <div className="dashboard-card-main">
                <p className="dashboard-card-label">Track roles</p>
                <h2>Roles I am interested in</h2>
                <p>
                  {simpleView
                    ? "Track roles you saved."
                    : "See roles where you clicked “I’m interested” and track whether they are new, contacted, accepted or closed."}
                </p>
              </div>
              <span className="dashboard-card-action-pill">
                Open interested roles
              </span>
            </div>
          </Link>

          <Link href="/profile" className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              👤
            </div>
            <div className="dashboard-card-copy">
              <div className="dashboard-card-main">
                <p className="dashboard-card-label">Your details</p>
                <h2>View my profile</h2>
                <p>
                  {simpleView
                    ? "See your saved profile."
                    : "Review your goals, interests, skills, support preferences and availability."}
                </p>
              </div>
              <span className="dashboard-card-action-pill">Open profile</span>
            </div>
          </Link>

          <Link href="/pathway" className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🧭
            </div>
            <div className="dashboard-card-copy">
              <div className="dashboard-card-main">
                <p className="dashboard-card-label">Your progress</p>
                <h2>See my pathway</h2>
                <p>
                  {simpleView
                    ? "Check your setup steps."
                    : "View all five setup steps, positive reviews and update any section of your pathway."}
                </p>
              </div>
              <span className="dashboard-card-action-pill">Open pathway</span>
            </div>
          </Link>

          <Link
            href="/onboarding/volunteer/accessibility"
            className="info-card dashboard-pathway-card"
          >
            <div className="dashboard-card-icon" aria-hidden="true">
              💛
            </div>
            <div className="dashboard-card-copy">
              <div className="dashboard-card-main">
                <p className="dashboard-card-label">Support</p>
                <h2>Wellbeing and support</h2>
                <p>
                  {simpleView
                    ? "Review what helps you."
                    : "Review what helps you feel safe, comfortable and included."}
                </p>
              </div>
              <span className="dashboard-card-action-pill">Review support</span>
            </div>
          </Link>

          <Link
            href="/settings/personalise"
            className="info-card dashboard-pathway-card"
          >
            <div className="dashboard-card-icon" aria-hidden="true">
              {avatarIcon}
            </div>
            <div className="dashboard-card-copy">
              <div className="dashboard-card-main">
                <p className="dashboard-card-label">App settings</p>
                <h2>Personalise my app</h2>
                <p>
                  {simpleView
                    ? "Change your app view."
                    : "Choose your view mode, colour theme, text size, avatar and Listen preference."}
                </p>
              </div>
              <span className="dashboard-card-action-pill">Open settings</span>
            </div>
          </Link>

          <Link href="/help" className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🧭
            </div>
            <div className="dashboard-card-copy">
              <div className="dashboard-card-main">
                <p className="dashboard-card-label">App help</p>
                <h2>Help using the app</h2>
                <p>
                  {simpleView
                    ? "Get help if you are stuck."
                    : "Get help if you are stuck, something is not working, or you want to report a problem with SO Volunteering."}
                </p>
              </div>
              <span className="dashboard-card-action-pill">Open help page</span>
            </div>
          </Link>
        </section>
      </section>

      <style>{`
        .dashboard-grid {
          align-items: stretch;
        }

        .dashboard-pathway-card {
          height: 100%;
          align-items: stretch;
        }

        .best-roles-card,
        .positive-cv-card {
          border-color: rgba(143, 178, 158, 0.3);
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.82), rgba(255, 255, 255, 0.94));
        }

        .dashboard-interest-status-mini {
          display: grid;
          gap: 6px;
          margin-top: 4px;
          padding-top: 10px;
          border-top: 1px solid rgba(83, 111, 99, 0.12);
        }

        .dashboard-interest-status-mini .dashboard-progress-note {
          margin: 0;
        }

        .dashboard-card-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .dashboard-card-main {
          display: grid;
          gap: 8px;
        }

        .dashboard-card-main h2 {
          margin-bottom: 0;
        }

        .dashboard-card-main p {
          margin: 0;
        }

        .dashboard-card-action-pill {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          margin-top: auto;
          padding: 10px 16px;
          border: 1px solid rgba(83, 111, 99, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.88);
          color: #536f63;
          font-size: 0.94rem;
          font-weight: 900;
          line-height: 1.15;
          box-shadow: 0 10px 24px rgba(33, 56, 48, 0.07);
        }

        .dashboard-pathway-card:hover .dashboard-card-action-pill {
          border-color: rgba(83, 111, 99, 0.34);
          background: rgba(244, 255, 249, 0.96);
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .dashboard-card-copy p,
        .preference-text-large .dashboard-progress-note {
          font-size: 1.04em;
        }

        .preference-text-large .dashboard-title {
          letter-spacing: -0.035em;
        }

        .preference-view-simple .dashboard-grid {
          gap: 18px;
        }

        .preference-view-simple .dashboard-pathway-card {
          min-height: 190px;
        }

        .preference-view-simple .dashboard-card-icon {
          font-size: 2rem;
        }

        .preference-view-detailed .dashboard-pathway-card {
          min-height: 230px;
        }

        .preference-theme-calm_green {
          background:
            radial-gradient(circle at top left, rgba(200, 243, 221, 0.58), transparent 34%),
            linear-gradient(135deg, #f3fff8 0%, #f7fbf5 46%, #fffaf2 100%);
        }

        .preference-theme-calm_green .dashboard-welcome-card,
        .preference-theme-calm_green .info-card,
        .preference-theme-calm_green .dashboard-progress-card {
          border-color: rgba(83, 111, 99, 0.2);
        }

        .preference-theme-calm_green .dashboard-card-icon,
        .preference-theme-calm_green .dashboard-progress-icon {
          background: rgba(226, 255, 239, 0.86);
        }

        .preference-theme-soft_blue {
          background:
            radial-gradient(circle at top left, rgba(197, 226, 255, 0.62), transparent 34%),
            linear-gradient(135deg, #f3f9ff 0%, #f8fbff 48%, #fffaf2 100%);
        }

        .preference-theme-soft_blue .dashboard-welcome-card,
        .preference-theme-soft_blue .info-card,
        .preference-theme-soft_blue .dashboard-progress-card {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .preference-theme-soft_blue .dashboard-card-icon,
        .preference-theme-soft_blue .dashboard-progress-icon {
          background: rgba(231, 244, 255, 0.92);
        }

        .preference-theme-warm_peach {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.58), transparent 34%),
            linear-gradient(135deg, #fff8f1 0%, #fffaf6 48%, #f7fff8 100%);
        }

        .preference-theme-warm_peach .dashboard-welcome-card,
        .preference-theme-warm_peach .info-card,
        .preference-theme-warm_peach .dashboard-progress-card {
          border-color: rgba(190, 118, 76, 0.2);
        }

        .preference-theme-warm_peach .dashboard-card-icon,
        .preference-theme-warm_peach .dashboard-progress-icon {
          background: rgba(255, 239, 226, 0.92);
        }

        .preference-theme-high_contrast {
          background: #f8fafc;
        }

        .preference-theme-high_contrast .dashboard-welcome-card,
        .preference-theme-high_contrast .info-card,
        .preference-theme-high_contrast .dashboard-progress-card {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2 {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-card-copy p,
        .preference-theme-high_contrast .dashboard-progress-note {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-card-icon,
        .preference-theme-high_contrast .dashboard-progress-icon {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-card-action-pill {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
        }

        .preference-theme-neon_arcade {
          background:
            radial-gradient(circle at top left, rgba(34, 211, 238, 0.28), transparent 34%),
            radial-gradient(circle at top right, rgba(217, 70, 239, 0.24), transparent 30%),
            linear-gradient(135deg, #101827 0%, #15132c 46%, #071827 100%);
        }

        .preference-theme-neon_arcade .dashboard-welcome-card,
        .preference-theme-neon_arcade .dashboard-progress-card,
        .preference-theme-neon_arcade .info-card {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .best-roles-card,
        .preference-theme-neon_arcade .positive-cv-card {
          border-color: rgba(167, 243, 208, 0.5);
          background:
            radial-gradient(circle at top left, rgba(34, 211, 238, 0.18), transparent 55%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(49, 46, 129, 0.88));
        }

        .preference-theme-neon_arcade .dashboard-interest-status-mini {
          border-top-color: rgba(34, 211, 238, 0.28);
        }

        .preference-theme-neon_arcade .dashboard-title,
        .preference-theme-neon_arcade .dashboard-card-copy h2,
        .preference-theme-neon_arcade .dashboard-progress-card h2,
        .preference-theme-neon_arcade .dashboard-progress-note strong,
        .preference-theme-neon_arcade .progress-meta {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-card-label,
        .preference-theme-neon_arcade .dashboard-card-copy p,
        .preference-theme-neon_arcade .dashboard-progress-note {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-card-icon,
        .preference-theme-neon_arcade .dashboard-progress-icon {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .dashboard-card-action-pill {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow:
            0 10px 24px rgba(0, 0, 0, 0.24),
            inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .dashboard-pathway-card:hover .dashboard-card-action-pill {
          border-color: rgba(167, 243, 208, 0.76);
          background: rgba(34, 211, 238, 0.18);
        }

        .preference-theme-neon_arcade .progress-track {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(34, 211, 238, 0.28);
        }

        .preference-theme-neon_arcade .progress-fill {
          background: linear-gradient(90deg, #22d3ee, #a7f3d0, #d946ef);
        }

        @media (max-width: 640px) {
          .preference-text-large {
            font-size: 1.03rem;
          }

          .preference-view-simple .dashboard-pathway-card,
          .preference-view-detailed .dashboard-pathway-card {
            min-height: 0;
          }

          .dashboard-card-copy {
            gap: 14px;
          }

          .dashboard-card-action-pill {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
