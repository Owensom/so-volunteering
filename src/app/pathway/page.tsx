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

type EducationSummary = {
  id: string;
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

type PathwayGuideStep = {
  icon: string;
  title: string;
  text: string;
  href: string;
  action: string;
  isComplete: boolean;
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

function getRecognisedSkillCount(reviews: SkillReview[]) {
  const recognised = new Set<string>();

  reviews.forEach((review) => {
    getReviewSkills(review).forEach((skill) => {
      recognised.add(skill.key);
    });
  });

  return recognised.size;
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
    <Link
      href={href}
      className={
        complete
          ? "info-card dashboard-pathway-card pathway-step-card pathway-step-card-complete"
          : "info-card dashboard-pathway-card pathway-step-card"
      }
    >
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

function PathwayGuide({ steps }: { steps: PathwayGuideStep[] }) {
  return (
    <section className="pathway-guide-panel" aria-labelledby="pathway-guide-title">
      <div className="pathway-guide-heading">
        <span aria-hidden="true">🧭</span>

        <div>
          <p className="dashboard-kicker">Step-by-step guide</p>
          <h2 id="pathway-guide-title">How to build your pathway</h2>
          <p>
            Work through your setup steps, add learning, collect positive
            evidence and open your Positive Pathway CV when you want to share or
            save it.
          </p>
        </div>
      </div>

      <div className="pathway-guide-grid">
        {steps.map((step, index) => (
          <Link
            key={step.title}
            href={step.href}
            className={
              step.isComplete
                ? "pathway-guide-step pathway-guide-step-complete"
                : "pathway-guide-step"
            }
          >
            <span className="pathway-guide-step-number">
              {step.isComplete ? "✓" : index + 1}
            </span>

            <div className="pathway-guide-step-icon" aria-hidden="true">
              {step.icon}
            </div>

            <div className="pathway-guide-step-copy">
              <p className="pathway-guide-step-kicker">
                Step {index + 1}
                <span>{step.isComplete ? "Complete" : "To do"}</span>
              </p>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <strong>{step.action}</strong>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StrengthSummaryCard({
  icon,
  title,
  value,
  text,
}: {
  icon: string;
  title: string;
  value: string | number;
  text: string;
}) {
  return (
    <article className="pathway-summary-card">
      <span aria-hidden="true">{icon}</span>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <small>{text}</small>
      </div>
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

  const { data: educationEntries } = await supabase
    .from("volunteer_education_entries")
    .select("id")
    .eq("volunteer_user_id", user.id);

  const { data: skillReviews } = await supabase
    .from("volunteer_skill_reviews")
    .select(
      "id,opportunity_title,reliability,teamwork,communication,confidence,kindness,problem_solving,following_instructions,initiative,timekeeping,practical_skills,community_interaction,positive_comment,created_at,updated_at",
    )
    .eq("volunteer_user_id", user.id)
    .eq("status", "shared")
    .order("updated_at", { ascending: false });

  const sharedReviews = (skillReviews as SkillReview[] | null) ?? [];
  const educationRows = (educationEntries as EducationSummary[] | null) ?? [];

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
  const recognisedSkillCount = getRecognisedSkillCount(sharedReviews);
  const educationCount = educationRows.length;
  const hasPositiveCvEvidence =
    progress.completedSteps > 0 || educationCount > 0 || reviewCount > 0;

  const guideSteps: PathwayGuideStep[] = [
    {
      icon: "🌱",
      title: "Set your goals",
      text: "Add your town or city and choose what you want volunteering to help with.",
      href: "/onboarding/volunteer",
      action: progress.goalsComplete ? "Review goals" : "Continue goals",
      isComplete: progress.goalsComplete,
    },
    {
      icon: "💚",
      title: "Choose interests",
      text: "Choose what you enjoy, care about or might like to try.",
      href: "/onboarding/volunteer/interests",
      action: progress.interestsComplete
        ? "Review interests"
        : "Continue interests",
      isComplete: progress.interestsComplete,
    },
    {
      icon: "⭐",
      title: "Add skills",
      text: "Choose skills you already have or would like to build.",
      href: "/onboarding/volunteer/skills",
      action: progress.skillsComplete ? "Review skills" : "Continue skills",
      isComplete: progress.skillsComplete,
    },
    {
      icon: "💛",
      title: "Add support",
      text: "Choose anything that helps you feel comfortable, safe and included.",
      href: "/onboarding/volunteer/accessibility",
      action: progress.accessibilityComplete
        ? "Review support"
        : "Continue support",
      isComplete: progress.accessibilityComplete,
    },
    {
      icon: "📅",
      title: "Add availability",
      text: "Tell the app when volunteering might work for you.",
      href: "/onboarding/volunteer/availability",
      action: progress.availabilityComplete
        ? "Review availability"
        : "Continue availability",
      isComplete: progress.availabilityComplete,
    },
    {
      icon: "📄",
      title: "Open your CV",
      text: "See your goals, skills, learning and positive evidence in one place.",
      href: "/pathway/cv",
      action: "Open Positive Pathway CV",
      isComplete: hasPositiveCvEvidence,
    },
  ];

  const guideCompleteCount = guideSteps.filter((step) => step.isComplete).length;
  const guidePercent = Math.round((guideCompleteCount / guideSteps.length) * 100);

  const listenText = simpleView
    ? `You are on your pathway page. This page shows your setup guide, your positive skills reviews and a button to open your Positive Pathway CV. You have ${reviewCount} shared skills review${reviewCount === 1 ? "" : "s"}. Each card says complete or to do. Open a card to review or finish that step. Use Dashboard to go back.`
    : `You are on your SO Volunteering pathway page. It now works as a pathway control centre. It shows a step by step guide for goals, interests, skills, wellbeing and support, availability, and your Positive Pathway CV. It also shows positive skills reviews shared by organisations after volunteering activity. You currently have ${reviewCount} shared skills review${reviewCount === 1 ? "" : "s"}, ${educationCount} education entr${educationCount === 1 ? "y" : "ies"} and ${reviewSkillCount} positive skill badge${reviewSkillCount === 1 ? "" : "s"}. First, check the Progress card on the right to see how many steps are complete. Use Open Positive Pathway CV to see your strengths-based CV. Use Best roles for me to browse matched opportunities. Use View my profile to see your full profile summary, or Back to dashboard to return home.`;

  const shellClassName = [
    "dashboard-bg",
    "pathway-page",
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
          className="dashboard-welcome-card pathway-hero"
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
                ? `Hi ${displayName}. Check your setup steps, positive reviews and CV.`
                : `Hi ${displayName}. This is your pathway control centre. Build your setup profile, review positive evidence, open your CV and find roles that fit you.`}
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
                href="/opportunities"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🔎</span>
                  <span>Best roles for me</span>
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
                  {progress.completedSteps} of {progress.totalSteps} setup steps
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

            <div className="pathway-mini-status">
              <p className="dashboard-progress-note">
                Positive reviews: <strong>{reviewCount}</strong>
              </p>
              <p className="dashboard-progress-note">
                Education entries: <strong>{educationCount}</strong>
              </p>
              <p className="dashboard-progress-note">
                Recognised strengths: <strong>{recognisedSkillCount}</strong>
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

        <PathwayGuide steps={guideSteps} />

        <section
          className="pathway-summary-panel"
          aria-labelledby="pathway-summary-title"
        >
          <div className="pathway-summary-heading">
            <span aria-hidden="true">🌈</span>

            <div>
              <p className="dashboard-kicker">Pathway summary</p>
              <h2 id="pathway-summary-title">Your progress at a glance</h2>
              <p>
                These cards show what is already helping build your Positive
                Pathway CV.
              </p>
            </div>
          </div>

          <div className="pathway-summary-grid">
            <StrengthSummaryCard
              icon="✅"
              title="Setup progress"
              value={`${progress.completedSteps}/5`}
              text="Goals, interests, skills, support and availability."
            />
            <StrengthSummaryCard
              icon="📚"
              title="Learning added"
              value={educationCount}
              text="Education, qualifications, training or certificates."
            />
            <StrengthSummaryCard
              icon="⭐"
              title="Shared reviews"
              value={reviewCount}
              text="Positive evidence shared by organisations."
            />
            <StrengthSummaryCard
              icon="🏅"
              title="Recognised strengths"
              value={recognisedSkillCount}
              text="Skill areas recognised through volunteering."
            />
          </div>
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

          <Link
            href="/profile/education"
            className={
              educationCount > 0
                ? "info-card dashboard-pathway-card pathway-step-card pathway-step-card-complete"
                : "info-card dashboard-pathway-card pathway-step-card"
            }
          >
            <div className="dashboard-card-icon" aria-hidden="true">
              {educationCount > 0 ? "✅" : "📚"}
            </div>

            <div className="dashboard-card-copy">
              <div className="dashboard-card-main">
                <p className="dashboard-card-label">
                  {educationCount > 0 ? "Learning added" : "Optional step"}
                </p>
                <h2>Education and training</h2>
                <p>
                  {simpleView
                    ? "Add learning to your CV."
                    : "Add education, qualifications, certificates or training to strengthen your Positive Pathway CV."}
                </p>
              </div>

              <span className="dashboard-card-action-pill">
                {educationCount > 0 ? "Review education" : "Add education"}
              </span>
            </div>
          </Link>

          <Link href="/opportunities" className="info-card dashboard-pathway-card">
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
                    : "Your pathway helps sort published volunteering roles by the strongest match to your goals, interests and skills."}
                </p>
              </div>

              <span className="dashboard-card-action-pill">Open best roles</span>
            </div>
          </Link>

          <Link href="/pathway/cv" className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              📄
            </div>

            <div className="dashboard-card-copy">
              <div className="dashboard-card-main">
                <p className="dashboard-card-label">Positive Pathway CV</p>
                <h2>Open your CV</h2>
                <p>
                  {simpleView
                    ? "See your strengths and feedback."
                    : "See your goals, skills, learning, recognised strengths and positive feedback in one place."}
                </p>
              </div>

              <span className="dashboard-card-action-pill">Open CV</span>
            </div>
          </Link>
        </section>
      </section>

      <style>{`
        .pathway-page,
        .pathway-page * {
          box-sizing: border-box;
        }

        .dashboard-grid {
          align-items: stretch;
        }

        .pathway-primary-actions {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          width: min(100%, 620px);
          align-items: stretch;
        }

        .pathway-primary-actions .dashboard-main-action {
          width: 100%;
          min-height: 54px;
          justify-content: center;
          text-align: center;
        }

        .pathway-mini-status {
          display: grid;
          gap: 7px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(83, 111, 99, 0.12);
        }

        .pathway-mini-status .dashboard-progress-note {
          margin: 0;
        }

        .dashboard-pathway-card {
          height: 100%;
          min-height: 220px;
          align-items: stretch;
        }

        .pathway-step-card-complete {
          border-color: rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.22), transparent 34%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.9), rgba(255, 255, 255, 0.94));
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

        .pathway-guide-panel,
        .pathway-summary-panel,
        .positive-reviews-panel {
          padding: clamp(20px, 4vw, 28px);
          border: 1px solid rgba(143, 178, 158, 0.22);
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 18px 56px rgba(38, 50, 56, 0.07);
          display: grid;
          gap: 18px;
          overflow: hidden;
        }

        .pathway-guide-panel {
          border-color: rgba(108, 92, 160, 0.16);
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.92), rgba(255, 255, 255, 0.9));
        }

        .pathway-summary-panel {
          border-color: rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.38), transparent 34%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.94), rgba(255, 255, 255, 0.9));
        }

        .pathway-guide-heading,
        .pathway-summary-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .pathway-guide-heading > span,
        .pathway-summary-heading > span {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(108, 92, 160, 0.12);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.14);
          font-size: 1.85rem;
        }

        .pathway-summary-heading > span {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.16);
        }

        .pathway-guide-heading h2,
        .pathway-summary-heading h2,
        .positive-reviews-header h2 {
          margin: 2px 0 8px;
          color: #315f48;
          font-size: clamp(1.35rem, 3vw, 1.8rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .pathway-guide-heading p,
        .pathway-summary-heading p,
        .positive-reviews-header p {
          margin: 0;
          max-width: 760px;
          color: #60706a;
          font-weight: 750;
          line-height: 1.55;
        }

        .pathway-guide-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .pathway-guide-step {
          position: relative;
          display: grid;
          gap: 10px;
          min-height: 190px;
          padding: 15px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.78);
          color: inherit;
          text-decoration: none;
          box-shadow: 0 12px 28px rgba(33, 56, 48, 0.05);
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .pathway-guide-step:hover {
          transform: translateY(-1px);
          border-color: rgba(83, 111, 99, 0.28);
          background: rgba(255, 255, 255, 0.94);
        }

        .pathway-guide-step-complete {
          border-color: rgba(34, 124, 78, 0.26);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.28), transparent 34%),
            rgba(244, 255, 249, 0.92);
          box-shadow: 0 14px 30px rgba(33, 96, 61, 0.08);
        }

        .pathway-guide-step-number {
          position: absolute;
          top: 12px;
          right: 12px;
          display: inline-flex;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
          color: #4f4b82;
          font-size: 0.82rem;
          font-weight: 950;
          line-height: 1;
        }

        .pathway-guide-step-complete .pathway-guide-step-number {
          background: rgba(34, 124, 78, 0.14);
          color: #145c38;
        }

        .pathway-guide-step-icon {
          display: inline-flex;
          width: 52px;
          height: 52px;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: rgba(248, 248, 252, 0.96);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.08);
          font-size: 1.55rem;
        }

        .pathway-guide-step-complete .pathway-guide-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .pathway-guide-step-copy {
          display: grid;
          gap: 6px;
        }

        .pathway-guide-step-kicker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin: 0;
          padding-right: 34px;
          color: #6c5ca0;
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .pathway-guide-step-kicker span {
          display: inline-flex;
          min-height: 24px;
          align-items: center;
          justify-content: center;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.1);
          color: #6c5ca0;
          font-size: 0.68rem;
          letter-spacing: 0;
          text-transform: none;
        }

        .pathway-guide-step-complete .pathway-guide-step-kicker,
        .pathway-guide-step-complete .pathway-guide-step-kicker span {
          color: #145c38;
        }

        .pathway-guide-step-complete .pathway-guide-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .pathway-guide-step-copy h3 {
          margin: 0;
          padding-right: 32px;
          color: #315f48;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.14;
        }

        .pathway-guide-step-copy p {
          margin: 0;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 740;
          line-height: 1.42;
        }

        .pathway-guide-step-copy strong {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          margin-top: 4px;
          padding: 8px 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #536f63;
          font-size: 0.82rem;
          font-weight: 950;
          line-height: 1.1;
          box-shadow: 0 8px 18px rgba(33, 56, 48, 0.05);
        }

        .pathway-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .pathway-summary-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          min-height: 126px;
          padding: 14px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
        }

        .pathway-summary-card > span {
          display: inline-flex;
          width: 44px;
          height: 44px;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.35rem;
        }

        .pathway-summary-card p {
          margin: 0 0 5px;
          color: #60706a;
          font-size: 0.82rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .pathway-summary-card strong {
          display: block;
          color: #315f48;
          font-size: 1.75rem;
          line-height: 1;
        }

        .pathway-summary-card small {
          display: block;
          margin-top: 8px;
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.25;
        }

        .positive-reviews-header {
          display: flex;
          gap: 16px;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
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
        .preference-theme-calm_green .positive-reviews-panel,
        .preference-theme-calm_green .pathway-guide-panel,
        .preference-theme-calm_green .pathway-summary-panel {
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
        .preference-theme-soft_blue .positive-reviews-panel,
        .preference-theme-soft_blue .pathway-guide-panel,
        .preference-theme-soft_blue .pathway-summary-panel {
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
        .preference-theme-warm_peach .positive-reviews-panel,
        .preference-theme-warm_peach .pathway-guide-panel,
        .preference-theme-warm_peach .pathway-summary-panel {
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
        .preference-theme-high_contrast .positive-reviews-panel,
        .preference-theme-high_contrast .pathway-guide-panel,
        .preference-theme-high_contrast .pathway-guide-step,
        .preference-theme-high_contrast .pathway-summary-panel,
        .preference-theme-high_contrast .pathway-summary-card {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .positive-reviews-header h2,
        .preference-theme-high_contrast .positive-review-title h2,
        .preference-theme-high_contrast .pathway-guide-heading h2,
        .preference-theme-high_contrast .pathway-guide-step-copy h3,
        .preference-theme-high_contrast .pathway-summary-heading h2,
        .preference-theme-high_contrast .pathway-summary-card strong {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-card-copy p,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .positive-reviews-header p,
        .preference-theme-high_contrast .positive-review-title p,
        .preference-theme-high_contrast .positive-comment-box p,
        .preference-theme-high_contrast .pathway-guide-heading p,
        .preference-theme-high_contrast .pathway-guide-step-copy p,
        .preference-theme-high_contrast .pathway-summary-heading p,
        .preference-theme-high_contrast .pathway-summary-card p,
        .preference-theme-high_contrast .pathway-summary-card small {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-card-icon,
        .preference-theme-high_contrast .dashboard-progress-icon,
        .preference-theme-high_contrast .empty-review-icon,
        .preference-theme-high_contrast .pathway-guide-heading > span,
        .preference-theme-high_contrast .pathway-guide-step-icon,
        .preference-theme-high_contrast .pathway-summary-heading > span,
        .preference-theme-high_contrast .pathway-summary-card > span {
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
        .preference-theme-neon_arcade .positive-reviews-panel,
        .preference-theme-neon_arcade .pathway-guide-panel,
        .preference-theme-neon_arcade .pathway-guide-step,
        .preference-theme-neon_arcade .pathway-summary-panel,
        .preference-theme-neon_arcade .pathway-summary-card {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .empty-positive-reviews-panel,
        .preference-theme-neon_arcade .pathway-step-card-complete {
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
        .preference-theme-neon_arcade .progress-meta,
        .preference-theme-neon_arcade .pathway-guide-heading h2,
        .preference-theme-neon_arcade .pathway-guide-step-copy h3,
        .preference-theme-neon_arcade .pathway-summary-heading h2,
        .preference-theme-neon_arcade .pathway-summary-card strong {
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
        .preference-theme-neon_arcade .dashboard-muted-action,
        .preference-theme-neon_arcade .pathway-guide-heading p,
        .preference-theme-neon_arcade .pathway-guide-step-copy p,
        .preference-theme-neon_arcade .pathway-summary-heading p,
        .preference-theme-neon_arcade .pathway-summary-card p,
        .preference-theme-neon_arcade .pathway-summary-card small {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-card-icon,
        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .empty-review-icon,
        .preference-theme-neon_arcade .pathway-guide-heading > span,
        .preference-theme-neon_arcade .pathway-guide-step-icon,
        .preference-theme-neon_arcade .pathway-summary-heading > span,
        .preference-theme-neon_arcade .pathway-summary-card > span {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .dashboard-card-action-pill,
        .preference-theme-neon_arcade .positive-skill-badge,
        .preference-theme-neon_arcade .positive-review-summary span,
        .preference-theme-neon_arcade .pathway-guide-step-copy strong {
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

        @media (max-width: 1040px) {
          .pathway-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pathway-guide-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .pathway-primary-actions {
            grid-template-columns: 1fr;
            width: 100%;
          }

          .positive-review-grid {
            grid-template-columns: 1fr;
          }

          .pathway-guide-heading,
          .pathway-summary-heading {
            grid-template-columns: 1fr;
          }

          .pathway-guide-heading > span,
          .pathway-summary-heading > span {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .pathway-guide-grid,
          .pathway-summary-grid {
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

          .positive-reviews-panel,
          .pathway-guide-panel,
          .pathway-summary-panel {
            border-radius: 26px;
            padding: 18px;
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
