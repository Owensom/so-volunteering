import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

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
      nextStepText: "Start with your goals and nearest town or city."
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

  if (!goalsComplete) {
    return {
      completedSteps,
      totalSteps,
      percentage,
      nextStepHref: "/onboarding/volunteer",
      nextStepLabel: "Continue goals",
      nextStepIcon: "🌱",
      nextStepText: "Tell us what you would like to achieve."
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
      nextStepText: "Choose what you enjoy or might like to try."
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
      nextStepText: "Choose skills you have or want to build."
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
      nextStepText: "Choose anything that helps you feel comfortable and safe."
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
      nextStepText: "Tell us when volunteering might work for you."
    };
  }

  return {
    completedSteps,
    totalSteps,
    percentage: 100,
    nextStepHref: "/dashboard",
    nextStepLabel: "Profile setup complete",
    nextStepIcon: "✅",
    nextStepText: "Your pathway profile is ready. You can update it later."
  };
}

export default async function DashboardPage() {
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

  const { data: volunteerProfile } = await supabase
    .from("volunteer_profiles")
    .select(
      "city,goals,interests,skills,support_needs,share_accessibility_needs,wants_wellbeing_support,accessibility_completed,availability_notes,preferred_contact_method,onboarding_completed"
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const userType = profile?.user_type ?? "volunteer";
  const displayName = profile?.full_name?.trim() || "there";
  const isVolunteer = userType === "volunteer";
  const progress = isVolunteer
    ? getVolunteerProgress(volunteerProfile)
    : {
        completedSteps: 0,
        totalSteps: 0,
        percentage: 100,
        nextStepHref: "/dashboard",
        nextStepLabel: "Dashboard ready",
        nextStepIcon: "🏢",
        nextStepText: "Your organisation dashboard is ready."
      };

  const listenText =
    "This is your SO Volunteering dashboard. At the top is the SO Volunteering logo, the Listen support, and a Sign out button. The main welcome panel tells you your next step. Your profile progress shows how much of your setup is complete. Below it are pathway cards. The first card is Your profile. The second card is Opportunities. The third card is Wellbeing.";

  return (
    <main className="dashboard-bg">
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
            <InclusiveAudioButton text={listenText} />

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
            <p className="dashboard-kicker">Your inclusive pathway</p>

            <h1 id="dashboard-title" className="dashboard-title">
              <span aria-hidden="true">👋</span>
              <span>Welcome, {displayName}</span>
            </h1>

            <p className="dashboard-lead">
              Your volunteering journey is ready. Keep building your profile,
              tell us what support helps you, and move towards opportunities
              that feel right for you.
            </p>

            {isVolunteer ? (
              <div className="dashboard-primary-actions">
                {progress.percentage < 100 ? (
                  <Link
                    href={progress.nextStepHref}
                    className="primary-button dashboard-main-action"
                  >
                    <span className="dashboard-button-inner">
                      <span aria-hidden="true">{progress.nextStepIcon}</span>
                      <span>{progress.nextStepLabel}</span>
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="primary-button dashboard-main-action"
                  >
                    <span className="dashboard-button-inner">
                      <span aria-hidden="true">✅</span>
                      <span>Profile complete</span>
                    </span>
                  </Link>
                )}

                <a
                  href="#pathway-cards"
                  className="secondary-button dashboard-main-action"
                >
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">🧭</span>
                    <span>See my pathway</span>
                  </span>
                </a>
              </div>
            ) : (
              <div className="dashboard-primary-actions">
                <a
                  href="#pathway-cards"
                  className="primary-button dashboard-main-action"
                >
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">🏢</span>
                    <span>View dashboard</span>
                  </span>
                </a>
              </div>
            )}
          </div>

          <aside className="dashboard-progress-card" aria-label="Profile progress">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
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
                <span>{progress.percentage === 100 ? "Complete" : "In progress"}</span>
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
          </aside>
        </section>

        <section
          id="pathway-cards"
          className="dashboard-grid"
          aria-label="Dashboard pathway cards"
        >
          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              👤
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Step 1</p>
              <h2>Your profile</h2>
              <p>
                Account type: <strong>{userType}</strong>
              </p>
              {profile?.email ? <p>{profile.email}</p> : null}

              {isVolunteer ? (
                <p className="card-action">
                  <Link href={progress.nextStepHref} className="text-link">
                    {progress.percentage === 100
                      ? "Review profile setup"
                      : progress.nextStepLabel}
                  </Link>
                </p>
              ) : null}
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🔎
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Step 2</p>
              <h2>Opportunities</h2>
              <p>
                Browse inclusive volunteering opportunities and start building
                verified experience.
              </p>
              <p className="dashboard-muted-action">Coming soon</p>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              💛
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Always available</p>
              <h2>Wellbeing</h2>
              <p>
                Support and safety features are built into the platform from the
                start.
              </p>
              <p className="dashboard-muted-action">Support-first design</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
