import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { PrintButton } from "@/components/PrintButton";

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

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
};

type EducationEntry = {
  id: string;
  entry_type: string;
  institution_name: string | null;
  qualification_name: string;
  qualification_level: string | null;
  subject_or_area: string | null;
  year_started: string | null;
  year_completed: string | null;
  is_current: boolean;
  notes: string | null;
  display_order: number;
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

function getThemeLabel(colourTheme: string) {
  if (colourTheme === "calm_green") return "Calm green";
  if (colourTheme === "soft_blue") return "Soft blue";
  if (colourTheme === "warm_peach") return "Warm peach";
  if (colourTheme === "high_contrast") return "High contrast";
  if (colourTheme === "neon_arcade") return "Neon arcade";
  return "SO default";
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

function formatEducationType(value: string) {
  if (value === "school") return "School";
  if (value === "college") return "College";
  if (value === "university") return "University";
  if (value === "training_course") return "Training course";
  if (value === "online_course") return "Online course";
  if (value === "certificate") return "Certificate";
  if (value === "work_related_training") return "Work-related training";
  return "Other learning";
}

function formatEducationDates(entry: EducationEntry) {
  if (entry.is_current && entry.year_started) {
    return `${entry.year_started} – Present`;
  }

  if (entry.is_current) {
    return "Currently studying";
  }

  if (entry.year_started && entry.year_completed) {
    return `${entry.year_started} – ${entry.year_completed}`;
  }

  if (entry.year_completed) {
    return entry.year_completed;
  }

  if (entry.year_started) {
    return `Started ${entry.year_started}`;
  }

  return "";
}

function getReviewSkills(review: SkillReview) {
  return skillBadges.filter((skill) => review[skill.key] === true);
}

function getAllRecognisedSkills(reviews: SkillReview[]) {
  const recognisedSkills = new Map<
    string,
    { label: string; icon: string; count: number }
  >();

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

  const { data: preferences } = await supabase
    .from("volunteer_preferences")
    .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerPreferences>();

  const { data: educationEntries } = await supabase
    .from("volunteer_education_entries")
    .select(
      "id,entry_type,institution_name,qualification_name,qualification_level,subject_or_area,year_started,year_completed,is_current,notes,display_order",
    )
    .eq("volunteer_user_id", user.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const { data: skillReviews } = await supabase
    .from("volunteer_skill_reviews")
    .select(
      "id,opportunity_title,reliability,teamwork,communication,confidence,kindness,problem_solving,following_instructions,initiative,timekeeping,practical_skills,community_interaction,positive_comment,created_at,updated_at",
    )
    .eq("volunteer_user_id", user.id)
    .eq("status", "shared")
    .order("updated_at", { ascending: false });

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";

  const educationRows = (educationEntries as EducationEntry[] | null) ?? [];
  const reviews = (skillReviews as SkillReview[] | null) ?? [];
  const recognisedSkills = getAllRecognisedSkills(reviews);
  const completionCount = getProfileCompletion(volunteerProfile);
  const displayName = profile?.full_name?.trim() || "Volunteer";
  const contactEmail = profile?.email || user.email || "Not added yet";

  const listenText = simpleView
    ? `This is your Positive Pathway CV. It shows your details, learning, skills and feedback. You have ${educationRows.length} education entr${educationRows.length === 1 ? "y" : "ies"} and ${reviews.length} review${reviews.length === 1 ? "" : "s"}. Use Print or Save as PDF if you want a copy.`
    : `This is your Positive Pathway CV. It brings together your goals, interests, skills, education, qualifications, availability and positive skills reviews shared by organisations. You currently have ${educationRows.length} education entr${educationRows.length === 1 ? "y" : "ies"}, ${reviews.length} shared review${reviews.length === 1 ? "" : "s"} and ${recognisedSkills.length} recognised skill area${recognisedSkills.length === 1 ? "" : "s"}. Use Print or Save as PDF to open your browser print options. You can use your pathway and profile pages to update your details.`;

  const shellClassName = [
    "dashboard-bg",
    "positive-cv-page",
    getThemeClass(colourTheme),
    getTextClass(textSize),
    getViewClass(viewMode),
  ].join(" ");

  return (
    <main className={shellClassName}>
      <section className="dashboard-shell">
        <header className="dashboard-topbar positive-cv-topbar no-print">
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
            {listenMode === "always" || listenMode === "context" ? (
              <InclusiveAudioButton text={listenText} />
            ) : null}

            <PrintButton />

            <Link
              href="/pathway"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>{simpleView ? "Pathway" : "Back to pathway"}</span>
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
              <span aria-hidden="true">{avatarIcon}</span>
              <span>{displayName}</span>
            </h1>

            <p className="dashboard-lead">
              {simpleView
                ? "Your strengths, learning and feedback in one place."
                : "A strengths-based summary of your volunteering pathway, education, skills and positive feedback."}
            </p>

            <div className="positive-cv-summary-pills" aria-label="CV summary">
              {!simpleView ? (
                <SummaryPill
                  icon="✅"
                  label="profile steps added"
                  value={`${completionCount}/5`}
                />
              ) : null}

              <SummaryPill
                icon="📚"
                label={`education entr${educationRows.length === 1 ? "y" : "ies"}`}
                value={educationRows.length}
              />
              <SummaryPill
                icon="⭐"
                label={`review${reviews.length === 1 ? "" : "s"}`}
                value={reviews.length}
              />
              <SummaryPill
                icon="🌱"
                label={
                  simpleView
                    ? "skills"
                    : `recognised skill area${
                        recognisedSkills.length === 1 ? "" : "s"
                      }`
                }
                value={recognisedSkills.length}
              />
            </div>

            <div className="positive-cv-hero-actions no-print">
              <PrintButton
                label={simpleView ? "Print / PDF" : "Print / Save as PDF"}
              />
            </div>
          </div>

          <aside className="dashboard-progress-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                📄
              </span>
              <div>
                <h2>{simpleView ? "CV" : "CV preview"}</h2>
                <p>
                  {simpleView
                    ? "Save or print when ready."
                    : "Use Print / Save as PDF to save or share this page from your browser."}
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

            {detailedView ? (
              <p className="dashboard-progress-note">
                Theme: <strong>{getThemeLabel(colourTheme)}</strong>
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
              {!simpleView ? (
                <p>
                  <strong>Phone:</strong> {profile?.phone || "Not added yet"}
                </p>
              ) : null}
              <p>
                <strong>Area:</strong>{" "}
                {volunteerProfile?.city || "Not added yet"}
              </p>
            </div>

            {!simpleView && volunteerProfile?.bio ? (
              <div className="cv-note-box">
                <p>{volunteerProfile.bio}</p>
              </div>
            ) : null}
          </CvSection>

          <CvSection icon="🌱" title={simpleView ? "Goals" : "My goals"}>
            <p className="cv-body-text">{formatList(volunteerProfile?.goals)}</p>
          </CvSection>

          {!simpleView ? (
            <CvSection icon="💚" title="Interests">
              <p className="cv-body-text">
                {formatList(volunteerProfile?.interests)}
              </p>
            </CvSection>
          ) : null}

          <CvSection
            icon="⭐"
            title={simpleView ? "Skills" : "Skills I have or want to build"}
          >
            <p className="cv-body-text">{formatList(volunteerProfile?.skills)}</p>
          </CvSection>

          <CvSection
            icon="📚"
            title={simpleView ? "Education" : "Education & Qualifications"}
          >
            {educationRows.length > 0 ? (
              <div className="education-cv-list">
                {educationRows.map((entry) => {
                  const dateText = formatEducationDates(entry);

                  return (
                    <article key={entry.id} className="education-cv-entry">
                      <div>
                        <h3>{entry.qualification_name}</h3>
                        <p>
                          {entry.institution_name ||
                            formatEducationType(entry.entry_type)}
                          {dateText ? ` · ${dateText}` : ""}
                        </p>
                      </div>

                      {!simpleView ? (
                        <div className="education-cv-meta">
                          <span>{formatEducationType(entry.entry_type)}</span>

                          {entry.qualification_level ? (
                            <span>{entry.qualification_level}</span>
                          ) : null}

                          {entry.subject_or_area ? (
                            <span>{entry.subject_or_area}</span>
                          ) : null}

                          {entry.is_current ? <span>Current</span> : null}
                        </div>
                      ) : null}

                      {!simpleView && entry.notes ? (
                        <p className="education-cv-note">{entry.notes}</p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="cv-body-text">
                {simpleView
                  ? "Nothing added yet."
                  : "Education, training and qualifications can be added from your profile if you want them included here."}
              </p>
            )}
          </CvSection>

          {!simpleView ? (
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
          ) : null}

          <CvSection
            icon="🏅"
            title={simpleView ? "Strengths" : "Recognised strengths"}
          >
            {recognisedSkills.length > 0 ? (
              <div className="recognised-skill-grid">
                {recognisedSkills.map((skill) => (
                  <span key={skill.key} className="recognised-skill-card">
                    <span aria-hidden="true">{skill.icon}</span>
                    <span>{skill.label}</span>
                    {!simpleView ? (
                      <small>
                        recognised {skill.count} time
                        {skill.count === 1 ? "" : "s"}
                      </small>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : (
              <p className="cv-body-text">
                {simpleView
                  ? "Feedback will appear here."
                  : "Shared skills reviews will appear here after organisations add positive feedback."}
              </p>
            )}
          </CvSection>

          <CvSection
            icon="💬"
            title={simpleView ? "Feedback" : "Positive feedback"}
          >
            {reviews.length > 0 ? (
              <div className="feedback-list">
                {reviews.map((review) => {
                  const reviewSkills = getReviewSkills(review);

                  return (
                    <article key={review.id} className="feedback-card">
                      <div className="feedback-card-header">
                        <div>
                          <h3>
                            {review.opportunity_title ||
                              "Volunteering activity"}
                          </h3>
                          {!simpleView ? (
                            <p>
                              Shared on{" "}
                              {formatDate(review.updated_at || review.created_at)}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {!simpleView && reviewSkills.length > 0 ? (
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
                      ) : !simpleView ? (
                        <p className="feedback-comment muted">
                          No written comment was added for this review.
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="cv-body-text">
                {simpleView
                  ? "Comments will appear here."
                  : "Positive comments from organisations will appear here once they are shared with you."}
              </p>
            )}
          </CvSection>
        </section>

        <section
          className="positive-cv-footer-actions no-print"
          aria-label="CV actions"
        >
          <PrintButton label={simpleView ? "Print / PDF" : "Print / Save as PDF"} />

          <Link href="/profile/education" className="secondary-button">
            <span className="dashboard-button-inner">
              <span aria-hidden="true">📚</span>
              <span>{simpleView ? "Education" : "Edit education"}</span>
            </span>
          </Link>

          <Link href="/pathway" className="primary-button">
            <span className="dashboard-button-inner">
              <span aria-hidden="true">🌱</span>
              <span>{simpleView ? "Pathway" : "Back to pathway"}</span>
            </span>
          </Link>

          <Link href="/profile" className="secondary-button">
            <span className="dashboard-button-inner">
              <span aria-hidden="true">👤</span>
              <span>{simpleView ? "Profile" : "Update my profile"}</span>
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

        .print-button {
          border: 1px solid rgba(83, 111, 99, 0.28);
          cursor: pointer;
          font: inherit;
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
          max-width: 100%;
          overflow-wrap: anywhere;
        }

        .positive-cv-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .positive-cv-document {
          padding: clamp(20px, 4vw, 34px);
          border: 1px solid rgba(143, 178, 158, 0.24);
          border-radius: 32px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 24px 70px rgba(38, 50, 56, 0.08);
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .cv-section {
          padding: 18px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.42), rgba(255, 255, 255, 0.9));
          display: grid;
          gap: 14px;
          min-width: 0;
        }

        .cv-section-heading {
          display: flex;
          gap: 10px;
          align-items: center;
          min-width: 0;
        }

        .cv-section-heading > span {
          width: 42px;
          height: 42px;
          flex: 0 0 auto;
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
          overflow-wrap: anywhere;
        }

        .cv-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 16px;
          min-width: 0;
        }

        .cv-detail-grid p,
        .cv-detail-grid strong,
        .cv-body-text,
        .cv-note-box p,
        .dashboard-progress-note,
        .dashboard-progress-note strong {
          min-width: 0;
          max-width: 100%;
          margin: 0;
          color: #4f625b;
          line-height: 1.55;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .cv-note-box {
          padding: 14px;
          border: 1px solid rgba(143, 178, 158, 0.18);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
          min-width: 0;
        }

        .education-cv-list {
          display: grid;
          gap: 12px;
          min-width: 0;
        }

        .education-cv-entry {
          padding: 16px;
          border: 1px solid rgba(143, 178, 158, 0.18);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.82);
          display: grid;
          gap: 12px;
          min-width: 0;
        }

        .education-cv-entry h3 {
          margin: 0 0 4px;
          color: #315f48;
          overflow-wrap: anywhere;
        }

        .education-cv-entry p {
          margin: 0;
          color: #60706a;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .education-cv-meta,
        .feedback-skill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          min-width: 0;
        }

        .education-cv-meta span,
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
          max-width: 100%;
          overflow-wrap: anywhere;
        }

        .education-cv-note,
        .feedback-comment {
          padding: 14px;
          border-radius: 18px;
          background: rgba(248, 245, 255, 0.72);
          color: #4f625b !important;
          font-weight: 750;
          overflow-wrap: anywhere;
        }

        .recognised-skill-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          min-width: 0;
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
          overflow-wrap: anywhere;
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
          min-width: 0;
        }

        .feedback-card {
          padding: 16px;
          border: 1px solid rgba(143, 178, 158, 0.18);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.82);
          display: grid;
          gap: 12px;
          min-width: 0;
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
          overflow-wrap: anywhere;
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

        .preference-view-simple .positive-cv-document {
          gap: 14px;
        }

        .preference-view-simple .cv-section {
          padding: 16px;
          gap: 10px;
        }

        .preference-view-simple .cv-section-heading > span {
          width: 50px;
          height: 50px;
          font-size: 1.55rem;
        }

        .preference-view-simple .cv-section-heading h2 {
          font-size: 1.35rem;
        }

        .preference-view-simple .recognised-skill-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .cv-body-text,
        .preference-text-large .cv-detail-grid p,
        .preference-text-large .dashboard-progress-note,
        .preference-text-large .education-cv-entry p,
        .preference-text-large .feedback-card p {
          font-size: 1.04em;
        }

        .preference-theme-calm_green {
          background:
            radial-gradient(circle at top left, rgba(200, 243, 221, 0.58), transparent 34%),
            linear-gradient(135deg, #f3fff8 0%, #f7fbf5 46%, #fffaf2 100%);
        }

        .preference-theme-calm_green .dashboard-welcome-card,
        .preference-theme-calm_green .dashboard-progress-card,
        .preference-theme-calm_green .positive-cv-document,
        .preference-theme-calm_green .cv-section {
          border-color: rgba(83, 111, 99, 0.2);
        }

        .preference-theme-calm_green .cv-section-heading > span,
        .preference-theme-calm_green .dashboard-progress-icon {
          background: rgba(226, 255, 239, 0.86);
        }

        .preference-theme-soft_blue {
          background:
            radial-gradient(circle at top left, rgba(197, 226, 255, 0.62), transparent 34%),
            linear-gradient(135deg, #f3f9ff 0%, #f8fbff 48%, #fffaf2 100%);
        }

        .preference-theme-soft_blue .dashboard-welcome-card,
        .preference-theme-soft_blue .dashboard-progress-card,
        .preference-theme-soft_blue .positive-cv-document,
        .preference-theme-soft_blue .cv-section {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .preference-theme-soft_blue .cv-section-heading > span,
        .preference-theme-soft_blue .dashboard-progress-icon {
          background: rgba(231, 244, 255, 0.92);
        }

        .preference-theme-warm_peach {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.58), transparent 34%),
            linear-gradient(135deg, #fff8f1 0%, #fffaf6 48%, #f7fff8 100%);
        }

        .preference-theme-warm_peach .dashboard-welcome-card,
        .preference-theme-warm_peach .dashboard-progress-card,
        .preference-theme-warm_peach .positive-cv-document,
        .preference-theme-warm_peach .cv-section {
          border-color: rgba(190, 118, 76, 0.2);
        }

        .preference-theme-warm_peach .cv-section-heading > span,
        .preference-theme-warm_peach .dashboard-progress-icon {
          background: rgba(255, 239, 226, 0.92);
        }

        .preference-theme-high_contrast {
          background: #f8fafc;
        }

        .preference-theme-high_contrast .dashboard-welcome-card,
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .positive-cv-document,
        .preference-theme-high_contrast .cv-section,
        .preference-theme-high_contrast .education-cv-entry,
        .preference-theme-high_contrast .education-cv-meta span,
        .preference-theme-high_contrast .recognised-skill-card,
        .preference-theme-high_contrast .feedback-card,
        .preference-theme-high_contrast .feedback-skill-row span,
        .preference-theme-high_contrast .summary-pill {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .cv-section-heading h2,
        .preference-theme-high_contrast .education-cv-entry h3,
        .preference-theme-high_contrast .feedback-card h3,
        .preference-theme-high_contrast .recognised-skill-card {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .cv-body-text,
        .preference-theme-high_contrast .cv-detail-grid p,
        .preference-theme-high_contrast .education-cv-entry p,
        .preference-theme-high_contrast .feedback-card p,
        .preference-theme-high_contrast .education-cv-note,
        .preference-theme-high_contrast .feedback-comment {
          color: #1f2937 !important;
        }

        .preference-theme-high_contrast .cv-section-heading > span,
        .preference-theme-high_contrast .dashboard-progress-icon {
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
        .preference-theme-neon_arcade .positive-cv-document,
        .preference-theme-neon_arcade .cv-section,
        .preference-theme-neon_arcade .education-cv-entry,
        .preference-theme-neon_arcade .recognised-skill-card,
        .preference-theme-neon_arcade .feedback-card {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .dashboard-title,
        .preference-theme-neon_arcade .cv-section-heading h2,
        .preference-theme-neon_arcade .education-cv-entry h3,
        .preference-theme-neon_arcade .feedback-card h3,
        .preference-theme-neon_arcade .recognised-skill-card,
        .preference-theme-neon_arcade .summary-pill strong,
        .preference-theme-neon_arcade .dashboard-progress-card h2,
        .preference-theme-neon_arcade .dashboard-progress-note strong {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .dashboard-progress-header p,
        .preference-theme-neon_arcade .cv-body-text,
        .preference-theme-neon_arcade .cv-detail-grid p,
        .preference-theme-neon_arcade .education-cv-entry p,
        .preference-theme-neon_arcade .feedback-card p,
        .preference-theme-neon_arcade .education-cv-note,
        .preference-theme-neon_arcade .feedback-comment {
          color: #dbeafe !important;
        }

        .preference-theme-neon_arcade .cv-section-heading > span,
        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .summary-pill,
        .preference-theme-neon_arcade .education-cv-meta span,
        .preference-theme-neon_arcade .feedback-skill-row span {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
        }

        .preference-theme-neon_arcade .print-button,
        .preference-theme-neon_arcade .secondary-button {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #e0f2fe;
          box-shadow:
            0 10px 24px rgba(0, 0, 0, 0.22),
            inset 0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .primary-button {
          border-color: rgba(167, 243, 208, 0.58);
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.26),
            0 0 0 1px rgba(34, 211, 238, 0.16);
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
          .recognised-skill-grid,
          .preference-view-simple .recognised-skill-grid {
            grid-template-columns: 1fr;
          }

          .summary-pill,
          .positive-cv-hero-actions .secondary-button,
          .positive-cv-footer-actions .primary-button,
          .positive-cv-footer-actions .secondary-button {
            width: 100%;
          }
        }

        @media (max-width: 560px) {
          .positive-cv-page .dashboard-shell {
            width: 100%;
            padding-left: 12px;
            padding-right: 12px;
          }

          .positive-cv-page .dashboard-welcome-card,
          .positive-cv-page .dashboard-progress-card,
          .positive-cv-document,
          .cv-section {
            border-radius: 24px;
          }

          .positive-cv-page .dashboard-progress-card {
            padding: 18px;
          }

          .positive-cv-page .dashboard-progress-header {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .positive-cv-page .dashboard-progress-header p,
          .positive-cv-page .dashboard-progress-note {
            font-size: 1rem;
            line-height: 1.45;
          }

          .positive-cv-document {
            padding: 12px;
            gap: 12px;
          }

          .cv-section {
            padding: 14px;
            gap: 12px;
          }

          .cv-section-heading {
            align-items: flex-start;
          }

          .cv-section-heading > span {
            width: 46px;
            height: 46px;
            border-radius: 16px;
          }

          .cv-section-heading h2 {
            font-size: 1.2rem;
            line-height: 1.2;
          }

          .education-cv-entry,
          .feedback-card,
          .recognised-skill-card {
            padding: 13px;
            border-radius: 18px;
          }

          .preference-view-simple .cv-section {
            padding: 14px;
          }

          .preference-view-simple .cv-section-heading > span {
            width: 46px;
            height: 46px;
            font-size: 1.35rem;
          }

          .preference-view-simple .cv-section-heading h2 {
            font-size: 1.2rem;
          }

          .positive-cv-summary-pills {
            gap: 8px;
          }

          .summary-pill {
            justify-content: flex-start;
            text-align: left;
            border-radius: 18px;
          }
        }

        @media (max-width: 430px) {
          .positive-cv-page .dashboard-shell {
            padding-left: 10px;
            padding-right: 10px;
          }

          .positive-cv-page .dashboard-welcome-card,
          .positive-cv-page .dashboard-progress-card {
            padding-left: 16px;
            padding-right: 16px;
          }

          .positive-cv-document {
            padding: 10px;
          }

          .cv-section {
            padding: 12px;
          }

          .positive-cv-page .dashboard-title {
            font-size: 2rem !important;
          }

          .preference-theme-neon_arcade .dashboard-progress-card,
          .preference-theme-neon_arcade .cv-section,
          .preference-theme-neon_arcade .positive-cv-document {
            border-color: rgba(34, 211, 238, 0.36);
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          html,
          body {
            background: #ffffff !important;
          }

          .dashboard-bg,
          .positive-cv-page {
            background: #ffffff !important;
            padding: 0 !important;
          }

          .dashboard-shell {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          .no-print,
          .dashboard-topbar,
          .positive-cv-footer-actions {
            display: none !important;
          }

          .dashboard-welcome-card,
          .dashboard-progress-card,
          .positive-cv-document,
          .cv-section,
          .feedback-card,
          .education-cv-entry,
          .recognised-skill-card,
          .summary-pill {
            box-shadow: none !important;
          }

          .dashboard-welcome-card,
          .positive-cv-document {
            border: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            padding: 0 !important;
          }

          .positive-cv-hero {
            display: block !important;
            margin-bottom: 14px !important;
          }

          .dashboard-title {
            color: #111827 !important;
            font-size: 28pt !important;
            line-height: 1.08 !important;
            letter-spacing: -0.02em !important;
            margin: 0 0 8px !important;
          }

          .dashboard-kicker,
          .dashboard-lead,
          .summary-pill,
          .cv-detail-grid p,
          .cv-body-text,
          .cv-note-box p,
          .education-cv-entry p,
          .feedback-card p,
          .feedback-comment,
          .education-cv-note {
            color: #111827 !important;
          }

          .positive-cv-summary-pills {
            margin-top: 10px !important;
          }

          .summary-pill {
            border: 1px solid #d1d5db !important;
            background: #ffffff !important;
          }

          .dashboard-progress-card {
            margin-top: 12px !important;
            border: 1px solid #d1d5db !important;
            border-radius: 10px !important;
            background: #ffffff !important;
            padding: 12px !important;
          }

          .cv-section {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #d1d5db !important;
            border-radius: 10px !important;
            background: #ffffff !important;
            padding: 12px !important;
            margin-bottom: 10px !important;
          }

          .cv-section-heading > span {
            background: #ffffff !important;
            border: 1px solid #d1d5db !important;
          }

          .cv-section-heading h2,
          .education-cv-entry h3 {
            color: #111827 !important;
          }

          .recognised-skill-card,
          .feedback-card,
          .education-cv-entry,
          .education-cv-meta span,
          .feedback-skill-row span,
          .cv-note-box,
          .feedback-comment,
          .education-cv-note {
            border: 1px solid #d1d5db !important;
            background: #ffffff !important;
          }

          .recognised-skill-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          a {
            color: inherit !important;
            text-decoration: none !important;
          }
        }
      `}</style>
    </main>
  );
}
