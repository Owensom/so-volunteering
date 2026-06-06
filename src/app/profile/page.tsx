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
  bio: string | null;
  support_needs: string | null;
  share_accessibility_needs: boolean | null;
  wants_wellbeing_support: boolean | null;
  availability_notes: string | null;
  preferred_contact_method: string | null;
  phone_number: string | null;
  onboarding_completed: boolean | null;
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

function SummaryList({
  values,
  emptyText,
}: {
  values: string[] | null;
  emptyText: string;
}) {
  if (!Array.isArray(values) || values.length === 0) {
    return <p className="dashboard-muted-action">{emptyText}</p>;
  }

  return (
    <div className="profile-summary-chip-list">
      {values.map((value) => (
        <span key={value} className="profile-summary-chip">
          {value}
        </span>
      ))}
    </div>
  );
}

function TextSummary({
  value,
  emptyText,
}: {
  value: string | null;
  emptyText: string;
}) {
  if (!value || !value.trim()) {
    return <p className="dashboard-muted-action">{emptyText}</p>;
  }

  return <p className="profile-summary-text">{value}</p>;
}

function ProfileSection({
  icon,
  label,
  title,
  href,
  actionLabel = "Edit this section",
  children,
}: {
  icon: string;
  label: string;
  title: string;
  href: string;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="info-card dashboard-pathway-card profile-summary-card">
      <div className="dashboard-card-icon profile-summary-icon" aria-hidden="true">
        {icon}
      </div>

      <div className="dashboard-card-copy profile-summary-copy">
        <div className="profile-summary-main">
          <p className="dashboard-card-label">{label}</p>
          <h2>{title}</h2>

          <div className="profile-section-body">{children}</div>
        </div>

        <Link href={href} className="dashboard-card-action-pill">
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}

function formatContactMethod(value: string | null) {
  if (!value) return "Not chosen yet";
  if (value === "sms") return "Text message";
  if (value === "phone") return "Phone call";
  if (value === "email") return "Email";
  if (value === "not_sure") return "Not sure yet";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatEntryType(value: string) {
  if (value === "school") return "School";
  if (value === "college") return "College";
  if (value === "university") return "University";
  if (value === "training_course") return "Training course";
  if (value === "online_course") return "Online course";
  if (value === "certificate") return "Certificate";
  if (value === "work_related_training") return "Work-related training";
  return "Other";
}

function formatStudyDates(entry: EducationEntry) {
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

function EducationSummary({
  entries,
  simpleView,
}: {
  entries: EducationEntry[];
  simpleView: boolean;
}) {
  if (entries.length === 0) {
    return (
      <p className="dashboard-muted-action">
        No education, training or qualifications added yet.
      </p>
    );
  }

  const visibleEntries = simpleView ? entries.slice(0, 2) : entries.slice(0, 3);
  const remainingCount = entries.length - visibleEntries.length;

  return (
    <div className="education-summary-list">
      {visibleEntries.map((entry) => {
        const dateText = formatStudyDates(entry);

        return (
          <div key={entry.id} className="education-summary-entry">
            <strong>{entry.qualification_name}</strong>
            <span>
              {formatEntryType(entry.entry_type)}
              {entry.institution_name ? ` · ${entry.institution_name}` : ""}
              {dateText ? ` · ${dateText}` : ""}
            </span>
          </div>
        );
      })}

      {remainingCount > 0 ? (
        <p className="dashboard-muted-action">
          + {remainingCount} more entr{remainingCount === 1 ? "y" : "ies"}
        </p>
      ) : null}
    </div>
  );
}

export default async function ProfilePage() {
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
      "city,goals,interests,skills,bio,support_needs,share_accessibility_needs,wants_wellbeing_support,availability_notes,preferred_contact_method,phone_number,onboarding_completed",
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

  const educationRows = (educationEntries as EducationEntry[] | null) ?? [];

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";

  const displayName = profile?.full_name?.trim() || "there";
  const emailAddress = profile?.email?.trim() || user.email || "";
  const preferredContactLabel = formatContactMethod(
    volunteerProfile?.preferred_contact_method ?? null,
  );
  const hasPhoneNumber = Boolean(volunteerProfile?.phone_number?.trim());

  const listenText = simpleView
    ? "You are on your profile summary page. Contact options has its own button and card. Use Contact options to choose how organisations should contact you."
    : "You are on your SO Volunteering profile summary. At the top there is a clear Contact options button. The cards below show your goals, contact options, interests, skills, education and qualifications, support preferences and availability.";

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
          aria-labelledby="profile-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Your profile summary</p>

            <h1 id="profile-title" className="dashboard-title">
              <span aria-hidden="true">{avatarIcon}</span>
              <span>{displayName}</span>
            </h1>

            <p className="dashboard-lead">
              {simpleView
                ? "This is your saved volunteering profile."
                : "Review your volunteering profile, contact options, pathway details and settings."}
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/profile/contact"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📞</span>
                  <span>Contact options</span>
                </span>
              </Link>

              <Link
                href="/onboarding/volunteer"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🌱</span>
                  <span>Goals & location</span>
                </span>
              </Link>

              <Link
                href="/profile/education"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📚</span>
                  <span>Education & qualifications</span>
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🧭</span>
                  <span>Back to dashboard</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Account details">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {avatarIcon}
              </span>
              <div>
                <h2>Account</h2>
                <p>
                  Type: <strong>{userType}</strong>
                </p>
              </div>
            </div>

            {emailAddress ? (
              <p className="dashboard-progress-note">{emailAddress}</p>
            ) : (
              <p className="dashboard-progress-note">Email not available.</p>
            )}

            <p className="dashboard-progress-note">
              Setup status:{" "}
              <strong>
                {volunteerProfile?.onboarding_completed
                  ? "Complete"
                  : "In progress"}
              </strong>
            </p>

            <p className="dashboard-progress-note">
              Contact: <strong>{preferredContactLabel}</strong>
            </p>

            <p className="dashboard-progress-note">
              Education entries: <strong>{educationRows.length}</strong>
            </p>

            {detailedView ? (
              <p className="dashboard-progress-note">
                App view: <strong>{getViewLabel(viewMode)}</strong> · Theme:{" "}
                <strong>{getThemeLabel(colourTheme)}</strong>
              </p>
            ) : null}
          </aside>
        </section>

        <section
          className="dashboard-grid profile-summary-grid"
          aria-label="Volunteer profile summary sections"
        >
          <ProfileSection
            icon="🌱"
            label="Goals"
            title="What you want to achieve"
            href="/onboarding/volunteer"
            actionLabel="Edit goals & location"
          >
            {volunteerProfile?.city ? (
              <p>
                Nearest town or city: <strong>{volunteerProfile.city}</strong>
              </p>
            ) : (
              <p className="dashboard-muted-action">
                Nearest town or city not added yet.
              </p>
            )}

            <SummaryList
              values={volunteerProfile?.goals ?? null}
              emptyText="No goals added yet."
            />
          </ProfileSection>

          <ProfileSection
            icon="📞"
            label="Contact"
            title="Contact options"
            href="/profile/contact"
            actionLabel="Edit contact options"
          >
            <p>
              Preferred contact: <strong>{preferredContactLabel}</strong>
            </p>

            <p>
              Phone/text number:{" "}
              <strong>{hasPhoneNumber ? "Added" : "Not added"}</strong>
            </p>

            {!simpleView ? (
              <p className="dashboard-muted-action">
                Organisations can use this after you express interest in one of
                their roles.
              </p>
            ) : null}
          </ProfileSection>

          <ProfileSection
            icon="💚"
            label="Interests"
            title={
              simpleView ? "What you enjoy" : "What you enjoy or might like to try"
            }
            href="/onboarding/volunteer/interests"
          >
            <SummaryList
              values={volunteerProfile?.interests ?? null}
              emptyText="No interests added yet."
            />
          </ProfileSection>

          <ProfileSection
            icon="⭐"
            label="Skills"
            title={simpleView ? "Your skills" : "What you can do or want to build"}
            href="/onboarding/volunteer/skills"
          >
            <SummaryList
              values={volunteerProfile?.skills ?? null}
              emptyText="No skills added yet."
            />

            {!simpleView && volunteerProfile?.bio ? (
              <div className="profile-note-block">
                <p className="dashboard-card-label">Your notes</p>
                <TextSummary
                  value={volunteerProfile.bio}
                  emptyText="No extra notes added."
                />
              </div>
            ) : null}
          </ProfileSection>

          <ProfileSection
            icon="📚"
            label="CV section"
            title="Education & qualifications"
            href="/profile/education"
            actionLabel={
              educationRows.length > 0 ? "Edit education" : "Add education"
            }
          >
            <EducationSummary entries={educationRows} simpleView={simpleView} />
          </ProfileSection>

          <ProfileSection
            icon="💛"
            label="Support"
            title={
              simpleView ? "What helps you" : "What helps you feel comfortable"
            }
            href="/onboarding/volunteer/accessibility"
          >
            <TextSummary
              value={volunteerProfile?.support_needs ?? null}
              emptyText="No support preferences added yet."
            />

            {!simpleView ? (
              <div className="profile-summary-chip-list">
                <span className="profile-summary-chip">
                  {volunteerProfile?.share_accessibility_needs
                    ? "Can share with organisations"
                    : "Private for now"}
                </span>

                <span className="profile-summary-chip">
                  {volunteerProfile?.wants_wellbeing_support
                    ? "Wellbeing reminders wanted"
                    : "No wellbeing reminders"}
                </span>
              </div>
            ) : null}
          </ProfileSection>

          <ProfileSection
            icon="📅"
            label="Availability"
            title={
              simpleView ? "When you can help" : "When volunteering might work"
            }
            href="/onboarding/volunteer/availability"
          >
            <TextSummary
              value={volunteerProfile?.availability_notes ?? null}
              emptyText="No availability added yet."
            />

            <p className="dashboard-muted-action">
              Contact preferences now have their own Contact options card.
            </p>
          </ProfileSection>

          <article className="info-card dashboard-pathway-card profile-summary-card">
            <div
              className="dashboard-card-icon profile-summary-icon"
              aria-hidden="true"
            >
              {avatarIcon}
            </div>

            <div className="dashboard-card-copy profile-summary-copy">
              <div className="profile-summary-main">
                <p className="dashboard-card-label">App settings</p>
                <h2>Personalise my app</h2>
                <div className="profile-section-body">
                  <p>
                    {simpleView
                      ? "Change how your app looks and feels."
                      : "Choose your view mode, colour theme, text size, avatar and Listen preference."}
                  </p>
                </div>
              </div>

              <Link href="/settings/personalise" className="dashboard-card-action-pill">
                Open settings
              </Link>
            </div>
          </article>

          {!simpleView ? (
            <article className="info-card dashboard-pathway-card profile-summary-card">
              <div
                className="dashboard-card-icon profile-summary-icon"
                aria-hidden="true"
              >
                🔎
              </div>

              <div className="dashboard-card-copy profile-summary-copy">
                <div className="profile-summary-main">
                  <p className="dashboard-card-label">Matching</p>
                  <h2>Best roles for me</h2>
                  <div className="profile-section-body">
                    <p>
                      Your profile helps suggest inclusive volunteering
                      opportunities that match your goals, interests and skills.
                    </p>
                  </div>
                </div>

                <Link href="/opportunities" className="dashboard-card-action-pill">
                  See best roles
                </Link>
              </div>
            </article>
          ) : null}
        </section>
      </section>

      <style>{`
        .dashboard-grid,
        .profile-summary-grid {
          align-items: stretch;
        }

        .dashboard-pathway-card,
        .profile-summary-card {
          height: 100%;
          align-items: stretch;
        }

        .profile-summary-card {
          min-height: 244px;
        }

        .dashboard-card-copy,
        .profile-summary-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .profile-summary-main {
          display: grid;
          gap: 10px;
        }

        .profile-summary-main h2 {
          margin-bottom: 0;
        }

        .profile-section-body {
          display: grid;
          gap: 10px;
          color: #5d6677;
          line-height: 1.5;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .profile-section-body p {
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

        .dashboard-card-action-pill:hover {
          border-color: rgba(83, 111, 99, 0.34);
          background: rgba(244, 255, 249, 0.96);
        }

        .profile-summary-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-start;
        }

        .profile-summary-chip {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          max-width: 100%;
          padding: 9px 12px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #536f63;
          font-size: 0.88rem;
          font-weight: 800;
          line-height: 1.2;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
          white-space: normal;
        }

        .education-summary-list {
          display: grid;
          gap: 9px;
        }

        .education-summary-entry {
          display: grid;
          gap: 3px;
          padding: 10px 12px;
          border: 1px solid rgba(143, 178, 158, 0.18);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.74);
        }

        .education-summary-entry strong {
          color: #315f48;
          overflow-wrap: anywhere;
        }

        .education-summary-entry span {
          color: #60706a;
          font-size: 0.9rem;
          font-weight: 750;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .profile-section-body,
        .preference-text-large .dashboard-progress-note {
          font-size: 1.04em;
        }

        .preference-text-large .dashboard-title {
          letter-spacing: -0.035em;
        }

        .preference-view-simple .dashboard-grid {
          gap: 18px;
        }

        .preference-view-simple .profile-summary-card {
          min-height: 210px;
        }

        .preference-view-simple .dashboard-card-icon {
          font-size: 2rem;
        }

        .preference-view-detailed .profile-summary-card {
          min-height: 260px;
        }

        .preference-theme-calm_green {
          background:
            radial-gradient(circle at top left, rgba(200, 243, 221, 0.58), transparent 34%),
            linear-gradient(135deg, #f3fff8 0%, #f7fbf5 46%, #fffaf2 100%);
        }

        .preference-theme-soft_blue {
          background:
            radial-gradient(circle at top left, rgba(197, 226, 255, 0.62), transparent 34%),
            linear-gradient(135deg, #f3f9ff 0%, #f8fbff 48%, #fffaf2 100%);
        }

        .preference-theme-warm_peach {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.58), transparent 34%),
            linear-gradient(135deg, #fff8f1 0%, #fffaf6 48%, #f7fff8 100%);
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

        .preference-theme-neon_arcade {
          background:
            radial-gradient(circle at top left, rgba(34, 211, 238, 0.28), transparent 34%),
            radial-gradient(circle at top right, rgba(217, 70, 239, 0.24), transparent 30%),
            linear-gradient(135deg, #101827 0%, #15132c 46%, #071827 100%);
        }

        @media (max-width: 640px) {
          .profile-summary-card,
          .preference-view-simple .profile-summary-card,
          .preference-view-detailed .profile-summary-card {
            min-height: 0;
          }

          .profile-summary-copy {
            gap: 14px;
          }

          .profile-summary-chip-list {
            gap: 8px;
          }

          .profile-summary-chip {
            border-radius: 18px;
            font-size: 0.86rem;
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
