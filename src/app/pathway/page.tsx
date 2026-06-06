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

type SkillReview = {
  id: string;
  opportunity_title: string | null;
  reliability: boolean;
  teamwork: boolean;
  communication: boolean;
  confidence: boolean;
  kindness: boolean;
  problem_solving: boolean;
  following_instructions: boolean;
  initiative: boolean;
  timekeeping: boolean;
  practical_skills: boolean;
  community_interaction: boolean;
  positive_comment: string | null;
  created_at: string;
  updated_at: string;
};

type SkillBadge = {
  key: keyof Pick<
    SkillReview,
    | "reliability"
    | "teamwork"
    | "communication"
    | "confidence"
    | "kindness"
    | "problem_solving"
    | "following_instructions"
    | "initiative"
    | "timekeeping"
    | "practical_skills"
    | "community_interaction"
  >;
  label: string;
  icon: string;
};

const skillBadges: SkillBadge[] = [
  { key: "reliability", label: "Reliable", icon: "🤝" },
  { key: "teamwork", label: "Teamwork", icon: "👥" },
  { key: "communication", label: "Communication", icon: "💬" },
  { key: "confidence", label: "Confidence", icon: "🌱" },
  { key: "kindness", label: "Kindness", icon: "💛" },
  { key: "problem_solving", label: "Problem solving", icon: "🧩" },
  {
    key: "following_instructions",
    label: "Following instructions",
    icon: "✅",
  },
  { key: "initiative", label: "Initiative", icon: "✨" },
  { key: "timekeeping", label: "Timekeeping", icon: "🕒" },
  { key: "practical_skills", label: "Practical skills", icon: "🛠️" },
  {
    key: "community_interaction",
    label: "Community interaction",
    icon: "🌍",
  },
];

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

function hasArrayValue(value: string[] | null | undefined) {
  return Array.isArray(value) && value.length > 0;
}

function hasTextValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function getReviewSkills(review: SkillReview) {
  return skillBadges.filter((skill) => review[skill.key] === true);
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
      availabilityComplete: false,
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

  return {
    completedSteps,
    totalSteps,
    percentage,
    goalsComplete,
    interestsComplete,
    skillsComplete,
    accessibilityComplete,
    availabilityComplete,
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
  simpleView,
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

function PositiveReviewCard({ review }: { review: SkillReview }) {
  const skills = getReviewSkills(review);

  return (
    <article className="info-card positive-review-card">
      <div className="positive-review-header">
        <div className="dashboard-card-icon" aria-hidden="true">
          ⭐
        </div>

        <div className="positive-review-title">
          <p className="dashboard-card-label">Positive skills review</p>
          <h2>{review.opportunity_title || "Volunteering activity"}</h2>
          <p>Shared on {formatDate(review.updated_at || review.created_at)}</p>
        </div>
      </div>

      {skills.length > 0 ? (
        <div className="positive-skill-badges" aria-label="Positive skills">
          {skills.map((skill) => (
            <span key={skill.key} className="positive-skill-badge">
              <span aria-hidden="true">{skill.icon}</span>
              <span>{skill.label}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="positive-review-muted">
          This review has been shared, but no skill badges were selected.
        </p>
      )}

      {review.positive_comment ? (
        <div className="positive-comment-box">
          <p className="dashboard-card-label">Encouraging comment</p>
          <p>{review.positive_comment}</p>
        </div>
      ) : null}
    </article>
  );
}

export default async function PathwayPage() {
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
      "city,goals,interests,skills,support_needs,share_accessibility_needs,wants_wellbeing_support,accessibility_completed,availability_notes,preferred_contact_method,onboarding_completed",
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const { data: preferences } = await supabase
    .from("volunteer_preferences")
    .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerPreferences>();

  const { data: skillReviews } = await supabase
    .from("volunteer_skill_reviews")
    .select(
      "id,opportunity_title,reliability,teamwork,communication,confidence,kindness,problem_solving,following_instructions,initiative,timekeeping,practical_skills,community_interaction,positive_comment,created_at,updated_at",
    )
    .eq("volunteer_user_id", user.id)
    .eq("status", "shared")
    .order("updated_at", { ascending: false });

  const sharedReviews = (skillReviews as SkillReview[] | null) ?? [];

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";

  const displayName = profile?.full_name?.trim() || "there";
  const progress = getVolunteerProgress(volunteerProfile);

  const reviewCount = sharedReviews.length;
  const reviewSkillCount = sharedReviews.reduce(
    (total, review) => total + getReviewSkills(review).length,
    0,
  );

  const listenText = simpleView
    ? `You are on your pathway page. This page shows five setup steps, your positive skills reviews and a button to open your Positive Pathway CV. You have ${reviewCount} shared skills review${reviewCount === 1 ? "" : "s"}. Each card says complete or to do. Open a card to review or finish that step. Use Dashboard to go back.`
    : `You are on your SO Volunteering pathway page. It shows your five profile setup steps: goals, interests, skills, wellbeing and support, and availability. It also shows positive skills reviews shared by organisations after volunteering activity. You can open your Positive Pathway CV from the main button. You currently have ${reviewCount} shared skills review${reviewCount === 1 ? "" : "s"} and ${reviewSkillCount} positive skill badge${reviewSkillCount === 1 ? "" : "s"}. First, check the Progress card on the right to see how many steps are complete. Each card below says whether the step is complete or still to do. You can select any card to review or update that part of your profile. Use View my profile to see your full profile summary, or Back to dashboard to return home.`;

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
                ? `Hi ${displayName}. Check your five setup steps, positive reviews and CV.`
                : `Hi ${displayName}. This page shows your volunteering pathway setup, positive skills evidence and Positive Pathway CV.`}
            </p>

            <div className="dashboard-primary-actions pathway-primary-actions">
              <Link
                href="/pathway/cv"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📄</span>
                  <span>Open Positive Pathway CV</span>
                </span>
              </Link>

              <Link
                href="/profile"
                className="secondary-button dashboard-main-action"
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

            <p className="dashboard-progress-note">
              Positive reviews: <strong>{reviewCount}</strong>
            </p>

            {detailedView ? (
              <p className="dashboard-progress-note">
                App view: <strong>{getViewLabel(viewMode)}</strong> · Theme:{" "}
                <strong>{getThemeLabel(colourTheme)}</strong>
              </p>
            ) : null}
          </aside>
        </section>

        {sharedReviews.length > 0 ? (
          <section
            className="positive-reviews-panel"
            aria-labelledby="positive-reviews-title"
          >
            <div className="positive-reviews-header">
              <div>
                <p className="dashboard-kicker">Positive evidence</p>
                <h2 id="positive-reviews-title">
                  Skills organisations have recognised
                </h2>
                <p>
                  These shared reviews can help you see the strengths you are
                  building through volunteering.
                </p>
              </div>

              <div className="positive-review-summary" aria-label="Review summary">
                <span>
                  <strong>{reviewCount}</strong> review
                  {reviewCount === 1 ? "" : "s"}
                </span>
                <span>
                  <strong>{reviewSkillCount}</strong> skill badge
                  {reviewSkillCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="positive-review-grid">
              {sharedReviews.map((review) => (
                <PositiveReviewCard key={review.id} review={review} />
              ))}
            </div>

            <div className="positive-reviews-actions">
              <Link href="/pathway/cv" className="secondary-button">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📄</span>
                  <span>Open Positive Pathway CV</span>
                </span>
              </Link>
            </div>
          </section>
        ) : (
          <section
            className="positive-reviews-panel empty-positive-reviews-panel"
            aria-labelledby="positive-reviews-title"
          >
            <div className="positive-reviews-header">
              <div>
                <p className="dashboard-kicker">Positive evidence</p>
                <h2 id="positive-reviews-title">Skills reviews will appear here</h2>
                <p>
                  After you volunteer, an organisation may share a positive
                  skills review with you. It will appear here and help build
                  your pathway.
                </p>
              </div>

              <span className="empty-review-icon" aria-hidden="true">
                ⭐
              </span>
            </div>

            <div className="positive-reviews-actions">
              <Link href="/pathway/cv" className="secondary-button">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📄</span>
                  <span>Open Positive Pathway CV</span>
                </span>
              </Link>
            </div>
          </section>
        )}

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

        .pathway-primary-actions {
          gap: 10px;
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

        .positive-reviews-panel {
          padding: clamp(20px, 4vw, 28px);
          border: 1px solid rgba(143, 178, 158, 0.22);
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 18px 56px rgba(38, 50, 56, 0.07);
          display: grid;
          gap: 18px;
        }

        .positive-reviews-header {
          display: flex;
          gap: 16px;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .positive-reviews-header h2 {
          margin: 2px 0 8px;
          color: #315f48;
          font-size: clamp(1.35rem, 3vw, 1.8rem);
          letter-spacing: -0.035em;
        }

        .positive-reviews-header p {
          margin: 0;
          max-width: 720px;
          color: #60706a;
          line-height: 1.55;
        }

        .positive-review-summary {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .positive-review-summary span {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.92);
          border: 1px solid rgba(83, 111, 99, 0.16);
          color: #536f63;
          font-weight: 900;
        }

        .positive-review-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .positive-review-card {
          display: grid;
          gap: 16px;
          border-radius: 24px;
        }

        .positive-review-header {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .positive-review-title h2 {
          margin: 0 0 6px;
          color: #315f48;
          overflow-wrap: anywhere;
        }

        .positive-review-title p {
          margin: 0;
          color: #60706a;
          line-height: 1.4;
        }

        .positive-skill-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .positive-skill-badge {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 11px;
          border-radius: 999px;
          background:
            linear-gradient(135deg, rgba(143, 178, 158, 0.14), rgba(183, 167, 214, 0.1)),
            rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(143, 178, 158, 0.2);
          color: #315f48;
          font-weight: 900;
          line-height: 1.15;
        }

        .positive-comment-box {
          display: grid;
          gap: 8px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.74);
        }

        .positive-comment-box p {
          margin: 0;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.5;
        }

        .positive-review-muted {
          margin: 0;
          color: #60706a;
          font-weight: 800;
        }

        .positive-reviews-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .positive-reviews-actions .secondary-button {
          width: fit-content;
        }

        .empty-positive-reviews-panel {
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.78), rgba(255, 255, 255, 0.9));
        }

        .empty-review-icon {
          width: 58px;
          height: 58px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.8rem;
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
        .preference-theme-calm_green .dashboard-progress-card,
        .preference-theme-calm_green .positive-reviews-panel {
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
        .preference-theme-soft_blue .dashboard-progress-card,
        .preference-theme-soft_blue .positive-reviews-panel {
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
        .preference-theme-warm_peach .dashboard-progress-card,
        .preference-theme-warm_peach .positive-reviews-panel {
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
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .positive-reviews-panel {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .positive-reviews-header h2,
        .preference-theme-high_contrast .positive-review-title h2 {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-card-copy p,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .positive-reviews-header p,
        .preference-theme-high_contrast .positive-review-title p,
        .preference-theme-high_contrast .positive-comment-box p {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-card-icon,
        .preference-theme-high_contrast .dashboard-progress-icon,
        .preference-theme-high_contrast .empty-review-icon {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-card-action-pill,
        .preference-theme-high_contrast .positive-skill-badge,
        .preference-theme-high_contrast .positive-review-summary span {
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
        .preference-theme-neon_arcade .info-card,
        .preference-theme-neon_arcade .positive-reviews-panel {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .empty-positive-reviews-panel {
          background:
            radial-gradient(circle at top left, rgba(34, 211, 238, 0.14), transparent 55%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(49, 46, 129, 0.88));
        }

        .preference-theme-neon_arcade .dashboard-title,
        .preference-theme-neon_arcade .dashboard-card-copy h2,
        .preference-theme-neon_arcade .dashboard-progress-card h2,
        .preference-theme-neon_arcade .dashboard-progress-note strong,
        .preference-theme-neon_arcade .positive-reviews-header h2,
        .preference-theme-neon_arcade .positive-review-title h2,
        .preference-theme-neon_arcade .positive-review-summary strong,
        .preference-theme-neon_arcade .progress-meta {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-card-label,
        .preference-theme-neon_arcade .dashboard-card-copy p,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .positive-reviews-header p,
        .preference-theme-neon_arcade .positive-review-title p,
        .preference-theme-neon_arcade .positive-review-muted,
        .preference-theme-neon_arcade .positive-comment-box p,
        .preference-theme-neon_arcade .dashboard-muted-action {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-card-icon,
        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .empty-review-icon {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .dashboard-card-action-pill,
        .preference-theme-neon_arcade .positive-skill-badge,
        .preference-theme-neon_arcade .positive-review-summary span {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow:
            0 10px 24px rgba(0, 0, 0, 0.24),
            inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .positive-comment-box {
          border-color: rgba(34, 211, 238, 0.28);
          background: rgba(30, 41, 59, 0.72);
        }

        .preference-theme-neon_arcade .dashboard-pathway-card:hover .dashboard-card-action-pill,
        .preference-theme-neon_arcade .positive-reviews-actions .secondary-button:hover {
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

        @media (max-width: 760px) {
          .positive-review-grid {
            grid-template-columns: 1fr;
          }

          .pathway-primary-actions .primary-button,
          .pathway-primary-actions .secondary-button,
          .positive-reviews-actions .secondary-button {
            width: 100%;
          }
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

          .positive-reviews-panel {
            border-radius: 26px;
          }

          .positive-review-header {
            grid-template-columns: 1fr;
          }

          .positive-skill-badge,
          .positive-review-summary span {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
