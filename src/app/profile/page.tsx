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
  onboarding_completed: boolean | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
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
    value === "high_contrast"
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
  return "SO default";
}

function SummaryList({
  values,
  emptyText
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
  emptyText
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
  children
}: {
  icon: string;
  label: string;
  title: string;
  href: string;
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
          Edit this section
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

export default async function ProfilePage() {
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
      "city,goals,interests,skills,bio,support_needs,share_accessibility_needs,wants_wellbeing_support,availability_notes,preferred_contact_method,onboarding_completed"
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const { data: preferences } = await supabase
    .from("volunteer_preferences")
    .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerPreferences>();

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";

  const displayName = profile?.full_name?.trim() || "there";
  const emailAddress = profile?.email?.trim() || user.email || "";

  const listenText = simpleView
    ? "You are on your profile summary page. This page shows your saved details. Use Edit this section to change a part of your profile. Use Dashboard to go back."
    : "You are on your SO Volunteering profile summary. It shows the information you have added during setup. First, check your account card on the right. The cards below show your goals, interests, skills, support preferences and availability. Each card has an Edit this section button. Use that button if you want to change your answers. Use Back to dashboard when you are finished.";

  const shellClassName = [
    "dashboard-bg",
    getThemeClass(colourTheme),
    getTextClass(textSize),
    getViewClass(viewMode)
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
                : "This is the information you have added so far. You can review it, change it, and keep building your volunteering pathway over time."}
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/onboarding/volunteer"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">✏️</span>
                  <span>Edit setup</span>
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
            title={simpleView ? "What you enjoy" : "What you enjoy or might like to try"}
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
            icon="💛"
            label="Support"
            title={simpleView ? "What helps you" : "What helps you feel comfortable"}
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
            title={simpleView ? "When you can help" : "When volunteering might work"}
            href="/onboarding/volunteer/availability"
          >
            <TextSummary
              value={volunteerProfile?.availability_notes ?? null}
              emptyText="No availability added yet."
            />

            <p>
              Preferred contact:{" "}
              <strong>
                {formatContactMethod(
                  volunteerProfile?.preferred_contact_method ?? null
                )}
              </strong>
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
                  <p className="dashboard-card-label">Coming soon</p>
                  <h2>Opportunity matching</h2>
                  <div className="profile-section-body">
                    <p>
                      Your profile will help match you with inclusive volunteering
                      opportunities when the opportunity system is expanded.
                    </p>
                  </div>
                </div>

                <p className="dashboard-muted-action profile-summary-action">
                  Not live yet
                </p>
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

        .profile-summary-action {
          margin-top: auto !important;
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

        .preference-theme-calm_green .dashboard-welcome-card,
        .preference-theme-calm_green .info-card,
        .preference-theme-calm_green .dashboard-progress-card {
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
        .preference-theme-soft_blue .dashboard-progress-card {
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
        .preference-theme-warm_peach .dashboard-progress-card {
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
        .preference-theme-high_contrast .dashboard-progress-card {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2 {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .profile-section-body,
        .preference-theme-high_contrast .dashboard-progress-note {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-card-icon,
        .preference-theme-high_contrast .dashboard-progress-icon {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-card-action-pill {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
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
