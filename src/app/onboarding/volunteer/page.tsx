import Link from "next/link";
import { redirect } from "next/navigation";
import { saveVolunteerOnboarding } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type VolunteerProfile = {
  city: string | null;
  goals: string[] | null;
  volunteering_preference: string | null;
  preferred_contact_method: string | null;
  phone: string | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
};

type GoalOption = {
  value: string;
  label: string;
  icon: string;
  helpText: string;
};

type ContactOption = {
  value: string;
  label: string;
  icon: string;
  helpText: string;
};

const goalOptions: GoalOption[] = [
  {
    value: "Support my community",
    label: "Support my community",
    icon: "🤝",
    helpText: "Help local people or causes.",
  },
  {
    value: "Gain experience",
    label: "Gain experience",
    icon: "🧭",
    helpText: "Build useful experience.",
  },
  {
    value: "Build skills",
    label: "Build skills",
    icon: "⭐",
    helpText: "Learn in a supportive way.",
  },
  {
    value: "Improve confidence",
    label: "Improve confidence",
    icon: "🌱",
    helpText: "Start gently and grow.",
  },
  {
    value: "Meet new people",
    label: "Meet new people",
    icon: "👋",
    helpText: "Feel more connected.",
  },
  {
    value: "Build a routine",
    label: "Build a routine",
    icon: "🕒",
    helpText: "Add structure at a steady pace.",
  },
  {
    value: "Try something new",
    label: "Try something new",
    icon: "🧪",
    helpText: "Explore what suits you.",
  },
  {
    value: "Progress towards employment",
    label: "Progress towards employment",
    icon: "💼",
    helpText: "Build CV evidence.",
  },
  {
    value: "Education or training",
    label: "Education or training",
    icon: "🎓",
    helpText: "Support future learning.",
  },
  {
    value: "I am not sure yet",
    label: "I am not sure yet",
    icon: "🌈",
    helpText: "That is okay. You can change this later.",
  },
];

