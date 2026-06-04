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

type InterestSummary = {
  status: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
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
    nextStepHref: "/opportunities",
    nextStepLabel: "Find opportunities",
    nextStepIcon: "🔎",
    nextStepText: "Your pathway profile is ready. You can now browse published opportunities."
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
      "city,goals,interests,skills,support_needs,share_accessibility_needs,wants_wellbeing_support,accessibility_completed,availability_notes,preferred_contact_method,onboarding_completed"
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const { data: interests } = await supabase
    .from("opportunity_interests")
    .select("status")
    .eq("volunteer_user_id", user.id);

  const interestRows = (interests as InterestSummary[] | null) ?? [];
  const activeInterestCount = interestRows.filter(
    (interest) => interest.status !== "closed"
  ).length;

  const displayName =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "there";

  const progress = getVolunteerProgress(volunteerProfile);

  const listenText =
    "This is your SO Volunteering dashboard. It is your quick home base. You can continue your next setup step, view your profile, see your pathway, review wellbeing support, browse published volunteering opportunities, and track roles you are interested in.";

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
            <p className="dashboard-kicker">Your home base</p>

            <h1 id="dashboard-title" className="dashboard-title">
              <span aria-hidden="true">👋</span>
              <span>Welcome, {displayName}</span>
            </h1>

            <p className="dashboard-lead">
              Your volunteering journey is ready. Use this dashboard to continue
              your pathway, view your profile and browse opportunities.
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
                href="/my-interests"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📬</span>
                  <span>Roles I am interested in</span>
                </span>
              </Link>
            </div>
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
            <p className="dashboard-progress-note">
              Active interested roles: <strong>{activeInterestCount}</strong>
            </p>
          </aside>
        </section>

        <section className="dashboard-grid" aria-label="Dashboard actions">
          <Link href="/profile" className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              👤
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Your details</p>
              <h2>View my profile</h2>
              <p>
                Review your goals, interests, skills, support preferences and
                availability.
              </p>
              <p className="card-action text-link">Open profile</p>
            </div>
          </Link>

          <Link href="/pathway" className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🧭
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Your progress</p>
              <h2>See my pathway</h2>
              <p>
                View all five setup steps and update any section of your
                pathway.
              </p>
              <p className="card-action text-link">Open pathway</p>
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
              <p className="dashboard-card-label">Support</p>
              <h2>Wellbeing and support</h2>
              <p>
                Review what helps you feel safe, comfortable and included.
              </p>
              <p className="card-action text-link">Review support</p>
            </div>
          </Link>

          <Link href="/opportunities" className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🔎
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Browse roles</p>
              <h2>Find opportunities</h2>
              <p>
                Browse published volunteering roles and read what support is
                available.
              </p>
              <p className="card-action text-link">Open opportunities</p>
            </div>
          </Link>

          <Link href="/my-interests" className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              📬
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Track roles</p>
              <h2>Roles I am interested in</h2>
              <p>
                See roles where you clicked “I’m interested” and track their
                current status.
              </p>
              <p className="card-action text-link">Open interested roles</p>
            </div>
          </Link>
        </section>
      </section>
    </main>
  );
}
