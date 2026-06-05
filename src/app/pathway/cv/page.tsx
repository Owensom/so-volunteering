import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  full_name: string | null;
  email: string | null;
  user_type: string | null;
  phone: string | null;
};

type VolunteerProfile = {
  city: string | null;
  goals: string[] | null;
  interests: string[] | null;
  skills: string[] | null;
  bio: string | null;
  availability_notes: string | null;
  preferred_contact_method: string | null;
  volunteering_preference: string | null;
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

function formatList(values: string[] | null | undefined) {
  if (!Array.isArray(values) || values.length === 0) {
    return "Not added yet";
  }

  return values.join(", ");
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

function getAllRecognisedSkills(reviews: SkillReview[]) {
  const recognisedSkills = new Map<string, { label: string; icon: string; count: number }>();

  reviews.forEach((review) => {
    getReviewSkills(review).forEach((skill) => {
      const current = recognisedSkills.get(skill.key);

      recognisedSkills.set(skill.key, {
        label: skill.label,
        icon: skill.icon,
        count: current ? current.count + 1 : 1,
      });
    });
  });

  return Array.from(recognisedSkills.entries()).map(([key, value]) => ({
    key,
    ...value,
  }));
}

function getProfileCompletion(profile: VolunteerProfile | null) {
  if (!profile) return 0;

  const checks = [
    Boolean(profile.city?.trim()),
    Array.isArray(profile.goals) && profile.goals.length > 0,
    Array.isArray(profile.interests) && profile.interests.length > 0,
    Array.isArray(profile.skills) && profile.skills.length > 0,
    Boolean(profile.availability_notes?.trim()),
  ];

  return checks.filter(Boolean).length;
}

function SummaryPill({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <span className="summary-pill">
      <span aria-hidden="true">{icon}</span>
      <span>
        <strong>{value}</strong> {label}
      </span>
    </span>
  );
}

function CvSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cv-section">
      <div className="cv-section-heading">
        <span aria-hidden="true">{icon}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default async function PositivePathwayCvPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,user_type,phone")
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
      "city,goals,interests,skills,bio,availability_notes,preferred_contact_method,volunteering_preference",
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const { data: skillReviews } = await supabase
    .from("volunteer_skill_reviews")
    .select(
      "id,opportunity_title,reliability,teamwork,communication,confidence,kindness,problem_solving,following_instructions,initiative,timekeeping,practical_skills,community_interaction,positive_comment,created_at,updated_at",
    )
    .eq("volunteer_user_id", user.id)
    .eq("status", "shared")
    .order("updated_at", { ascending: false });

  const reviews = (skillReviews as SkillReview[] | null) ?? [];
  const recognisedSkills = getAllRecognisedSkills(reviews);
  const completionCount = getProfileCompletion(volunteerProfile);
  const displayName = profile?.full_name?.trim() || "Volunteer";
  const contactEmail = profile?.email || user.email || "Not added yet";

  const listenText =
    `This is your Positive Pathway CV. It brings together your goals, interests, skills, availability and positive skills reviews shared by organisations. You currently have ${reviews.length} shared review${reviews.length === 1 ? "" : "s"} and ${recognisedSkills.length} recognised skill area${recognisedSkills.length === 1 ? "" : "s"}. This page is read only for now. You can use your pathway to update your details.`;

  return (
    <main className="dashboard-bg positive-cv-page">
      <section className="dashboard-shell">
        <header className="dashboard-topbar positive-cv-topbar">
          <Link
            href="/pathway"
            className="dashboard-brand"
            aria-label="Back to pathway"
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

          <div className="dashboard-topbar-actions positive-cv-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href="/pathway"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Back to pathway</span>
              </span>
            </Link>

            <Link
              href="/dashboard"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">🏠</span>
                <span>Dashboard</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card positive-cv-hero"
          aria-labelledby="positive-cv-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Positive pathway CV</p>

            <h1 id="positive-cv-title" className="dashboard-title">
              <span aria-hidden="true">🌟</span>
              <span>{displayName}</span>
            </h1>

            <p className="dashboard-lead">
              A strengths-based summary of your volunteering pathway, skills and
              positive feedback.
            </p>

            <div className="positive-cv-summary-pills" aria-label="CV summary">
              <SummaryPill
                icon="✅"
                label="profile steps added"
                value={`${completionCount}/5`}
              />
              <SummaryPill
                icon="⭐"
                label={`review${reviews.length === 1 ? "" : "s"}`}
                value={reviews.length}
              />
              <SummaryPill
                icon="🌱"
                label={`recognised skill area${
                  recognisedSkills.length === 1 ? "" : "s"
                }`}
                value={recognisedSkills.length}
              />
            </div>
          </div>

          <aside className="dashboard-progress-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                📄
              </span>
              <div>
                <h2>Read-only preview</h2>
                <p>
                  This is the first version of the Positive Pathway CV. Export
                  and sharing can come later.
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Email: <strong>{contactEmail}</strong>
            </p>

            {volunteerProfile?.city ? (
              <p className="dashboard-progress-note">
                Area: <strong>{volunteerProfile.city}</strong>
              </p>
            ) : null}
          </aside>
        </section>

        <section className="positive-cv-document" aria-label="Positive Pathway CV">
          <CvSection icon="👤" title="About me">
            <div className="cv-detail-grid">
              <p>
                <strong>Name:</strong> {displayName}
              </p>
              <p>
                <strong>Email:</strong> {contactEmail}
              </p>
              <p>
                <strong>Phone:</strong> {profile?.phone || "Not added yet"}
              </p>
              <p>
                <strong>Area:</strong>{" "}
                {volunteerProfile?.city || "Not added yet"}
              </p>
            </div>

            {volunteerProfile?.bio ? (
              <div className="cv-note-box">
                <p>{volunteerProfile.bio}</p>
              </div>
            ) : null}
          </CvSection>

          <CvSection icon="🌱" title="My goals">
            <p className="cv-body-text">{formatList(volunteerProfile?.goals)}</p>
          </CvSection>

          <CvSection icon="💚" title="Interests">
            <p className="cv-body-text">
              {formatList(volunteerProfile?.interests)}
            </p>
          </CvSection>

          <CvSection icon="⭐" title="Skills I have or want to build">
            <p className="cv-body-text">{formatList(volunteerProfile?.skills)}</p>
          </CvSection>

          <CvSection icon="📅" title="Availability and preferences">
            <div className="cv-detail-grid">
              <p>
                <strong>Availability:</strong>{" "}
                {volunteerProfile?.availability_notes || "Not added yet"}
              </p>
              <p>
                <strong>Preferred contact:</strong>{" "}
                {volunteerProfile?.preferred_contact_method || "Not added yet"}
              </p>
              <p>
                <strong>Volunteering preference:</strong>{" "}
                {volunteerProfile?.volunteering_preference || "Not added yet"}
              </p>
            </div>
          </CvSection>

          <CvSection icon="🏅" title="Recognised strengths">
            {recognisedSkills.length > 0 ? (
              <div className="recognised-skill-grid">
                {recognisedSkills.map((skill) => (
                  <span key={skill.key} className="recognised-skill-card">
                    <span aria-hidden="true">{skill.icon}</span>
                    <span>{skill.label}</span>
                    <small>
                      recognised {skill.count} time{skill.count === 1 ? "" : "s"}
                    </small>
                  </span>
                ))}
              </div>
            ) : (
              <p className="cv-body-text">
                Shared skills reviews will appear here after organisations add
                positive feedback.
              </p>
            )}
          </CvSection>

          <CvSection icon="💬" title="Positive feedback">
            {reviews.length > 0 ? (
              <div className="feedback-list">
                {reviews.map((review) => {
                  const reviewSkills = getReviewSkills(review);

                  return (
                    <article key={review.id} className="feedback-card">
                      <div className="feedback-card-header">
                        <div>
                          <h3>{review.opportunity_title || "Volunteering activity"}</h3>
                          <p>Shared on {formatDate(review.updated_at || review.created_at)}</p>
                        </div>
                      </div>

                      {reviewSkills.length > 0 ? (
                        <div className="feedback-skill-row">
                          {reviewSkills.map((skill) => (
                            <span key={skill.key}>
                              <span aria-hidden="true">{skill.icon}</span>
                              {skill.label}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {review.positive_comment ? (
                        <p className="feedback-comment">
                          “{review.positive_comment}”
                        </p>
                      ) : (
                        <p className="feedback-comment muted">
                          No written comment was added for this review.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="cv-body-text">
                Positive comments from organisations will appear here once they
                are shared with you.
              </p>
            )}
          </CvSection>
        </section>

        <section className="positive-cv-footer-actions" aria-label="CV actions">
          <Link href="/pathway" className="primary-button">
            <span className="dashboard-button-inner">
              <span aria-hidden="true">🌱</span>
              <span>Back to pathway</span>
            </span>
          </Link>

          <Link href="/profile" className="secondary-button">
            <span className="dashboard-button-inner">
              <span aria-hidden="true">👤</span>
              <span>Update my profile</span>
            </span>
          </Link>
        </section>
      </section>

      <style>{`
        .positive-cv-page,
        .positive-cv-page * {
          box-sizing: border-box;
        }

        .positive-cv-actions {
          gap: 10px;
        }

        .positive-cv-summary-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }

        .summary-pill {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px 13px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.9);
          color: #536f63;
          font-weight: 900;
        }

        .positive-cv-document {
          padding: clamp(20px, 4vw, 34px);
          border: 1px solid rgba(143, 178, 158, 0.24);
          border-radius: 32px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 24px 70px rgba(38, 50, 56, 0.08);
          display: grid;
          gap: 18px;
        }

        .cv-section {
          padding: 18px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.42), rgba(255, 255, 255, 0.9));
          display: grid;
          gap: 14px;
        }

        .cv-section-heading {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .cv-section-heading > span {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.35rem;
        }

        .cv-section-heading h2 {
          margin: 0;
          color: #315f48;
          font-size: 1.2rem;
          letter-spacing: -0.02em;
        }

        .cv-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 16px;
        }

        .cv-detail-grid p,
        .cv-body-text,
        .cv-note-box p {
          margin: 0;
          color: #4f625b;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        .cv-note-box {
          padding: 14px;
          border: 1px solid rgba(143, 178, 158, 0.18);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
        }

        .recognised-skill-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .recognised-skill-card {
          min-height: 92px;
          padding: 14px;
          border: 1px solid rgba(143, 178, 158, 0.2);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.86);
          display: grid;
          gap: 5px;
          align-content: start;
          color: #315f48;
          font-weight: 950;
        }

        .recognised-skill-card > span:first-child {
          font-size: 1.45rem;
        }

        .recognised-skill-card small {
          color: #60706a;
          font-weight: 800;
          line-height: 1.35;
        }

        .feedback-list {
          display: grid;
          gap: 12px;
        }

        .feedback-card {
          padding: 16px;
          border: 1px solid rgba(143, 178, 158, 0.18);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.82);
          display: grid;
          gap: 12px;
        }

        .feedback-card h3 {
          margin: 0 0 4px;
          color: #315f48;
          overflow-wrap: anywhere;
        }

        .feedback-card p {
          margin: 0;
          color: #60706a;
          line-height: 1.5;
        }

        .feedback-skill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .feedback-skill-row span {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border: 1px solid rgba(143, 178, 158, 0.18);
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.86);
          color: #315f48;
          font-weight: 900;
          line-height: 1.1;
        }

        .feedback-comment {
          padding: 14px;
          border-radius: 18px;
          background: rgba(248, 245, 255, 0.72);
          color: #4f625b !important;
          font-weight: 750;
        }

        .feedback-comment.muted {
          background: rgba(248, 248, 252, 0.86);
          color: #60706a !important;
        }

        .positive-cv-footer-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        @media (max-width: 900px) {
          .recognised-skill-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .positive-cv-topbar {
            gap: 14px;
          }

          .positive-cv-actions {
            width: 100%;
            justify-content: stretch;
          }

          .positive-cv-actions > *,
          .positive-cv-actions a,
          .positive-cv-actions button {
            width: 100%;
          }

          .positive-cv-hero {
            padding: 24px 20px;
          }

          .positive-cv-hero .dashboard-title {
            font-size: 2.2rem !important;
            line-height: 1.04 !important;
          }

          .positive-cv-document {
            border-radius: 26px;
            padding: 16px;
          }

          .cv-detail-grid,
          .recognised-skill-grid {
            grid-template-columns: 1fr;
          }

          .summary-pill,
          .positive-cv-footer-actions .primary-button,
          .positive-cv-footer-actions .secondary-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
