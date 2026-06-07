import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { getOpportunityMatch } from "@/lib/opportunity-matching";
import {
  saveVolunteerSkillReview,
  updateOpportunityInterestStatus,
} from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type Opportunity = {
  id: string;
  title: string;
  summary: string;
  status: string;
  location_type: string;
  time_commitment: string | null;
  interests: string[] | null;
  skills: string[] | null;
  support_offered: string[] | null;
};

type OpportunityInterest = {
  id: string;
  opportunity_id: string;
  organisation_user_id: string;
  volunteer_user_id: string;
  volunteer_name: string | null;
  volunteer_email: string | null;
  volunteer_city: string | null;
  volunteer_goals: string[] | null;
  volunteer_interests: string[] | null;
  volunteer_skills: string[] | null;
  message: string | null;
  status: string;
  created_at: string;
};

type SkillReview = {
  id: string;
  opportunity_interest_id: string;
  opportunity_id: string;
  organisation_user_id: string;
  volunteer_user_id: string;
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
  private_organisation_note: string | null;
  status: string;
  updated_at: string;
};

type SharedReviewHistory = {
  id: string;
  volunteer_user_id: string;
  status: string;
};

type SkillKey =
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
  | "community_interaction";

type SkillOption = {
  key: SkillKey;
  label: string;
  icon: string;
  helpText: string;
};

type ReviewGuideStep = {
  icon: string;
  title: string;
  text: string;
  isComplete: boolean;
};

const skillOptions: SkillOption[] = [
  {
    key: "reliability",
    label: "Reliable",
    icon: "🤝",
    helpText: "Turned up, helped steadily or could be counted on.",
  },
  {
    key: "teamwork",
    label: "Teamwork",
    icon: "👥",
    helpText: "Worked well with other people.",
  },
  {
    key: "communication",
    label: "Communication",
    icon: "💬",
    helpText: "Listened, asked questions or shared information clearly.",
  },
  {
    key: "confidence",
    label: "Confidence",
    icon: "🌱",
    helpText: "Showed growing confidence or tried something new.",
  },
  {
    key: "kindness",
    label: "Kindness",
    icon: "💛",
    helpText: "Was thoughtful, patient or helpful to others.",
  },
  {
    key: "problem_solving",
    label: "Problem solving",
    icon: "🧩",
    helpText: "Found a helpful way forward when something changed.",
  },
  {
    key: "following_instructions",
    label: "Following instructions",
    icon: "✅",
    helpText: "Followed steps, guidance or safety instructions.",
  },
  {
    key: "initiative",
    label: "Initiative",
    icon: "✨",
    helpText: "Spotted something useful to do or offered help.",
  },
  {
    key: "timekeeping",
    label: "Timekeeping",
    icon: "🕒",
    helpText: "Managed time, arrived as agreed or stayed on task.",
  },
  {
    key: "practical_skills",
    label: "Practical skills",
    icon: "🛠️",
    helpText: "Used hands-on, digital, admin or task-specific skills.",
  },
  {
    key: "community_interaction",
    label: "Community interaction",
    icon: "🌍",
    helpText: "Helped visitors, customers, participants or community members.",
  },
];

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
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

  return "new";
}

function formatInterestStatus(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "Accepted";
  if (normalisedStatus === "contacted") return "Contacted";
  if (normalisedStatus === "closed") return "Closed";
  return "New interest";
}

function getInterestStatusClass(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") {
    return "interest-status status-accepted";
  }

  if (normalisedStatus === "contacted") {
    return "interest-status status-contacted";
  }

  if (normalisedStatus === "closed") {
    return "interest-status status-closed";
  }

  return "interest-status status-new";
}

function getInterestStatusIcon(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "✅";
  if (normalisedStatus === "contacted") return "💬";
  if (normalisedStatus === "closed") return "🚫";
  return "🌱";
}

function formatReviewStatus(status: string | null | undefined) {
  if (status === "draft") return "Draft";
  if (status === "hidden") return "Hidden";
  return "Shared";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function formatList(values: string[] | null) {
  if (!Array.isArray(values) || values.length === 0) {
    return "Not supplied";
  }

  return values.join(", ");
}

function normaliseText(value: string) {
  return value.trim().toLowerCase();
}

function normaliseList(values: string[] | null | undefined) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value) => value.trim()).filter(Boolean);
}

function getSharedValues(
  volunteerValues: string[] | null | undefined,
  opportunityValues: string[] | null | undefined,
) {
  const volunteerList = normaliseList(volunteerValues);
  const opportunityList = normaliseList(opportunityValues);

  if (!volunteerList.length || !opportunityList.length) {
    return [];
  }

  const volunteerSet = new Set(volunteerList.map(normaliseText));

  return opportunityList.filter((value) => volunteerSet.has(normaliseText(value)));
}

function getReviewStatusClass(status: string | null | undefined) {
  if (status === "draft") return "review-status status-draft";
  if (status === "hidden") return "review-status status-hidden";
  return "review-status status-shared";
}

function hasAnySkill(review: SkillReview | undefined) {
  if (!review) return false;

  return skillOptions.some((option) => review[option.key] === true);
}

function hasPositiveComment(review: SkillReview | undefined) {
  return Boolean(review?.positive_comment?.trim());
}

function hasSavedReview(review: SkillReview | undefined) {
  return Boolean(review?.id);
}

function isAccepted(status: string | null | undefined) {
  return normaliseInterestStatus(status) === "accepted";
}

