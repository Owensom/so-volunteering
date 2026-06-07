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

type ProfileGuideStep = {
  icon: string;
  title: string;
  text: string;
  href: string;
  action: string;
  isComplete: boolean;
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

function hasArrayValue(value: string[] | null | undefined) {
  return Array.isArray(value) && value.length > 0;
}

function hasTextValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
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
  complete = false,
  children,
}: {
  icon: string;
  label: string;
  title: string;
  href: string;
  actionLabel?: string;
  complete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={
        complete
          ? "info-card dashboard-pathway-card profile-summary-card profile-summary-card-complete"
          : "info-card dashboard-pathway-card profile-summary-card"
      }
    >
      <div className="dashboard-card-icon profile-summary-icon" aria-hidden="true">
        {complete ? "✅" : icon}
      </div>

      <div className="dashboard-card-copy profile-summary-copy">
        <div className="profile-summary-main">
          <p className="dashboard-card-label">
            {complete ? `${label} complete` : label}
          </p>
          <h2>{title}</h2>

          <div className="profile-section-body">{children}</div>
        </div>

        <Link href={href} className="dashboard-card-action-pill">
          {complete ? actionLabel.replace("Add", "Review") : actionLabel}
        </Link>
      </div>
    </article>
  );
}

function ProfileGuide({ steps }: { steps: ProfileGuideStep[] }) {
  return (
    <section className="profile-guide-panel" aria-labelledby="profile-guide-title">
      <div className="profile-guide-heading">
        <span aria-hidden="true">🧭</span>

        <div>
          <p className="dashboard-kicker">Step-by-step guide</p>
          <h2 id="profile-guide-title">Complete your volunteer profile</h2>
          <p>
            Your profile helps match you with roles, shows organisations how to
            contact you after you express interest, and builds your Positive
            Pathway CV.
          </p>
        </div>
      </div>

      <div className="profile-guide-grid">
        {steps.map((step, index) => (
          <Link
            key={step.title}
            href={step.href}
            className={
              step.isComplete
                ? "profile-guide-step profile-guide-step-complete"
                : "profile-guide-step"
            }
          >
            <span className="profile-guide-step-number">
              {step.isComplete ? "✓" : index + 1}
            </span>

            <div className="profile-guide-step-icon" aria-hidden="true">
              {step.icon}
            </div>

            <div className="profile-guide-step-copy">
              <p className="profile-guide-step-kicker">
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

function ProfileSummaryStat({
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
    <article className="profile-stat-card">
      <span aria-hidden="true">{icon}</span>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <small>{text}</small>
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

  const contactComplete = Boolean(
    volunteerProfile?.preferred_contact_method?.trim(),
  );

  const goalsComplete =
    hasTextValue(volunteerProfile?.city) && hasArrayValue(volunteerProfile?.goals);

  const interestsComplete = hasArrayValue(volunteerProfile?.interests);
  const skillsComplete = hasArrayValue(volunteerProfile?.skills);
  const educationComplete = educationRows.length > 0;

  const supportComplete =
    hasTextValue(volunteerProfile?.support_needs) ||
    volunteerProfile?.share_accessibility_needs === true ||
    volunteerProfile?.wants_wellbeing_support === true;

  const availabilityComplete =
    volunteerProfile?.onboarding_completed === true ||
    hasTextValue(volunteerProfile?.availability_notes) ||
    hasTextValue(volunteerProfile?.preferred_contact_method);

  const pathwayReady =
    goalsComplete ||
    interestsComplete ||
    skillsComplete ||
    educationComplete ||
    supportComplete ||
    availabilityComplete;

  const guideSteps: ProfileGuideStep[] = [
    {
      icon: "📞",
      title: "Choose contact options",
      text: "Tell organisations how to contact you after you express interest.",
      href: "/profile/contact",
      action: contactComplete ? "Review contact options" : "Add contact options",
      isComplete: contactComplete,
    },
    {
      icon: "🌱",
      title: "Add goals and location",
      text: "Add your nearest town or city and what you want volunteering to help with.",
      href: "/onboarding/volunteer",
      action: goalsComplete ? "Review goals" : "Continue goals",
      isComplete: goalsComplete,
    },
    {
      icon: "💚",
      title: "Choose interests",
      text: "Choose what you enjoy, care about or might like to try.",
      href: "/onboarding/volunteer/interests",
      action: interestsComplete ? "Review interests" : "Add interests",
      isComplete: interestsComplete,
    },
    {
      icon: "⭐",
      title: "Add skills",
      text: "Choose skills you already have or would like to build.",
      href: "/onboarding/volunteer/skills",
      action: skillsComplete ? "Review skills" : "Add skills",
      isComplete: skillsComplete,
    },
    {
      icon: "💛",
      title: "Add wellbeing support",
      text: "Choose anything that helps you feel comfortable, safe and included.",
      href: "/onboarding/volunteer/accessibility",
      action: supportComplete ? "Review support" : "Add support",
      isComplete: supportComplete,
    },
    {
      icon: "📅",
      title: "Add availability",
      text: "Tell the app when volunteering might work for you.",
      href: "/onboarding/volunteer/availability",
      action: availabilityComplete ? "Review availability" : "Add availability",
      isComplete: availabilityComplete,
    },
    {
      icon: "📚",
      title: "Add education",
      text: "Add learning, certificates, qualifications or training for your CV.",
      href: "/profile/education",
      action: educationComplete ? "Review education" : "Add education",
      isComplete: educationComplete,
    },
    {
      icon: "📄",
      title: "Open your CV",
      text: "See your profile, learning and positive evidence in one place.",
      href: "/pathway/cv",
      action: "Open Positive Pathway CV",
      isComplete: pathwayReady,
    },
  ];

  const completedGuideSteps = guideSteps.filter((step) => step.isComplete).length;
  const guidePercent = Math.round((completedGuideSteps / guideSteps.length) * 100);

  const listenText = simpleView
    ? `You are on your profile page. Contact options is first. The guide shows which parts of your profile are complete. You can open your Positive Pathway CV, pathway, education, support or app settings from this page.`
    : `You are on your SO Volunteering profile summary. This page is now a profile control centre. Contact options is first because it controls how organisations can contact you after you express interest. The guide shows eight steps: contact options, goals and location, interests, skills, wellbeing support, availability, education, and Positive Pathway CV. Completed sections turn green and show a tick. The cards below let you review each profile area, open your pathway, open your Positive Pathway CV, update education, personalise the app and find your best roles.`;

  const shellClassName = [
    "dashboard-bg",
    "profile-page",
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
          className="dashboard-welcome-card profile-hero"
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
                : "Review your contact options, pathway details, education, support preferences and app settings."}
            </p>

            <div className="dashboard-primary-actions profile-primary-actions">
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
                href="/pathway/cv"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📄</span>
                  <span>Positive Pathway CV</span>
                </span>
              </Link>

              <Link
                href="/pathway"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🧭</span>
                  <span>See my pathway</span>
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

          <aside className="dashboard-progress-card" aria-label="Account details">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {avatarIcon}
              </span>
              <div>
                <h2>Profile status</h2>
                <p>
                  {completedGuideSteps} of {guideSteps.length} sections ready.
                </p>
              </div>
            </div>

            <div className="profile-progress-wrap" aria-hidden="true">
              <div className="profile-progress-meta">
                <span>{guidePercent === 100 ? "Ready" : "In progress"}</span>
                <span>{guidePercent}%</span>
              </div>
              <div className="profile-progress-track">
                <span style={{ width: `${guidePercent}%` }} />
              </div>
            </div>

            {emailAddress ? (
              <p className="dashboard-progress-note">{emailAddress}</p>
            ) : (
              <p className="dashboard-progress-note">Email not available.</p>
            )}

            <p className="dashboard-progress-note">
              Contact: <strong>{preferredContactLabel}</strong>
            </p>

            <p className="dashboard-progress-note">
              Phone/text number:{" "}
              <strong>{hasPhoneNumber ? "Added" : "Not added"}</strong>
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

        <ProfileGuide steps={guideSteps} />

        <section
          className="profile-summary-panel"
          aria-labelledby="profile-summary-title"
        >
          <div className="profile-summary-panel-heading">
            <span aria-hidden="true">🌈</span>

            <div>
              <p className="dashboard-kicker">Profile summary</p>
              <h2 id="profile-summary-title">What your profile supports</h2>
              <p>
                These cards show how your profile supports role matching,
                contact with organisations and your Positive Pathway CV.
              </p>
            </div>
          </div>

          <div className="profile-stat-grid">
            <ProfileSummaryStat
              icon="📞"
              title="Contact options"
              value={contactComplete ? "Ready" : "To do"}
              text="Used after you express interest in a role."
            />
            <ProfileSummaryStat
              icon="🔎"
              title="Matching profile"
              value={`${[goalsComplete, interestsComplete, skillsComplete].filter(Boolean).length}/3`}
              text="Goals, interests and skills improve role matching."
            />
            <ProfileSummaryStat
              icon="📚"
              title="Education entries"
              value={educationRows.length}
              text="Learning can appear in your Positive Pathway CV."
            />
            <ProfileSummaryStat
              icon="📄"
              title="CV readiness"
              value={pathwayReady ? "Started" : "To do"}
              text="Your pathway and evidence build your CV."
            />
          </div>
        </section>

        <section
          className="dashboard-grid profile-summary-grid"
          aria-label="Volunteer profile summary sections"
        >
          <ProfileSection
            icon="📞"
            label="Contact"
            title="Contact options"
            href="/profile/contact"
            actionLabel="Edit contact options"
            complete={contactComplete}
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
            icon="🌱"
            label="Goals"
            title="What you want to achieve"
            href="/onboarding/volunteer"
            actionLabel="Edit goals & location"
            complete={goalsComplete}
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
            icon="💚"
            label="Interests"
            title={
              simpleView ? "What you enjoy" : "What you enjoy or might like to try"
            }
            href="/onboarding/volunteer/interests"
            complete={interestsComplete}
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
            complete={skillsComplete}
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
            icon="💛"
            label="Support"
            title={
              simpleView ? "What helps you" : "What helps you feel comfortable"
            }
            href="/onboarding/volunteer/accessibility"
            complete={supportComplete}
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
            complete={availabilityComplete}
          >
            <TextSummary
              value={volunteerProfile?.availability_notes ?? null}
              emptyText="No availability added yet."
            />

            <p className="dashboard-muted-action">
              Contact preferences now have their own Contact options card.
            </p>
          </ProfileSection>

          <ProfileSection
            icon="📚"
            label="CV section"
            title="Education & qualifications"
            href="/profile/education"
            actionLabel={
              educationRows.length > 0 ? "Edit education" : "Add education"
            }
            complete={educationComplete}
          >
            <EducationSummary entries={educationRows} simpleView={simpleView} />
          </ProfileSection>

          <article className="info-card dashboard-pathway-card profile-summary-card profile-cv-card">
            <div
              className="dashboard-card-icon profile-summary-icon"
              aria-hidden="true"
            >
              📄
            </div>

            <div className="dashboard-card-copy profile-summary-copy">
              <div className="profile-summary-main">
                <p className="dashboard-card-label">Positive pathway</p>
                <h2>Positive Pathway CV</h2>
                <div className="profile-section-body">
                  <p>
                    {simpleView
                      ? "See your strengths and feedback."
                      : "Open your strengths-based CV with your profile, learning, recognised strengths and positive reviews."}
                  </p>
                </div>
              </div>

              <Link href="/pathway/cv" className="dashboard-card-action-pill">
                Open CV
              </Link>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card profile-summary-card">
            <div
              className="dashboard-card-icon profile-summary-icon"
              aria-hidden="true"
            >
              🧭
            </div>

            <div className="dashboard-card-copy profile-summary-copy">
              <div className="profile-summary-main">
                <p className="dashboard-card-label">Pathway</p>
                <h2>See my pathway</h2>
                <div className="profile-section-body">
                  <p>
                    {simpleView
                      ? "Check your pathway steps."
                      : "Review your setup progress, education, evidence and links into your Positive Pathway CV."}
                  </p>
                </div>
              </div>

              <Link href="/pathway" className="dashboard-card-action-pill">
                Open pathway
              </Link>
            </div>
          </article>

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
        .profile-page,
        .profile-page * {
          box-sizing: border-box;
        }

        .dashboard-grid,
        .profile-summary-grid {
          align-items: stretch;
        }

        .profile-primary-actions {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          width: min(100%, 620px);
          align-items: stretch;
        }

        .profile-primary-actions .dashboard-main-action {
          width: 100%;
          min-height: 54px;
          justify-content: center;
          text-align: center;
        }

        .dashboard-pathway-card,
        .profile-summary-card {
          height: 100%;
          align-items: stretch;
        }

        .profile-summary-card {
          min-height: 244px;
        }

        .profile-summary-card-complete {
          border-color: rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.22), transparent 34%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.9), rgba(255, 255, 255, 0.94));
        }

        .profile-cv-card {
          border-color: rgba(143, 178, 158, 0.3);
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.82), rgba(255, 255, 255, 0.94));
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

        .profile-progress-wrap {
          display: grid;
          gap: 8px;
          margin: 14px 0 12px;
        }

        .profile-progress-meta {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          color: #60706a;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .profile-progress-track {
          width: 100%;
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
        }

        .profile-progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8fb29e, #4f8d68);
        }

        .profile-guide-panel,
        .profile-summary-panel {
          padding: clamp(20px, 4vw, 28px);
          border: 1px solid rgba(143, 178, 158, 0.22);
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 18px 56px rgba(38, 50, 56, 0.07);
          display: grid;
          gap: 18px;
          overflow: hidden;
        }

        .profile-guide-panel {
          border-color: rgba(108, 92, 160, 0.16);
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.92), rgba(255, 255, 255, 0.9));
        }

        .profile-summary-panel {
          border-color: rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.38), transparent 34%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.94), rgba(255, 255, 255, 0.9));
        }

        .profile-guide-heading,
        .profile-summary-panel-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .profile-guide-heading > span,
        .profile-summary-panel-heading > span {
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

        .profile-summary-panel-heading > span {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.16);
        }

        .profile-guide-heading h2,
        .profile-summary-panel-heading h2 {
          margin: 2px 0 8px;
          color: #315f48;
          font-size: clamp(1.35rem, 3vw, 1.8rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .profile-guide-heading p,
        .profile-summary-panel-heading p {
          margin: 0;
          max-width: 760px;
          color: #60706a;
          font-weight: 750;
          line-height: 1.55;
        }

        .profile-guide-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .profile-guide-step {
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

        .profile-guide-step:hover {
          transform: translateY(-1px);
          border-color: rgba(83, 111, 99, 0.28);
          background: rgba(255, 255, 255, 0.94);
        }

        .profile-guide-step-complete {
          border-color: rgba(34, 124, 78, 0.26);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.28), transparent 34%),
            rgba(244, 255, 249, 0.92);
          box-shadow: 0 14px 30px rgba(33, 96, 61, 0.08);
        }

        .profile-guide-step-number {
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

        .profile-guide-step-complete .profile-guide-step-number {
          background: rgba(34, 124, 78, 0.14);
          color: #145c38;
        }

        .profile-guide-step-icon {
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

        .profile-guide-step-complete .profile-guide-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .profile-guide-step-copy {
          display: grid;
          gap: 6px;
        }

        .profile-guide-step-kicker {
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

        .profile-guide-step-kicker span {
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

        .profile-guide-step-complete .profile-guide-step-kicker,
        .profile-guide-step-complete .profile-guide-step-kicker span {
          color: #145c38;
        }

        .profile-guide-step-complete .profile-guide-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .profile-guide-step-copy h3 {
          margin: 0;
          padding-right: 32px;
          color: #315f48;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.14;
        }

        .profile-guide-step-copy p {
          margin: 0;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 740;
          line-height: 1.42;
        }

        .profile-guide-step-copy strong {
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

        .profile-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .profile-stat-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          min-height: 126px;
          padding: 14px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
        }

        .profile-stat-card > span {
          display: inline-flex;
          width: 44px;
          height: 44px;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.35rem;
        }

        .profile-stat-card p {
          margin: 0 0 5px;
          color: #60706a;
          font-size: 0.82rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .profile-stat-card strong {
          display: block;
          color: #315f48;
          font-size: 1.4rem;
          line-height: 1.05;
        }

        .profile-stat-card small {
          display: block;
          margin-top: 8px;
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.25;
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
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .profile-guide-panel,
        .preference-theme-high_contrast .profile-guide-step,
        .preference-theme-high_contrast .profile-summary-panel,
        .preference-theme-high_contrast .profile-stat-card {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .profile-guide-heading h2,
        .preference-theme-high_contrast .profile-guide-step-copy h3,
        .preference-theme-high_contrast .profile-summary-panel-heading h2,
        .preference-theme-high_contrast .profile-stat-card strong {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-card-copy p,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .profile-guide-heading p,
        .preference-theme-high_contrast .profile-guide-step-copy p,
        .preference-theme-high_contrast .profile-summary-panel-heading p,
        .preference-theme-high_contrast .profile-stat-card p,
        .preference-theme-high_contrast .profile-stat-card small {
          color: #1f2937;
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
        .preference-theme-neon_arcade .profile-guide-panel,
        .preference-theme-neon_arcade .profile-guide-step,
        .preference-theme-neon_arcade .profile-summary-panel,
        .preference-theme-neon_arcade .profile-stat-card {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .profile-summary-card-complete,
        .preference-theme-neon_arcade .profile-cv-card,
        .preference-theme-neon_arcade .profile-guide-step-complete {
          background:
            radial-gradient(circle at top left, rgba(34, 211, 238, 0.14), transparent 55%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(49, 46, 129, 0.88));
        }

        .preference-theme-neon_arcade .dashboard-title,
        .preference-theme-neon_arcade .dashboard-card-copy h2,
        .preference-theme-neon_arcade .dashboard-progress-card h2,
        .preference-theme-neon_arcade .dashboard-progress-note strong,
        .preference-theme-neon_arcade .profile-guide-heading h2,
        .preference-theme-neon_arcade .profile-guide-step-copy h3,
        .preference-theme-neon_arcade .profile-summary-panel-heading h2,
        .preference-theme-neon_arcade .profile-stat-card strong {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-card-label,
        .preference-theme-neon_arcade .dashboard-card-copy p,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .profile-guide-heading p,
        .preference-theme-neon_arcade .profile-guide-step-copy p,
        .preference-theme-neon_arcade .profile-summary-panel-heading p,
        .preference-theme-neon_arcade .profile-stat-card p,
        .preference-theme-neon_arcade .profile-stat-card small,
        .preference-theme-neon_arcade .profile-section-body,
        .preference-theme-neon_arcade .education-summary-entry span {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-card-action-pill,
        .preference-theme-neon_arcade .profile-guide-step-copy strong,
        .preference-theme-neon_arcade .profile-summary-chip,
        .preference-theme-neon_arcade .education-summary-entry {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow:
            0 10px 24px rgba(0, 0, 0, 0.24),
            inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .profile-progress-track {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(34, 211, 238, 0.28);
        }

        .preference-theme-neon_arcade .profile-progress-track span {
          background: linear-gradient(90deg, #22d3ee, #a7f3d0, #d946ef);
        }

        @media (max-width: 1180px) {
          .profile-guide-grid,
          .profile-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .profile-primary-actions {
            grid-template-columns: 1fr;
            width: 100%;
          }

          .profile-guide-heading,
          .profile-summary-panel-heading {
            grid-template-columns: 1fr;
          }

          .profile-guide-heading > span,
          .profile-summary-panel-heading > span {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .profile-guide-grid,
          .profile-stat-grid {
            grid-template-columns: 1fr;
          }

          .profile-primary-actions .primary-button,
          .profile-primary-actions .secondary-button {
            width: 100%;
          }
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

          .profile-guide-panel,
          .profile-summary-panel {
            border-radius: 26px;
            padding: 18px;
          }
        }
      `}</style>
    </main>
  );
}
