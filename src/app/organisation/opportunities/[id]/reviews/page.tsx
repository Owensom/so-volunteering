import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { saveVolunteerSkillReview } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type Opportunity = {
  id: string;
  title: string;
  summary: string;
  status: string;
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

function formatInterestStatus(status: string) {
  if (status === "accepted") return "Accepted";
  if (status === "contacted") return "Contacted";
  if (status === "closed") return "Closed";
  return "New interest";
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

function getReviewStatusClass(status: string | null | undefined) {
  if (status === "draft") return "review-status status-draft";
  if (status === "hidden") return "review-status status-hidden";
  return "review-status status-shared";
}

function hasAnySkill(review: SkillReview | undefined) {
  if (!review) return false;

  return skillOptions.some((option) => review[option.key] === true);
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
    .select("id,title,summary,status")
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

  const sharedReviewCount = reviewRows.filter(
    (review) => review.status === "shared",
  ).length;

  const draftReviewCount = reviewRows.filter(
    (review) => review.status === "draft",
  ).length;

  const listenText =
    "This is the positive skills review page for this opportunity. It shows volunteers who registered interest. For each volunteer, tick the positive skills they showed, add an optional encouraging comment, choose whether the review is shared with the volunteer, and save. Shared reviews can become part of the volunteer pathway. Private organisation notes are only for the organisation.";

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
            <p className="dashboard-kicker">Positive pathway</p>

            <h1 id="reviews-title" className="dashboard-title">
              <span aria-hidden="true">⭐</span>
              <span>Skills reviews</span>
            </h1>

            <p className="dashboard-lead">
              Review positive skills shown by volunteers for{" "}
              <strong>{opportunity.title}</strong>. Keep feedback encouraging,
              simple and practical.
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
                <h2>Review summary</h2>
                <p>
                  {interestRows.length} volunteer
                  {interestRows.length === 1 ? "" : "s"} registered interest.
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Shared reviews: <strong>{sharedReviewCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Draft reviews: <strong>{draftReviewCount}</strong>
            </p>
          </aside>
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
                  here and you can add a positive skills review after they have
                  helped.
                </p>
              </div>
            </article>
          </section>
        ) : (
          <section className="review-list" aria-label="Volunteer reviews">
            {interestRows.map((interest) => {
              const review = reviewByInterestId.get(interest.id);
              const hasSavedSkill = hasAnySkill(review);

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
                            : "🌱"}
                      </span>

                      <div>
                        <p className="dashboard-card-label">
                          {formatInterestStatus(interest.status)}
                        </p>
                        <h2>
                          {interest.volunteer_name ||
                            interest.volunteer_email ||
                            "Volunteer"}
                        </h2>
                        <p>
                          {interest.volunteer_email || "No email supplied"}
                          {interest.volunteer_city
                            ? ` · ${interest.volunteer_city}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <span className={getReviewStatusClass(review?.status)}>
                      {review ? formatReviewStatus(review.status) : "No review"}
                    </span>
                  </div>

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

                    <button type="submit" className="primary-button">
                      <span className="button-balanced-inner">
                        <span aria-hidden="true">✅</span>
                        <span>Save skills review</span>
                      </span>
                    </button>
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

        .review-status {
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
        }

        .review-skill-card input {
          position: absolute;
          inset: 12px auto auto 12px;
          width: 22px;
          height: 22px;
          accent-color: #8fb29e;
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

        .review-form .primary-button {
          width: fit-content;
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

          .review-card {
            padding: 20px;
          }

          .review-card-header,
          .review-volunteer-title {
            display: grid;
          }

          .review-volunteer-meta,
          .review-skill-grid {
            grid-template-columns: 1fr;
          }

          .review-form .primary-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