function ReviewSkillGrid({ review }: { review: SkillReview | undefined }) {
  return (
    <div className="review-skill-grid">
      {skillOptions.map((option) => (
        <label key={option.key} className="review-skill-card">
          <input
            type="checkbox"
            name={option.key}
            defaultChecked={review?.[option.key] === true}
          />

          <span className="review-skill-icon" aria-hidden="true">
            {option.icon}
          </span>

          <span className="review-skill-copy">
            <span className="review-skill-title">{option.label}</span>
            <small>{option.helpText}</small>
          </span>
        </label>
      ))}
    </div>
  );
}

function CountCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className={`review-count-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ReviewGuide({
  steps,
}: {
  steps: ReviewGuideStep[];
}) {
  return (
    <section className="review-guide-panel" aria-labelledby="review-guide-title">
      <div className="review-guide-heading">
        <span aria-hidden="true">🧭</span>

        <div>
          <p className="dashboard-kicker">Step-by-step guide</p>
          <h2 id="review-guide-title">How to complete positive reviews</h2>
          <p>
            Work through the steps for each volunteer. Completed saved steps turn
            green and show a tick. Reviews should stay positive, factual and
            useful for the volunteer’s pathway.
          </p>
        </div>
      </div>

      <div className="review-guide-grid">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className={
              step.isComplete
                ? "review-guide-step review-guide-step-complete"
                : "review-guide-step"
            }
          >
            <span className="review-guide-step-number">
              {step.isComplete ? "✓" : index + 1}
            </span>

            <div className="review-guide-step-icon" aria-hidden="true">
              {step.icon}
            </div>

            <div className="review-guide-step-copy">
              <p className="review-guide-step-kicker">
                Step {index + 1}
                <span>{step.isComplete ? "Complete" : "To do"}</span>
              </p>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReviewStepSection({
  stepNumber,
  icon,
  title,
  description,
  isComplete,
  children,
}: {
  stepNumber: number;
  icon: string;
  title: string;
  description: string;
  isComplete: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        isComplete
          ? "review-step-section review-step-complete"
          : "review-step-section"
      }
    >
      <div className="review-step-heading">
        <span className="review-step-icon" aria-hidden="true">
          {icon}
        </span>

        <div className="review-step-copy">
          <p className="review-step-kicker">
            Step {stepNumber}
            <span>
              <span aria-hidden="true">{isComplete ? "✅" : "○"}</span>
              {isComplete ? "Complete" : "To do"}
            </span>
          </p>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      <div className="review-step-body">{children}</div>
    </section>
  );
}

function VolunteerFitSummary({
  opportunity,
  interest,
  sharedReviewHistoryCount,
}: {
  opportunity: Opportunity;
  interest: OpportunityInterest;
  sharedReviewHistoryCount: number;
}) {
  const sharedInterests = getSharedValues(
    interest.volunteer_interests,
    opportunity.interests,
  );

  const sharedSkills = getSharedValues(interest.volunteer_skills, opportunity.skills);

  const match = getOpportunityMatch(
    {
      goals: interest.volunteer_goals,
      interests: interest.volunteer_interests,
      skills: interest.volunteer_skills,
      volunteering_preference: null,
      support_needs: null,
      availability_notes: null,
    },
    opportunity,
  );

  const hasVolunteerProfileData =
    normaliseList(interest.volunteer_goals).length > 0 ||
    normaliseList(interest.volunteer_interests).length > 0 ||
    normaliseList(interest.volunteer_skills).length > 0 ||
    Boolean(interest.volunteer_city?.trim()) ||
    Boolean(interest.message?.trim());

  const summary =
    sharedInterests.length > 0 || sharedSkills.length > 0
      ? "This volunteer has profile links to this role. Use this as a supportive guide, not a ranking."
      : hasVolunteerProfileData
        ? "This volunteer has shared some profile information. There may still be a good fit even if there are no direct matches yet."
        : "This volunteer has limited profile information available. You can still contact them to learn more.";

  const fitItems = [
    {
      icon: "💚",
      label: "Shared interests",
      value:
        sharedInterests.length > 0
          ? sharedInterests.join(", ")
          : "No direct interest match listed",
      tone: sharedInterests.length > 0 ? "ready" : "neutral",
    },
    {
      icon: "⭐",
      label: "Relevant skills",
      value:
        sharedSkills.length > 0
          ? sharedSkills.join(", ")
          : "No direct skill match listed",
      tone: sharedSkills.length > 0 ? "ready" : "neutral",
    },
    {
      icon: "🧭",
      label: "Profile signal",
      value: match.hasVolunteerProfileData
        ? match.reasons.slice(0, 2).join(" · ")
        : "Profile still developing",
      tone: match.hasVolunteerProfileData ? "ready" : "neutral",
    },
    {
      icon: "📍",
      label: "Location clue",
      value: interest.volunteer_city || "City not supplied",
      tone: interest.volunteer_city ? "ready" : "neutral",
    },
    {
      icon: "📄",
      label: "Positive review history",
      value:
        sharedReviewHistoryCount > 0
          ? `${sharedReviewHistoryCount} shared review${
              sharedReviewHistoryCount === 1 ? "" : "s"
            } recorded`
          : "No shared review history yet",
      tone: sharedReviewHistoryCount > 0 ? "ready" : "neutral",
    },
  ];

  return (
    <section className="volunteer-fit-panel" aria-label="Volunteer fit summary">
      <div className="volunteer-fit-heading">
        <span className="volunteer-fit-icon" aria-hidden="true">
          🌈
        </span>

        <div>
          <p className="dashboard-card-label">Volunteer fit summary</p>
          <h3>Supportive match notes</h3>
          <p>{summary}</p>
        </div>
      </div>

      <div className="volunteer-fit-grid">
        {fitItems.map((item) => (
          <article
            key={item.label}
            className={`volunteer-fit-card volunteer-fit-${item.tone}`}
          >
            <span className="volunteer-fit-card-icon" aria-hidden="true">
              {item.icon}
            </span>
            <div>
              <p className="volunteer-fit-label">{item.label}</p>
              <p>{item.value}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function OpportunityReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const opportunityId = resolvedParams.id;
  const errorMessage = resolvedSearchParams.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : "";
  const successMessage = resolvedSearchParams.message
    ? decodeURIComponent(resolvedSearchParams.message)
    : "";

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

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id,title,summary,status,location_type,time_commitment,interests,skills,support_offered",
    )
    .eq("id", opportunityId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<Opportunity>();

  if (!opportunity) {
    redirect("/organisation/opportunities");
  }

  const { data: interests } = await supabase
    .from("opportunity_interests")
    .select(
      "id,opportunity_id,organisation_user_id,volunteer_user_id,volunteer_name,volunteer_email,volunteer_city,volunteer_goals,volunteer_interests,volunteer_skills,message,status,created_at",
    )
    .eq("opportunity_id", opportunity.id)
    .eq("organisation_user_id", user.id)
    .order("created_at", { ascending: false });

  const interestRows = (interests as OpportunityInterest[] | null) ?? [];

  const { data: reviews } = await supabase
    .from("volunteer_skill_reviews")
    .select(
      "id,opportunity_interest_id,opportunity_id,organisation_user_id,volunteer_user_id,reliability,teamwork,communication,confidence,kindness,problem_solving,following_instructions,initiative,timekeeping,practical_skills,community_interaction,positive_comment,private_organisation_note,status,updated_at",
    )
    .eq("opportunity_id", opportunity.id)
    .eq("organisation_user_id", user.id);

  const reviewRows = (reviews as SkillReview[] | null) ?? [];
  const reviewByInterestId = new Map(
    reviewRows.map((review) => [review.opportunity_interest_id, review]),
  );

  const volunteerIds = Array.from(
    new Set(
      interestRows
        .map((interest) => interest.volunteer_user_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  let sharedReviewHistoryRows: SharedReviewHistory[] = [];

  if (volunteerIds.length > 0) {
    const { data: sharedHistory } = await supabase
      .from("volunteer_skill_reviews")
      .select("id,volunteer_user_id,status")
      .eq("organisation_user_id", user.id)
      .eq("status", "shared")
      .in("volunteer_user_id", volunteerIds);

    sharedReviewHistoryRows = (sharedHistory as SharedReviewHistory[] | null) ?? [];
  }

  const sharedReviewCountByVolunteerId = new Map<string, number>();

  sharedReviewHistoryRows.forEach((review) => {
    sharedReviewCountByVolunteerId.set(
      review.volunteer_user_id,
      (sharedReviewCountByVolunteerId.get(review.volunteer_user_id) ?? 0) + 1,
    );
  });

  const newInterestCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "new",
  ).length;

  const contactedCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "contacted",
  ).length;

  const acceptedCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "accepted",
  ).length;

  const closedCount = interestRows.filter(
    (interest) => normaliseInterestStatus(interest.status) === "closed",
  ).length;

  const sharedReviewCount = reviewRows.filter(
    (review) => review.status === "shared",
  ).length;

  const draftReviewCount = reviewRows.filter(
    (review) => review.status === "draft",
  ).length;

  const hiddenReviewCount = reviewRows.filter(
    (review) => review.status === "hidden",
  ).length;

  const hasAnyVolunteer = interestRows.length > 0;
  const hasAcceptedVolunteer = acceptedCount > 0;
  const hasAnySavedReview = reviewRows.length > 0;
  const hasAnySkillEvidence = reviewRows.some((review) => hasAnySkill(review));
  const hasAnyPositiveComment = reviewRows.some((review) =>
    hasPositiveComment(review),
  );
  const hasSharedReview = sharedReviewCount > 0;

  const pageGuideSteps: ReviewGuideStep[] = [
    {
      icon: "👤",
      title: "Choose a volunteer",
      text: "Open a volunteer card and check their interest, goals, skills and fit notes.",
      isComplete: hasAnyVolunteer,
    },
    {
      icon: "✅",
      title: "Update status",
      text: "Mark the volunteer as Contacted, Accepted or Closed when the next step is clear.",
      isComplete: contactedCount + acceptedCount + closedCount > 0,
    },
    {
      icon: "⭐",
      title: "Choose positive skills",
      text: "Tick the positive skills the volunteer has shown or started to build.",
      isComplete: hasAnySkillEvidence,
    },
    {
      icon: "💬",
      title: "Add a supportive comment",
      text: "Optional, but helpful for the volunteer’s confidence and Pathway CV.",
      isComplete: hasAnyPositiveComment,
    },
    {
      icon: "📌",
      title: "Choose review visibility",
      text: "Share with pathway, save as draft, or keep hidden from the volunteer.",
      isComplete: hasAnySavedReview,
    },
    {
      icon: "🌱",
      title: "Support the Pathway CV",
      text: "Shared reviews can appear as positive evidence in the volunteer’s pathway.",
      isComplete: hasSharedReview,
    },
  ];

  const completedGuideSteps = pageGuideSteps.filter((step) => step.isComplete)
    .length;

  const listenText =
    "This is the organiser volunteer management and positive skills review page for this opportunity. The page has a step by step guide. Step 1 is choose a volunteer. Step 2 is update their status. Step 3 is choose positive skills. Step 4 is add a supportive comment. Step 5 is choose review visibility. Step 6 is support the volunteer’s Positive Pathway CV. Each volunteer card also uses the same step labels. Shared reviews can become part of the volunteer pathway. Private organisation notes are only for the organisation.";

  return (
    <main className="dashboard-bg review-page">
      <section className="dashboard-shell">
        <header className="dashboard-topbar review-topbar">
          <Link
            href={`/organisation/opportunities/${opportunity.id}`}
            className="dashboard-brand"
            aria-label="Back to opportunity editor"
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

          <div className="dashboard-topbar-actions review-topbar-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href={`/organisation/opportunities/${opportunity.id}`}
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Back to role</span>
              </span>
            </Link>

            <Link
              href="/organisation/opportunities"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">📣</span>
                <span>All roles</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card review-hero"
          aria-labelledby="reviews-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Volunteer management</p>

            <h1 id="reviews-title" className="dashboard-title">
              <span aria-hidden="true">⭐</span>
              <span>Volunteers & reviews</span>
            </h1>

            <p className="dashboard-lead">
              Manage volunteers for <strong>{opportunity.title}</strong>, then
              add positive skills evidence when they have helped.
            </p>

            <div className="dashboard-primary-actions review-hero-actions">
              <Link
                href={`/organisation/opportunities/${opportunity.id}`}
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">←</span>
                  <span>Back to role</span>
                </span>
              </Link>

              <Link
                href="/organisation/opportunities"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📣</span>
                  <span>All roles</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Review summary">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                🌱
              </span>
              <div>
                <h2>Volunteer summary</h2>
                <p>
                  {interestRows.length} volunteer
                  {interestRows.length === 1 ? "" : "s"} registered interest.
                </p>
              </div>
            </div>

            <div className="review-progress-summary">
              <div className="review-progress-label">
                <span>Review progress</span>
                <strong>{completedGuideSteps}/6 steps</strong>
              </div>
              <div className="review-progress-meter" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.round(
                      (completedGuideSteps / pageGuideSteps.length) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <p className="dashboard-progress-note">
              Accepted: <strong>{acceptedCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Shared reviews: <strong>{sharedReviewCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Draft reviews: <strong>{draftReviewCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Hidden reviews: <strong>{hiddenReviewCount}</strong>
            </p>
          </aside>
        </section>

        <ReviewGuide steps={pageGuideSteps} />

        <section
          className="review-pathway-explainer"
          aria-labelledby="review-pathway-title"
        >
          <div className="review-pathway-icon" aria-hidden="true">
            🌱
          </div>

          <div>
            <p className="dashboard-kicker">Positive Pathway CV</p>
            <h2 id="review-pathway-title">Keep reviews positive and useful</h2>
            <p>
              Shared reviews can become evidence for a volunteer’s Positive
              Pathway CV. Focus on what the volunteer showed, practised, improved
              or contributed. Keep private notes separate.
            </p>
          </div>
        </section>

        <section className="review-count-grid" aria-label="Volunteer status counts">
          <CountCard label="New" value={newInterestCount} tone="count-new" />
          <CountCard
            label="Contacted"
            value={contactedCount}
            tone="count-contacted"
          />
          <CountCard
            label="Accepted"
            value={acceptedCount}
            tone="count-accepted"
          />
          <CountCard label="Closed" value={closedCount} tone="count-closed" />
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        {interestRows.length === 0 ? (
          <section className="dashboard-grid" aria-label="No volunteers yet">
            <article className="info-card review-empty-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                📬
              </div>

              <div className="dashboard-card-copy">
                <p className="dashboard-card-label">No volunteers yet</p>
                <h2>No one has registered interest in this role yet</h2>
                <p>
                  When a volunteer clicks “I’m interested”, they will appear
                  here and you can manage their status or add a positive skills
                  review after they have helped.
                </p>
              </div>
            </article>
          </section>
        ) : (
          <section className="review-list" aria-label="Volunteer reviews">
            {interestRows.map((interest) => {
              const review = reviewByInterestId.get(interest.id);
              const hasSavedSkill = hasAnySkill(review);
              const hasComment = hasPositiveComment(review);
              const hasReview = hasSavedReview(review);
              const reviewShared = review?.status === "shared";
              const volunteerAccepted = isAccepted(interest.status);
              const volunteerStatusMoved =
                normaliseInterestStatus(interest.status) !== "new";

              const sharedReviewHistoryCount =
                sharedReviewCountByVolunteerId.get(interest.volunteer_user_id) ??
                0;

              const volunteerName =
                interest.volunteer_name ||
                interest.volunteer_email ||
                "Volunteer";

              return (
                <article
                  key={interest.id}
                  className="info-card review-card"
                  id={`interest-${interest.id}`}
                >
                  <div className="review-card-header">
                    <div className="review-volunteer-title">
                      <span className="dashboard-card-icon" aria-hidden="true">
                        {review?.status === "shared"
                          ? "✅"
                          : hasSavedSkill
                            ? "📝"
                            : getInterestStatusIcon(interest.status)}
                      </span>

                      <div>
                        <p className="dashboard-card-label">
                          {formatInterestStatus(interest.status)}
                        </p>
                        <h2>{volunteerName}</h2>
                        <p>
                          {interest.volunteer_email || "No email supplied"}
                          {interest.volunteer_city
                            ? ` · ${interest.volunteer_city}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="review-status-stack">
                      <span className={getInterestStatusClass(interest.status)}>
                        {formatInterestStatus(interest.status)}
                      </span>
                      <span className={getReviewStatusClass(review?.status)}>
                        {review ? formatReviewStatus(review.status) : "No review"}
                      </span>
                    </div>
                  </div>

                  <div className="review-card-progress">
                    <span className={volunteerAccepted ? "complete" : ""}>
                      <strong>1</strong>
                      Choose volunteer
                    </span>
                    <span className={volunteerStatusMoved ? "complete" : ""}>
                      <strong>2</strong>
                      Update status
                    </span>
                    <span className={hasSavedSkill ? "complete" : ""}>
                      <strong>3</strong>
                      Choose skills
                    </span>
                    <span className={hasComment ? "complete" : ""}>
                      <strong>4</strong>
                      Add comment
                    </span>
                    <span className={hasReview ? "complete" : ""}>
                      <strong>5</strong>
                      Visibility
                    </span>
                    <span className={reviewShared ? "complete" : ""}>
                      <strong>6</strong>
                      Pathway evidence
                    </span>
                  </div>

                  <ReviewStepSection
                    stepNumber={1}
                    icon="👤"
                    title="Choose and review this volunteer"
                    description="Check the volunteer’s profile links, message, goals, interests and skills before deciding the next step."
                    isComplete={true}
                  >
                    <VolunteerFitSummary
                      opportunity={opportunity}
                      interest={interest}
                      sharedReviewHistoryCount={sharedReviewHistoryCount}
                    />

                    <div className="review-volunteer-meta">
                      <p>
                        <strong>Registered:</strong>{" "}
                        {formatDate(interest.created_at)}
                      </p>
                      <p>
                        <strong>Goals:</strong>{" "}
                        {formatList(interest.volunteer_goals)}
                      </p>
                      <p>
                        <strong>Interests:</strong>{" "}
                        {formatList(interest.volunteer_interests)}
                      </p>
                      <p>
                        <strong>Skills:</strong>{" "}
                        {formatList(interest.volunteer_skills)}
                      </p>
                    </div>

                    {interest.message ? (
                      <div className="review-message-box">
                        <p className="dashboard-card-label">Volunteer message</p>
                        <p>{interest.message}</p>
                      </div>
                    ) : null}
                  </ReviewStepSection>

                  <ReviewStepSection
                    stepNumber={2}
                    icon="✅"
                    title="Update volunteer status"
                    description="Move the volunteer from new interest to contacted, accepted or closed when the next step is clear."
                    isComplete={volunteerStatusMoved}
                  >
                    <form
                      action={updateOpportunityInterestStatus}
                      className="interest-status-form"
                    >
                      <input
                        type="hidden"
                        name="opportunity_id"
                        value={opportunity.id}
                      />
                      <input
                        type="hidden"
                        name="opportunity_interest_id"
                        value={interest.id}
                      />

                      <label className="field-label">
                        <span className="field-label-row">
                          <span className="field-label-icon" aria-hidden="true">
                            🧭
                          </span>
                          <span>Volunteer status</span>
                        </span>
                        <select
                          name="interest_status"
                          defaultValue={normaliseInterestStatus(interest.status)}
                        >
                          <option value="new">New interest</option>
                          <option value="contacted">Contacted</option>
                          <option value="accepted">Accepted / move forward</option>
                          <option value="closed">Closed / not progressing</option>
                        </select>
                      </label>

                      <button type="submit" className="secondary-button">
                        <span className="button-balanced-inner">
                          <span aria-hidden="true">✅</span>
                          <span>Update volunteer status</span>
                        </span>
                      </button>
                    </form>
                  </ReviewStepSection>

                  <form action={saveVolunteerSkillReview} className="review-form">
                    <input
                      type="hidden"
                      name="opportunity_id"
                      value={opportunity.id}
                    />
                    <input
                      type="hidden"
                      name="opportunity_interest_id"
                      value={interest.id}
                    />

                    <ReviewStepSection
                      stepNumber={3}
                      icon="⭐"
                      title="Choose positive skills shown"
                      description="Tick the positive skills the volunteer has shown, practised or started to build."
                      isComplete={hasSavedSkill}
                    >
                      <fieldset className="review-fieldset">
                        <legend>
                          <span className="field-label-row">
                            <span className="field-label-icon" aria-hidden="true">
                              ⭐
                            </span>
                            <span>Positive skills shown</span>
                          </span>
                        </legend>

                        <ReviewSkillGrid review={review} />
                      </fieldset>
                    </ReviewStepSection>

                    <ReviewStepSection
                      stepNumber={4}
                      icon="💬"
                      title="Add a supportive comment"
                      description="Optional, but very useful. Keep it positive, specific and encouraging."
                      isComplete={hasComment}
                    >
                      <label className="field-label">
                        <span className="field-label-row">
                          <span className="field-label-icon" aria-hidden="true">
                            💬
                          </span>
                          <span>Positive comment for the volunteer optional</span>
                        </span>
                        <textarea
                          name="positive_comment"
                          rows={4}
                          defaultValue={review?.positive_comment || ""}
                          placeholder="Example: You were friendly, reliable and willing to try new tasks. Thank you for helping the team."
                        />
                      </label>

                      <label className="field-label">
                        <span className="field-label-row">
                          <span className="field-label-icon" aria-hidden="true">
                            📝
                          </span>
                          <span>Private organisation note optional</span>
                        </span>
                        <textarea
                          name="private_organisation_note"
                          rows={3}
                          defaultValue={review?.private_organisation_note || ""}
                          placeholder="Optional note for your organisation only. This is not shown to the volunteer."
                        />
                      </label>
                    </ReviewStepSection>

                    <ReviewStepSection
                      stepNumber={5}
                      icon="📌"
                      title="Choose review visibility"
                      description="Choose whether this review is shared with the volunteer pathway, saved as draft, or hidden."
                      isComplete={hasReview}
                    >
                      <label className="field-label">
                        <span className="field-label-row">
                          <span className="field-label-icon" aria-hidden="true">
                            📌
                          </span>
                          <span>Review visibility</span>
                        </span>
                        <select name="status" defaultValue={review?.status || "shared"}>
                          <option value="shared">
                            Shared with volunteer pathway
                          </option>
                          <option value="draft">Save as draft</option>
                          <option value="hidden">Hidden from volunteer</option>
                        </select>
                      </label>
                    </ReviewStepSection>

                    <ReviewStepSection
                      stepNumber={6}
                      icon="🌱"
                      title="Save pathway evidence"
                      description="Save the review. Shared reviews can support the volunteer’s Positive Pathway CV."
                      isComplete={reviewShared}
                    >
                      <div className="review-save-panel">
                        <div>
                          <p className="dashboard-card-label">Pathway evidence</p>
                          <h3>Ready to save this positive review</h3>
                          <p>
                            Saving as shared can add positive evidence to the
                            volunteer’s pathway. Draft and hidden reviews stay
                            under organisation control.
                          </p>
                        </div>

                        <button type="submit" className="primary-button">
                          <span className="button-balanced-inner">
                            <span aria-hidden="true">✅</span>
                            <span>Save skills review</span>
                          </span>
                        </button>
                      </div>
                    </ReviewStepSection>
                  </form>
                </article>
              );
            })}
          </section>
        )}
      </section>

      <style>{`
        .review-page,
        .review-page * {
          box-sizing: border-box;
        }

        .review-topbar-actions,
        .review-hero-actions {
          gap: 12px;
        }

        .review-progress-summary {
          display: grid;
          gap: 8px;
          margin: 14px 0;
        }

        .review-progress-label {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          color: #60706a;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .review-progress-label strong {
          color: #315f48;
        }

        .review-progress-meter {
          width: 100%;
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
        }

        .review-progress-meter span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8fb29e, #4f8d68);
        }

        .review-guide-panel {
          display: grid;
          gap: 18px;
          margin: 22px 0;
          padding: 20px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.92), rgba(255, 255, 255, 0.9));
          box-shadow: 0 18px 42px rgba(33, 56, 48, 0.07);
        }

        .review-guide-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .review-guide-heading > span {
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

        .review-guide-heading h2 {
          margin: 0 0 8px;
          color: #4f4b82;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .review-guide-heading p {
          margin: 0;
          color: #5f6072;
          font-weight: 760;
          line-height: 1.5;
        }

        .review-guide-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .review-guide-step {
          position: relative;
          display: grid;
          gap: 10px;
          min-height: 178px;
          padding: 15px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 12px 28px rgba(33, 56, 48, 0.05);
        }

        .review-guide-step-complete {
          border-color: rgba(34, 124, 78, 0.26);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.28), transparent 34%),
            rgba(244, 255, 249, 0.92);
          box-shadow: 0 14px 30px rgba(33, 96, 61, 0.08);
        }

        .review-guide-step-number {
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

        .review-guide-step-complete .review-guide-step-number {
          background: rgba(34, 124, 78, 0.14);
          color: #145c38;
        }

        .review-guide-step-icon {
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

        .review-guide-step-complete .review-guide-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .review-guide-step-copy {
          display: grid;
          gap: 6px;
        }

        .review-guide-step-kicker {
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

        .review-guide-step-kicker span {
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

        .review-guide-step-complete .review-guide-step-kicker,
        .review-guide-step-complete .review-guide-step-kicker span {
          color: #145c38;
        }

        .review-guide-step-complete .review-guide-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .review-guide-step-copy h3 {
          margin: 0;
          padding-right: 32px;
          color: #315f48;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.14;
        }

        .review-guide-step-copy p {
          margin: 0;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 740;
          line-height: 1.42;
        }

        .review-pathway-explainer {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
          margin: 22px 0;
          padding: 20px;
          border: 1px solid rgba(34, 124, 78, 0.24);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.4), transparent 32%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.94), rgba(255, 255, 255, 0.9));
          box-shadow: 0 18px 42px rgba(33, 96, 61, 0.1);
        }

        .review-pathway-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.16);
          font-size: 1.9rem;
        }

        .review-pathway-explainer h2 {
          margin: 0 0 8px;
          color: #145c38;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .review-pathway-explainer p {
          margin: 0;
          color: #275f45;
          font-weight: 780;
          line-height: 1.5;
        }

        .review-count-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .review-count-card {
          display: grid;
          gap: 8px;
          min-height: 112px;
          padding: 18px;
          border: 1px solid rgba(143, 178, 158, 0.22);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 14px 38px rgba(33, 56, 48, 0.07);
        }

        .review-count-card span {
          color: #60706a;
          font-weight: 900;
        }

        .review-count-card strong {
          color: #315f48;
          font-size: 2rem;
          line-height: 1;
        }

        .count-new {
          border-color: rgba(108, 92, 160, 0.16);
        }

        .count-contacted {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .count-accepted {
          border-color: rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.92);
        }

        .count-closed {
          border-color: rgba(100, 100, 110, 0.16);
          background: rgba(248, 248, 252, 0.86);
        }

        .review-list {
          display: grid;
          gap: 18px;
        }

        .review-card {
          display: grid;
          gap: 18px;
          border-radius: 28px;
        }

        .review-card-header {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-start;
          justify-content: space-between;
        }

        .review-volunteer-title {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
          min-width: 0;
        }

        .review-volunteer-title h2 {
          margin: 0 0 6px;
          color: #315f48;
          overflow-wrap: anywhere;
        }

        .review-volunteer-title p {
          margin: 0;
          color: #60706a;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .review-status-stack {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
        }

        .review-status,
        .interest-status {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 0.86rem;
          font-weight: 950;
          line-height: 1.1;
          white-space: nowrap;
        }

        .status-new {
          border: 1px solid rgba(108, 92, 160, 0.18);
          background: rgba(248, 245, 255, 0.96);
          color: #6c5ca0;
        }

        .status-contacted {
          border: 1px solid rgba(74, 112, 160, 0.22);
          background: rgba(243, 249, 255, 0.96);
          color: #4a70a0;
        }

        .status-accepted {
          border: 1px solid rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.96);
          color: #536f63;
        }

        .status-closed {
          border: 1px solid rgba(100, 100, 110, 0.18);
          background: rgba(248, 248, 252, 0.96);
          color: #5d6677;
        }

        .status-shared {
          border: 1px solid rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.96);
          color: #536f63;
        }

        .status-draft {
          border: 1px solid rgba(190, 118, 76, 0.26);
          background: rgba(255, 248, 240, 0.96);
          color: #8a4b16;
        }

        .status-hidden {
          border: 1px solid rgba(100, 100, 110, 0.18);
          background: rgba(248, 248, 252, 0.96);
          color: #5d6677;
        }

        .review-card-progress {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
        }

        .review-card-progress span {
          display: grid;
          gap: 6px;
          min-height: 76px;
          padding: 10px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 16px;
          background: rgba(248, 248, 252, 0.88);
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 850;
          line-height: 1.2;
        }

        .review-card-progress span.complete {
          border-color: rgba(34, 124, 78, 0.24);
          background: rgba(244, 255, 249, 0.94);
          color: #145c38;
        }

        .review-card-progress strong {
          display: inline-flex;
          width: 28px;
          height: 28px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.1);
          color: #6c5ca0;
          font-size: 0.78rem;
          font-weight: 950;
        }

        .review-card-progress span.complete strong {
          background: rgba(34, 124, 78, 0.14);
          color: #145c38;
        }

        .review-step-section {
          display: grid;
          gap: 16px;
          padding: 18px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.66);
          box-shadow: 0 12px 28px rgba(33, 56, 48, 0.04);
        }

        .review-step-complete {
          border-color: rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.18), transparent 34%),
            rgba(244, 255, 249, 0.86);
        }

        .review-step-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .review-step-icon {
          display: inline-flex;
          width: 54px;
          height: 54px;
          align-items: center;
          justify-content: center;
          border-radius: 19px;
          background: rgba(143, 178, 158, 0.14);
          box-shadow: inset 0 0 0 1px rgba(83, 111, 99, 0.08);
          font-size: 1.6rem;
        }

        .review-step-complete .review-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .review-step-copy {
          display: grid;
          gap: 7px;
          min-width: 0;
        }

        .review-step-kicker {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin: 0;
          color: #6c5ca0;
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .review-step-kicker span {
          display: inline-flex;
          min-height: 26px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 5px 9px;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.1);
          color: #6c5ca0;
          font-size: 0.72rem;
          letter-spacing: 0;
          text-transform: none;
        }

        .review-step-complete .review-step-kicker,
        .review-step-complete .review-step-kicker span {
          color: #145c38;
        }

        .review-step-complete .review-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .review-step-copy h3 {
          margin: 0;
          color: #315f48;
          font-size: clamp(1.15rem, 3vw, 1.42rem);
          font-weight: 950;
          letter-spacing: -0.03em;
          line-height: 1.12;
        }

        .review-step-copy p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.45;
        }

        .review-step-body {
          display: grid;
          gap: 14px;
        }

        .volunteer-fit-panel {
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 22px;
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.72), rgba(255, 255, 255, 0.82)),
            rgba(255, 255, 255, 0.72);
        }

        .volunteer-fit-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
        }

        .volunteer-fit-icon {
          display: inline-flex;
          width: 50px;
          height: 50px;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: rgba(143, 178, 158, 0.16);
          font-size: 1.55rem;
        }

        .volunteer-fit-heading h3 {
          margin: 0 0 6px;
          color: #315f48;
          font-size: 1.1rem;
          font-weight: 950;
          line-height: 1.15;
        }

        .volunteer-fit-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.45;
        }

        .volunteer-fit-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .volunteer-fit-card {
          display: grid;
          gap: 8px;
          min-height: 118px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
        }

        .volunteer-fit-ready {
          border-color: rgba(83, 111, 99, 0.22);
          background: rgba(244, 255, 249, 0.9);
        }

        .volunteer-fit-neutral {
          border-color: rgba(108, 92, 160, 0.14);
          background: rgba(248, 248, 252, 0.9);
        }

        .volunteer-fit-card-icon {
          display: inline-flex;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
          font-size: 1.25rem;
        }

        .volunteer-fit-label {
          margin: 0 0 4px !important;
          color: #315f48 !important;
          font-size: 0.82rem;
          font-weight: 950 !important;
          line-height: 1.1 !important;
        }

        .volunteer-fit-card p {
          margin: 0;
          color: #60706a;
          font-size: 0.86rem;
          font-weight: 750;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .interest-status-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: end;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.66);
        }

        .interest-status-form .secondary-button {
          min-height: 48px;
          white-space: nowrap;
        }

        .review-volunteer-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 14px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.66);
        }

        .review-volunteer-meta p {
          margin: 0;
          color: #5d6677;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .review-message-box {
          display: grid;
          gap: 8px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.74);
        }

        .review-message-box p {
          margin: 0;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.5;
        }

        .review-form {
          display: grid;
          gap: 16px;
        }

        .review-fieldset {
          min-width: 0;
          margin: 0;
          padding: 0;
          border: 0;
          display: grid;
          gap: 12px;
        }

        .review-fieldset legend {
          padding: 0;
          color: #315f48;
          font-weight: 950;
        }

        .review-skill-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .review-skill-card {
          min-height: 94px;
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          padding: 14px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
          cursor: pointer;
          transition:
            border-color 160ms ease,
            background 160ms ease,
            box-shadow 160ms ease,
            transform 160ms ease;
        }

        .review-skill-card:hover {
          transform: translateY(-1px);
          border-color: rgba(83, 111, 99, 0.34);
          background: rgba(255, 255, 255, 0.92);
        }

        .review-skill-card input {
          position: absolute;
          inset: 12px auto auto 12px;
          width: 24px;
          height: 24px;
          accent-color: #536f63;
          cursor: pointer;
        }

        .review-skill-card:has(input:checked) {
          border-color: rgba(83, 111, 99, 0.68);
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.96), rgba(255, 255, 255, 0.94));
          box-shadow:
            0 18px 42px rgba(33, 56, 48, 0.12),
            0 0 0 4px rgba(83, 111, 99, 0.12);
        }

        .review-skill-card:has(input:checked)::after {
          content: "Selected";
          position: absolute;
          top: 12px;
          right: 12px;
          display: inline-flex;
          min-height: 28px;
          align-items: center;
          justify-content: center;
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(83, 111, 99, 0.12);
          color: #315f48;
          font-size: 0.75rem;
          font-weight: 950;
          line-height: 1;
        }

        .review-skill-card:has(input:checked) .review-skill-icon {
          background: rgba(83, 111, 99, 0.14);
          box-shadow:
            inset 0 0 0 1px rgba(83, 111, 99, 0.18),
            0 8px 18px rgba(33, 56, 48, 0.08);
        }

        .review-skill-card:has(input:checked) .review-skill-title {
          color: #24352f;
        }

        .review-skill-icon {
          width: 48px;
          height: 48px;
          margin-top: 20px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.45rem;
        }

        .review-skill-copy {
          display: grid;
          gap: 4px;
          padding-top: 4px;
          padding-right: 78px;
        }

        .review-skill-title {
          color: #315f48;
          font-weight: 950;
        }

        .review-skill-copy small {
          color: #60706a;
          line-height: 1.35;
          font-weight: 700;
        }

        .review-empty-card {
          min-height: 220px;
          align-items: center;
        }

        .review-save-panel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
          padding: 16px;
          border: 1px solid rgba(34, 124, 78, 0.2);
          border-radius: 20px;
          background: rgba(244, 255, 249, 0.88);
        }

        .review-save-panel h3 {
          margin: 0 0 6px;
          color: #145c38;
          font-size: 1.12rem;
          font-weight: 950;
          line-height: 1.15;
        }

        .review-save-panel p {
          margin: 0;
          color: #275f45;
          font-weight: 750;
          line-height: 1.45;
        }

        .review-save-panel .primary-button {
          white-space: nowrap;
        }

        @media (max-width: 1180px) {
          .volunteer-fit-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .review-card-progress,
          .review-guide-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 960px) {
          .review-count-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .interest-status-form,
          .review-save-panel {
            grid-template-columns: 1fr;
          }

          .interest-status-form .secondary-button,
          .review-save-panel .primary-button {
            width: 100%;
          }

          .review-guide-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .review-topbar {
            gap: 14px;
          }

          .review-topbar-actions {
            width: 100%;
            justify-content: stretch;
          }

          .review-topbar-actions > *,
          .review-topbar-actions a,
          .review-topbar-actions button {
            width: 100%;
          }

          .review-hero {
            padding: 24px 20px;
          }

          .review-hero .dashboard-title {
            font-size: 2.2rem !important;
            line-height: 1.04 !important;
          }

          .review-hero-actions {
            width: 100%;
          }

          .review-hero-actions .primary-button,
          .review-hero-actions .secondary-button {
            width: 100%;
          }

          .review-guide-heading,
          .review-pathway-explainer,
          .review-step-heading {
            grid-template-columns: 1fr;
          }

          .review-guide-panel,
          .review-pathway-explainer,
          .review-step-section {
            padding: 18px;
            border-radius: 24px;
          }

          .review-guide-heading > span,
          .review-pathway-icon,
          .review-step-icon {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .review-card {
            padding: 20px;
          }

          .review-card-header,
          .review-volunteer-title,
          .volunteer-fit-heading {
            display: grid;
          }

          .review-status-stack {
            justify-content: flex-start;
          }

          .review-volunteer-meta,
          .review-skill-grid,
          .volunteer-fit-grid,
          .review-card-progress,
          .review-guide-grid {
            grid-template-columns: 1fr;
          }

          .review-card-progress span {
            min-height: 0;
            grid-template-columns: auto 1fr;
            align-items: center;
          }

          .review-skill-card {
            min-height: 108px;
            grid-template-columns: auto 1fr;
            padding: 16px 14px;
          }

          .review-skill-card input {
            width: 26px;
            height: 26px;
          }

          .review-skill-card:has(input:checked)::after {
            top: 14px;
            right: 14px;
          }

          .review-skill-copy {
            padding-right: 82px;
          }
        }

        @media (max-width: 560px) {
          .review-count-grid {
            grid-template-columns: 1fr;
          }

          .review-count-card {
            min-height: 92px;
          }

          .review-status,
          .interest-status {
            width: 100%;
          }

          .review-skill-card {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .review-skill-icon {
            margin-top: 32px;
          }

          .review-skill-copy {
            padding-right: 0;
          }

          .review-skill-card:has(input:checked)::after {
            font-size: 0.72rem;
          }
        }
      `}</style>
    </main>
  );
}
