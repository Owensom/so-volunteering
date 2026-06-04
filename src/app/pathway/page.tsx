import Link from "next/link";
import { redirect } from "next/navigation";
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
    value === "high_contrast"
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
  return "SO default";
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
      goalsComplete: false,
      interestsComplete: false,
      skillsComplete: false,
      accessibilityComplete: false,
      availabilityComplete: false
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
    availabilityComplete
  ];

  const completedSteps = steps.filter(Boolean).length;
  const totalSteps = steps.length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);

  return {
    completedSteps,
    totalSteps,
    percentage,
    goalsComplete,
    interestsComplete,
    skillsComplete,
    accessibilityComplete,
    availabilityComplete
  };
}

function PathwayStepCard({
  complete,
  icon,
  step,
  title,
  description,
  simpleDescription,
  href,
  simpleView
}: {
  complete: boolean;
  icon: string;
  step: string;
  title: string;
  description: string;
  simpleDescription: string;
  href: string;
  simpleView: boolean;
}) {
  return (
    <Link href={href} className="info-card dashboard-pathway-card">
      <div className="dashboard-card-icon" aria-hidden="true">
        {complete ? "✅" : icon}
      </div>

      <div className="dashboard-card-copy">
        <div className="dashboard-card-main">
          <p className="dashboard-card-label">
            {complete ? `${step} complete` : `${step} to do`}
          </p>
          <h2>{title}</h2>
          <p>{simpleView ? simpleDescription : description}</p>
        </div>

        <span className="dashboard-card-action-pill">
          {complete ? "Review this step" : "Continue this step"}
        </span>
      </div>
    </Link>
  );
}

export default async function PathwayPage() {
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
    .single<Profile>();

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
      "city,goals,interests,skills,support_needs,share_accessibility_needs,wants_wellbeing_support,accessibility_completed,availability_notes,preferred_contact_method,onboarding_completed"
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const { data: preferences } = await supabase
    .from("volunteer_preferences")
    .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerPreferences>();

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";

  const displayName = profile?.full_name?.trim() || "there";
  const progress = getVolunteerProgress(volunteerProfile);

  const listenText = simpleView
    ? "You are on your pathway page. This page shows five setup steps. Each card says complete or to do. Open a card to review or finish that step. Use Dashboard to go back."
    : "You are on your SO Volunteering pathway page. It shows your five profile setup steps: goals, interests, skills, wellbeing and support, and availability. First, check the Progress card on the right to see how many steps are complete. Each card below says whether the step is complete or still to do. You can select any card to review or update that part of your profile. Use View my profile to see your full profile summary, or Back to dashboard to return home.";

  const shellClassName = [
    "dashboard-bg",
    getThemeClass(colourTheme),
    getTextClass(textSize),
    getViewClass(viewMode)
  ].join(" ");

  return (
    <main className={shellClassName}>
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/dashboard"
            className="dashboard-brand"
            aria-label="Back to SO Volunteering dashboard"
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

            <Link
              href="/dashboard"
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
          className="dashboard-welcome-card"
          aria-labelledby="pathway-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Your pathway</p>

            <h1 id="pathway-title" className="dashboard-title">
              <span aria-hidden="true">{avatarIcon}</span>
              <span>Pathway progress</span>
            </h1>

            <p className="dashboard-lead">
              {simpleView
                ? `Hi ${displayName}. Check your five setup steps.`
                : `Hi ${displayName}. This page shows your volunteering pathway setup. You can review or update each step whenever you need to.`}
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/profile"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">👤</span>
                  <span>View my profile</span>
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🏠</span>
                  <span>Back to dashboard</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Pathway progress">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {avatarIcon}
              </span>
              <div>
                <h2>Progress</h2>
                <p>
                  {progress.completedSteps} of {progress.totalSteps} steps
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

            <p className="dashboard-progress-note">
              Account type: <strong>{userType}</strong>
            </p>

            {detailedView ? (
              <p className="dashboard-progress-note">
                App view: <strong>{getViewLabel(viewMode)}</strong> · Theme:{" "}
                <strong>{getThemeLabel(colourTheme)}</strong>
              </p>
            ) : null}
          </aside>
        </section>

        <section className="dashboard-grid" aria-label="Pathway steps">
          <PathwayStepCard
            complete={progress.goalsComplete}
            icon="🌱"
            step="Step 1"
            title="Goals"
            description="What you want to achieve through volunteering."
            simpleDescription="What you want to achieve."
            href="/onboarding/volunteer"
            simpleView={simpleView}
          />

          <PathwayStepCard
            complete={progress.interestsComplete}
            icon="💚"
            step="Step 2"
            title="Interests"
            description="What you enjoy or might like to try."
            simpleDescription="What you enjoy."
            href="/onboarding/volunteer/interests"
            simpleView={simpleView}
          />

          <PathwayStepCard
            complete={progress.skillsComplete}
            icon="⭐"
            step="Step 3"
            title="Skills"
            description="What you can do or would like to build."
            simpleDescription="What you can do."
            href="/onboarding/volunteer/skills"
            simpleView={simpleView}
          />

          <PathwayStepCard
            complete={progress.accessibilityComplete}
            icon="💛"
            step="Step 4"
            title="Wellbeing and support"
            description="Things that help you feel safe, comfortable and included."
            simpleDescription="What helps you feel comfortable."
            href="/onboarding/volunteer/accessibility"
            simpleView={simpleView}
          />

          <PathwayStepCard
            complete={progress.availabilityComplete}
            icon="📅"
            step="Step 5"
            title="Availability"
            description="When and how often volunteering might work for you."
            simpleDescription="When you can help."
            href="/onboarding/volunteer/availability"
            simpleView={simpleView}
          />

          {!simpleView ? (
            <article className="info-card dashboard-pathway-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                🔎
              </div>

              <div className="dashboard-card-copy">
                <div className="dashboard-card-main">
                  <p className="dashboard-card-label">Coming soon</p>
                  <h2>Opportunity matching</h2>
                  <p>
                    Your pathway helps match you with inclusive volunteering
                    opportunities.
                  </p>
                </div>

                <p className="dashboard-muted-action pathway-muted-action">
                  Not live yet
                </p>
              </div>
            </article>
          ) : null}
        </section>
      </section>

      <style>{`
        .dashboard-grid {
          align-items: stretch;
        }

        .dashboard-pathway-card {
          height: 100%;
          min-height: 220px;
          align-items: stretch;
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
          text-decoration: none;
          box-shadow: 0 10px 24px rgba(33, 56, 48, 0.07);
        }

        .dashboard-pathway-card:hover .dashboard-card-action-pill {
          border-color: rgba(83, 111, 99, 0.34);
          background: rgba(244, 255, 249, 0.96);
        }

        .pathway-muted-action {
          margin-top: auto !important;
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
          min-height: 235px;
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

        @media (max-width: 640px) {
          .dashboard-pathway-card,
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

          .preference-text-large {
            font-size: 1.03rem;
          }
        }
      `}</style>
    </main>
  );
}