const contactOptions: ContactOption[] = [
  {
    value: "email",
    label: "Email",
    icon: "✉️",
    helpText: "Best if you like to read and reply in your own time.",
  },
  {
    value: "phone",
    label: "Phone call",
    icon: "📞",
    helpText: "Best if talking things through feels easier.",
  },
  {
    value: "sms",
    label: "Text message",
    icon: "💬",
    helpText: "Best if short messages feel easier than email.",
  },
  {
    value: "not_sure",
    label: "Not sure yet",
    icon: "🌈",
    helpText: "That is okay. You can change this later.",
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

function normaliseVolunteeringPreference(value: string | null | undefined) {
  if (value === "in_person" || value === "remote" || value === "both") {
    return value;
  }

  return "both";
}

function normalisePreferredContactMethod(value: string | null | undefined) {
  if (
    value === "email" ||
    value === "phone" ||
    value === "sms" ||
    value === "not_sure"
  ) {
    return value;
  }

  return "email";
}

export default async function VolunteerOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";

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

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  const { data: volunteerProfile } = await supabase
    .from("volunteer_profiles")
    .select("city,goals,volunteering_preference,preferred_contact_method,phone")
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

  const selectedGoals = new Set(volunteerProfile?.goals ?? []);
  const selectedCount = selectedGoals.size;
  const volunteeringPreference = normaliseVolunteeringPreference(
    volunteerProfile?.volunteering_preference,
  );
  const preferredContactMethod = normalisePreferredContactMethod(
    volunteerProfile?.preferred_contact_method,
  );

  const listenText = simpleView
    ? "This is step one. Add your nearest town or city. Choose one or more goal cards. Choose how you prefer to volunteer. Choose how organisations should contact you. You can add a phone or text number if you want to. Press Save and continue."
    : "This is step one of your volunteer profile setup. This page asks what you would like to achieve. If you opened this page by mistake, use the Dashboard button at the top or the Cancel and return to profile button near the bottom. First, type your nearest town or city. Then choose one or more large goal cards. Each card has an icon and a short label. Near the bottom there is a choice for how you prefer to volunteer. There is also a contact preference section where you can choose email, phone call, text message, or not sure yet. There is an optional phone or text number box. This helps organisations contact you in a way that feels comfortable when you express interest in a role. The final button says Save and continue.";

  const shellClassName = [
    "dashboard-bg",
    "volunteer-goals-page",
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
          className="dashboard-welcome-card onboarding-welcome-card"
          aria-labelledby="goals-title"
        >
          <div className="dashboard-welcome-copy onboarding-welcome-copy">
            <p className="dashboard-kicker">Profile setup</p>

            <h1 id="goals-title" className="dashboard-title">
              <span aria-hidden="true">{avatarIcon}</span>
              <span>
                {simpleView
                  ? "What matters to you?"
                  : "What would you like to achieve?"}
              </span>
            </h1>

            <p className="dashboard-lead">
              {simpleView
                ? "Choose one or more goals. You can change these later."
                : "Choose what matters to you. We use this to suggest volunteering that feels meaningful, supportive and useful."}
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/dashboard"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">←</span>
                  <span>Back to dashboard</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Setup progress">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                🌱
              </span>
              <div>
                <h2>Step 1 of 5</h2>
                <p>20% complete</p>
              </div>
            </div>

            <div className="progress-wrap dashboard-progress-wrap">
              <div className="progress-meta">
                <span>Step 1 of 5</span>
                <span>20% complete</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span className="progress-fill" style={{ width: "20%" }} />
              </div>
            </div>

            {!simpleView ? (
              <p className="dashboard-progress-note">
                Selected goals: <strong>{selectedCount}</strong>
              </p>
            ) : null}

            {detailedView ? (
              <p className="dashboard-progress-note">
                App view: <strong>{getViewLabel(viewMode)}</strong> · Theme:{" "}
                <strong>{getThemeLabel(colourTheme)}</strong>
              </p>
            ) : null}
          </aside>
        </section>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerOnboarding} className="onboarding-form">
          <label className="field-label onboarding-field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                📍
              </span>
              <span>Your nearest town or city</span>
            </span>
            <input
              name="city"
              type="text"
              placeholder="Example: Aberdeen"
              defaultValue={volunteerProfile?.city || ""}
              required
            />
          </label>

          <fieldset className="onboarding-choice-section">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  ✨
                </span>
                <span>
                  {simpleView ? "Choose goals" : "Choose one or more goals"}
                </span>
              </span>
            </legend>

            <div className="onboarding-choice-grid">
              {goalOptions.map((option) => (
                <label key={option.value} className="onboarding-choice-card">
                  <input
                    type="checkbox"
                    name="goals"
                    value={option.value}
                    defaultChecked={selectedGoals.has(option.value)}
                  />

                  <span className="onboarding-choice-icon" aria-hidden="true">
                    {option.icon}
                  </span>

                  <span className="onboarding-choice-copy">
                    <span className="onboarding-choice-title">
                      {option.label}
                    </span>
                    {!simpleView ? (
                      <span className="onboarding-choice-description">
                        {option.helpText}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="field-label onboarding-field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                🧭
              </span>
              <span>How would you prefer to volunteer?</span>
            </span>
            <select
              name="volunteering_preference"
              defaultValue={volunteeringPreference}
            >
              <option value="both">Both in-person and remote</option>
              <option value="in_person">In-person</option>
              <option value="remote">Remote / digital</option>
            </select>
          </label>

          <section className="contact-preference-panel" aria-labelledby="contact-title">
            <div className="contact-preference-heading">
              <span className="contact-preference-icon" aria-hidden="true">
                📞
              </span>
              <div>
                <h2 id="contact-title">Contact options</h2>
                <p>
                  Choose how organisations should contact you when you express
                  interest in a role.
                </p>
              </div>
            </div>

            <fieldset className="onboarding-choice-section contact-choice-section">
              <legend>
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    💬
                  </span>
                  <span>How should organisations contact you?</span>
                </span>
              </legend>

              <div className="onboarding-choice-grid contact-choice-grid">
                {contactOptions.map((option) => (
                  <label
                    key={option.value}
                    className="onboarding-choice-card contact-choice-card"
                  >
                    <input
                      type="radio"
                      name="preferred_contact_method"
                      value={option.value}
                      defaultChecked={preferredContactMethod === option.value}
                    />

                    <span className="onboarding-choice-icon" aria-hidden="true">
                      {option.icon}
                    </span>

                    <span className="onboarding-choice-copy">
                      <span className="onboarding-choice-title">
                        {option.label}
                      </span>
                      {!simpleView ? (
                        <span className="onboarding-choice-description">
                          {option.helpText}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="field-label onboarding-field-label contact-phone-field">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  📱
                </span>
                <span>Phone or text number</span>
              </span>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Optional"
                defaultValue={volunteerProfile?.phone || ""}
              />
            </label>

            <p className="contact-privacy-note">
              <span aria-hidden="true">💛</span>
              <span>
                This is only used to help organisations contact you after you
                choose to express interest in one of their roles. You can leave
                it blank.
              </span>
            </p>
          </section>

          <div className="onboarding-actions">
            <Link href="/profile" className="secondary-button">
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>
                  {simpleView ? "Cancel" : "Cancel and return to profile"}
                </span>
              </span>
            </Link>

            <button type="submit" className="primary-button">
              <span className="button-balanced-inner">
                <span aria-hidden="true">➡️</span>
                <span>{simpleView ? "Continue" : "Save and continue"}</span>
              </span>
            </button>
          </div>
        </form>
      </section>

      <style>{`
        .volunteer-goals-page,
        .volunteer-goals-page * {
          box-sizing: border-box;
        }

        .onboarding-welcome-card {
          align-items: center;
        }

        .onboarding-form {
          display: grid;
          gap: 24px;
        }

        .onboarding-choice-section {
          min-width: 0;
          margin: 0;
          padding: 0;
          border: 0;
          display: grid;
          gap: 14px;
        }

        .onboarding-choice-section legend {
          padding: 0;
          color: #315f48;
          font-weight: 950;
        }

        .onboarding-choice-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .onboarding-choice-card {
          position: relative;
          display: grid;
          min-height: 166px;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 18px 42px rgba(33, 56, 48, 0.08);
          cursor: pointer;
          padding: 18px;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease,
            box-shadow 160ms ease;
        }

        .onboarding-choice-card:hover {
          transform: translateY(-1px);
          border-color: rgba(83, 111, 99, 0.28);
          background: rgba(255, 255, 255, 0.96);
        }

        .onboarding-choice-card input {
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .onboarding-choice-card:has(input:checked) {
          border-color: rgba(83, 111, 99, 0.58);
          background: rgba(244, 255, 249, 0.98);
          box-shadow:
            0 18px 42px rgba(33, 56, 48, 0.1),
            0 0 0 4px rgba(83, 111, 99, 0.1);
        }

        .onboarding-choice-card:has(input:checked)::after {
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

        .onboarding-choice-icon {
          display: inline-flex;
          width: 64px;
          height: 64px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(248, 248, 252, 0.94);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.1);
          font-size: 2rem;
        }

        .onboarding-choice-copy {
          display: grid;
          gap: 8px;
          padding-top: 8px;
          padding-right: 76px;
        }

        .onboarding-choice-title {
          color: #24352f;
          font-size: 1.08rem;
          font-weight: 950;
          line-height: 1.2;
        }

        .onboarding-choice-description {
          color: #5d6677;
          font-weight: 700;
          line-height: 1.45;
        }

        .contact-preference-panel {
          display: grid;
          gap: 18px;
          padding: 22px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 18px 42px rgba(33, 56, 48, 0.07);
        }

        .contact-preference-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .contact-preference-icon {
          display: inline-flex;
          width: 58px;
          height: 58px;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: rgba(244, 255, 249, 0.9);
          box-shadow: inset 0 0 0 1px rgba(83, 111, 99, 0.12);
          font-size: 1.8rem;
        }

        .contact-preference-heading h2 {
          margin: 0;
          color: #24352f;
          font-size: 1.35rem;
          font-weight: 950;
          line-height: 1.1;
        }

        .contact-preference-heading p {
          margin: 6px 0 0;
          color: #5d6677;
          font-weight: 750;
          line-height: 1.45;
        }

        .contact-choice-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .contact-choice-card {
          min-height: 156px;
        }

        .contact-phone-field {
          max-width: 36rem;
        }

        .contact-privacy-note {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
          margin: 0;
          padding: 14px 16px;
          border: 1px solid rgba(191, 146, 72, 0.18);
          border-radius: 20px;
          background: rgba(255, 250, 241, 0.86);
          color: #6d5b38;
          font-size: 0.96rem;
          font-weight: 800;
          line-height: 1.45;
        }

        .onboarding-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
        }

        .preference-view-simple .dashboard-lead {
          max-width: 56rem;
        }

        .preference-view-simple .onboarding-choice-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .preference-view-simple .onboarding-choice-card {
          min-height: 140px;
          grid-template-columns: 1fr;
          justify-items: start;
          gap: 12px;
        }

        .preference-view-simple .onboarding-choice-icon {
          width: 68px;
          height: 68px;
          font-size: 2.15rem;
        }

        .preference-view-simple .onboarding-choice-copy {
          padding-top: 0;
          padding-right: 0;
        }

        .preference-view-simple .onboarding-choice-title {
          font-size: 1.04rem;
        }

        .preference-view-simple .contact-choice-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .preference-view-detailed .onboarding-choice-card {
          min-height: 178px;
        }

        .preference-view-detailed .contact-choice-card {
          min-height: 166px;
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .dashboard-progress-note,
        .preference-text-large .onboarding-choice-description,
        .preference-text-large .onboarding-choice-section legend,
        .preference-text-large .contact-preference-heading p,
        .preference-text-large .contact-privacy-note {
          font-size: 1.04em;
        }

        .preference-theme-calm_green {
          background:
            radial-gradient(circle at top left, rgba(200, 243, 221, 0.58), transparent 34%),
            linear-gradient(135deg, #f3fff8 0%, #f7fbf5 46%, #fffaf2 100%);
        }

        .preference-theme-calm_green .dashboard-welcome-card,
        .preference-theme-calm_green .dashboard-progress-card,
        .preference-theme-calm_green .onboarding-choice-card,
        .preference-theme-calm_green .contact-preference-panel {
          border-color: rgba(83, 111, 99, 0.2);
        }

        .preference-theme-calm_green .dashboard-progress-icon,
        .preference-theme-calm_green .onboarding-choice-icon,
        .preference-theme-calm_green .contact-preference-icon {
          background: rgba(226, 255, 239, 0.86);
        }

        .preference-theme-soft_blue {
          background:
            radial-gradient(circle at top left, rgba(197, 226, 255, 0.62), transparent 34%),
            linear-gradient(135deg, #f3f9ff 0%, #f8fbff 48%, #fffaf2 100%);
        }

        .preference-theme-soft_blue .dashboard-welcome-card,
        .preference-theme-soft_blue .dashboard-progress-card,
        .preference-theme-soft_blue .onboarding-choice-card,
        .preference-theme-soft_blue .contact-preference-panel {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .preference-theme-soft_blue .dashboard-progress-icon,
        .preference-theme-soft_blue .onboarding-choice-icon,
        .preference-theme-soft_blue .contact-preference-icon {
          background: rgba(231, 244, 255, 0.92);
        }

        .preference-theme-warm_peach {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.58), transparent 34%),
            linear-gradient(135deg, #fff8f1 0%, #fffaf6 48%, #f7fff8 100%);
        }

        .preference-theme-warm_peach .dashboard-welcome-card,
        .preference-theme-warm_peach .dashboard-progress-card,
        .preference-theme-warm_peach .onboarding-choice-card,
        .preference-theme-warm_peach .contact-preference-panel {
          border-color: rgba(190, 118, 76, 0.2);
        }

        .preference-theme-warm_peach .dashboard-progress-icon,
        .preference-theme-warm_peach .onboarding-choice-icon,
        .preference-theme-warm_peach .contact-preference-icon {
          background: rgba(255, 239, 226, 0.92);
        }

        .preference-theme-high_contrast {
          background: #f8fafc;
        }

        .preference-theme-high_contrast .dashboard-welcome-card,
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .onboarding-choice-card,
        .preference-theme-high_contrast .contact-preference-panel,
        .preference-theme-high_contrast .contact-privacy-note {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .onboarding-choice-title,
        .preference-theme-high_contrast .contact-preference-heading h2 {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .progress-meta,
        .preference-theme-high_contrast .onboarding-choice-section legend,
        .preference-theme-high_contrast .onboarding-choice-description,
        .preference-theme-high_contrast .contact-preference-heading p,
        .preference-theme-high_contrast .contact-privacy-note {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-progress-icon,
        .preference-theme-high_contrast .onboarding-choice-icon,
        .preference-theme-high_contrast .contact-preference-icon {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
        }

        .preference-theme-high_contrast .onboarding-choice-card:has(input:checked) {
          border-color: #111827;
          box-shadow: 0 0 0 4px rgba(17, 24, 39, 0.14);
        }

        .preference-theme-neon_arcade {
          background:
            radial-gradient(circle at top left, rgba(34, 211, 238, 0.28), transparent 34%),
            radial-gradient(circle at top right, rgba(217, 70, 239, 0.24), transparent 30%),
            linear-gradient(135deg, #101827 0%, #15132c 46%, #071827 100%);
        }

        .preference-theme-neon_arcade .dashboard-welcome-card,
        .preference-theme-neon_arcade .dashboard-progress-card,
        .preference-theme-neon_arcade .onboarding-choice-card,
        .preference-theme-neon_arcade .contact-preference-panel,
        .preference-theme-neon_arcade .contact-privacy-note {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .dashboard-title,
        .preference-theme-neon_arcade .dashboard-progress-card h2,
        .preference-theme-neon_arcade .dashboard-progress-note strong,
        .preference-theme-neon_arcade .onboarding-choice-title,
        .preference-theme-neon_arcade .progress-meta,
        .preference-theme-neon_arcade .contact-preference-heading h2 {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .onboarding-choice-section legend,
        .preference-theme-neon_arcade .onboarding-choice-description,
        .preference-theme-neon_arcade .contact-preference-heading p,
        .preference-theme-neon_arcade .contact-privacy-note {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .onboarding-choice-icon,
        .preference-theme-neon_arcade .contact-preference-icon {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .onboarding-choice-card:hover {
          border-color: rgba(167, 243, 208, 0.58);
          background: rgba(30, 41, 59, 0.92);
        }

        .preference-theme-neon_arcade .onboarding-choice-card:has(input:checked) {
          border-color: rgba(167, 243, 208, 0.76);
          background: rgba(30, 41, 59, 0.96);
          box-shadow:
            0 20px 54px rgba(0, 0, 0, 0.34),
            0 0 0 4px rgba(34, 211, 238, 0.16);
        }

        .preference-theme-neon_arcade .onboarding-choice-card:has(input:checked)::after {
          background: rgba(34, 211, 238, 0.16);
          color: #a7f3d0;
          border: 1px solid rgba(34, 211, 238, 0.3);
        }

        .preference-theme-neon_arcade .progress-track {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(34, 211, 238, 0.28);
        }

        .preference-theme-neon_arcade .progress-fill {
          background: linear-gradient(90deg, #22d3ee, #a7f3d0, #d946ef);
        }

        @media (max-width: 1200px) {
          .contact-choice-grid,
          .preference-view-simple .contact-choice-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 1100px) {
          .preference-view-simple .onboarding-choice-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .onboarding-choice-grid,
          .preference-view-simple .onboarding-choice-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .onboarding-choice-grid,
          .contact-choice-grid,
          .preference-view-simple .onboarding-choice-grid,
          .preference-view-simple .contact-choice-grid {
            grid-template-columns: 1fr;
          }

          .onboarding-choice-card,
          .contact-choice-card,
          .preference-view-simple .onboarding-choice-card,
          .preference-view-detailed .onboarding-choice-card {
            min-height: 0;
            grid-template-columns: 1fr;
          }

          .onboarding-choice-icon,
          .preference-view-simple .onboarding-choice-icon {
            width: 58px;
            height: 58px;
            font-size: 1.9rem;
          }

          .onboarding-choice-copy,
          .preference-view-simple .onboarding-choice-copy {
            padding-top: 0;
            padding-right: 0;
          }

          .onboarding-choice-card:has(input:checked)::after {
            top: 14px;
            right: 14px;
          }

          .contact-preference-panel {
            padding: 18px;
            border-radius: 26px;
          }

          .contact-preference-heading {
            grid-template-columns: 1fr;
          }

          .contact-preference-icon {
            width: 58px;
            height: 58px;
          }

          .onboarding-actions {
            align-items: stretch;
            flex-direction: column-reverse;
          }

          .onboarding-actions .primary-button,
          .onboarding-actions .secondary-button {
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
