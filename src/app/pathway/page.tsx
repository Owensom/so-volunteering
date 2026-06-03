import Link from "next/link";
import { redirect } from "next/navigation";
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
  href
}: {
  complete: boolean;
  icon: string;
  step: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="info-card dashboard-pathway-card">
      <div className="dashboard-card-icon" aria-hidden="true">
        {complete ? "✅" : icon}
      </div>

      <div className="dashboard-card-copy">
        <p className="dashboard-card-label">
          {complete ? `${step} complete` : `${step} to do`}
        </p>
        <h2>{title}</h2>
        <p>{description}</p>
        <p className="card-action text-link">
          {complete ? "Review this step" : "Continue this step"}
        </p>
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

  const { data: volunteerProfile } = await supabase
    .from("volunteer_profiles")
    .select(
      "city,goals,interests,skills,support_needs,share_accessibility_needs,wants_wellbeing_support,accessibility_completed,availability_notes,preferred_contact_method,onboarding_completed"
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const displayName = profile?.full_name?.trim() || "there";
  const userType = profile?.user_type ?? "volunteer";
  const progress = getVolunteerProgress(volunteerProfile);

  const listenText =
    "This is your SO Volunteering pathway page. It shows your five profile setup steps: goals, interests, skills, wellbeing and support, and availability. Each card says whether the step is complete or still to do. You can select any card to review or update that part of your profile.";

  return (
    <main className="dashboard-bg">
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
            <InclusiveAudioButton text={listenText} />

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
              <span aria-hidden="true">🧭</span>
              <span>Pathway progress</span>
            </h1>

            <p className="dashboard-lead">
              Hi {displayName}. This page shows your volunteering pathway setup.
              You can review or update each step whenever you need to.
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
                ✨
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
          </aside>
        </section>

        <section className="dashboard-grid" aria-label="Pathway steps">
          <PathwayStepCard
            complete={progress.goalsComplete}
            icon="🌱"
            step="Step 1"
            title="Goals"
            description="What you want to achieve through volunteering."
            href="/onboarding/volunteer"
          />

          <PathwayStepCard
            complete={progress.interestsComplete}
            icon="💚"
            step="Step 2"
            title="Interests"
            description="What you enjoy or might like to try."
            href="/onboarding/volunteer/interests"
          />

          <PathwayStepCard
            complete={progress.skillsComplete}
            icon="⭐"
            step="Step 3"
            title="Skills"
            description="What you can do or would like to build."
            href="/onboarding/volunteer/skills"
          />

          <PathwayStepCard
            complete={progress.accessibilityComplete}
            icon="💛"
            step="Step 4"
            title="Wellbeing and support"
            description="Things that help you feel safe, comfortable and included."
            href="/onboarding/volunteer/accessibility"
          />

          <PathwayStepCard
            complete={progress.availabilityComplete}
            icon="📅"
            step="Step 5"
            title="Availability"
            description="When and how often volunteering might work for you."
            href="/onboarding/volunteer/availability"
          />

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🔎
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Coming soon</p>
              <h2>Opportunity matching</h2>
              <p>
                Your pathway will help match you with inclusive volunteering
                opportunities when the opportunity system is added.
              </p>
              <p className="dashboard-muted-action">Not live yet</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
