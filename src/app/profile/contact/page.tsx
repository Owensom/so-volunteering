import Link from "next/link";
import { redirect } from "next/navigation";
import { saveVolunteerContactOptions } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type VolunteerProfile = {
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

type ContactOption = {
  value: string;
  label: string;
  icon: string;
  helpText: string;
};

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

function formatContactMethod(value: string | null | undefined) {
  if (value === "sms") return "Text message";
  if (value === "phone") return "Phone call";
  if (value === "not_sure") return "Not sure yet";
  return "Email";
}

export default async function VolunteerContactPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";
  const successMessage = params.message ? decodeURIComponent(params.message) : "";

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
    .select("preferred_contact_method,phone")
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

  const preferredContactMethod = normalisePreferredContactMethod(
    volunteerProfile?.preferred_contact_method,
  );

  const listenText = simpleView
    ? "This is your contact options page. Choose how organisations should contact you. You can add a phone or text number if you want to. Press Save contact options."
    : "This is your contact options page. Choose how organisations should contact you after you express interest in one of their roles. You can choose email, phone call, text message, or not sure yet. You can also add a phone or text number. This is optional. Use Save contact options when you are finished.";

  const shellClassName = [
    "dashboard-bg",
    "volunteer-contact-page",
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
              href="/profile"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Profile</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="contact-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Your profile</p>

            <h1 id="contact-title" className="dashboard-title">
              <span aria-hidden="true">📞</span>
              <span>Contact options</span>
            </h1>

            <p className="dashboard-lead">
              Choose how organisations should contact you when you express
              interest in a role. You stay in control and can change this later.
            </p>

            <div className="dashboard-primary-actions">
              <Link href="/profile" className="secondary-button dashboard-main-action">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">←</span>
                  <span>Back to profile</span>
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🏠</span>
                  <span>Dashboard</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Current contact choice">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {avatarIcon}
              </span>
              <div>
                <h2>Current choice</h2>
                <p>
                  <strong>{formatContactMethod(preferredContactMethod)}</strong>
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Phone/text number:{" "}
              <strong>
                {volunteerProfile?.phone?.trim() ? "Added" : "Not added"}
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

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerContactOptions} className="contact-form">
          <section className="contact-panel">
            <div className="contact-panel-heading">
              <span className="contact-panel-icon" aria-hidden="true">
                💬
              </span>
              <div>
                <h2>How should organisations contact you?</h2>
                <p>
                  Choose what feels easiest. This can be shared with an
                  organisation after you express interest in their role.
                </p>
              </div>
            </div>

            <fieldset className="contact-choice-section">
              <legend className="sr-only">Preferred contact method</legend>

              <div className="contact-choice-grid">
                {contactOptions.map((option) => (
                  <label key={option.value} className="contact-choice-card">
                    <input
                      type="radio"
                      name="preferred_contact_method"
                      value={option.value}
                      defaultChecked={preferredContactMethod === option.value}
                    />

                    <span className="contact-choice-icon" aria-hidden="true">
                      {option.icon}
                    </span>

                    <span className="contact-choice-copy">
                      <span className="contact-choice-title">
                        {option.label}
                      </span>
                      {!simpleView ? (
                        <span className="contact-choice-description">
                          {option.helpText}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="field-label contact-phone-field">
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
                You can leave this blank. It is only used to help organisations
                contact you after you choose to express interest in a role.
              </span>
            </p>

            <div className="contact-actions">
              <Link href="/profile" className="secondary-button">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">←</span>
                  <span>Cancel</span>
                </span>
              </Link>

              <button type="submit" className="primary-button">
                <span className="button-balanced-inner">
                  <span aria-hidden="true">✅</span>
                  <span>Save contact options</span>
                </span>
              </button>
            </div>
          </section>
        </form>
      </section>

      <style>{`
        .volunteer-contact-page,
        .volunteer-contact-page * {
          box-sizing: border-box;
        }

        .contact-form {
          display: grid;
          gap: 22px;
        }

        .contact-panel {
          display: grid;
          gap: 22px;
          padding: 24px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 18px 42px rgba(33, 56, 48, 0.07);
        }

        .contact-panel-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .contact-panel-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(244, 255, 249, 0.9);
          box-shadow: inset 0 0 0 1px rgba(83, 111, 99, 0.12);
          font-size: 1.9rem;
        }

        .contact-panel-heading h2 {
          margin: 0;
          color: #24352f;
          font-size: 1.35rem;
          font-weight: 950;
          line-height: 1.1;
        }

        .contact-panel-heading p {
          margin: 7px 0 0;
          color: #5d6677;
          font-weight: 750;
          line-height: 1.45;
        }

        .contact-choice-section {
          min-width: 0;
          margin: 0;
          padding: 0;
          border: 0;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
        }

        .contact-choice-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .contact-choice-card {
          position: relative;
          display: grid;
          min-height: 162px;
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

        .contact-choice-card:hover {
          transform: translateY(-1px);
          border-color: rgba(83, 111, 99, 0.28);
          background: rgba(255, 255, 255, 0.96);
        }

        .contact-choice-card input {
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .contact-choice-card:has(input:checked) {
          border-color: rgba(83, 111, 99, 0.58);
          background: rgba(244, 255, 249, 0.98);
          box-shadow:
            0 18px 42px rgba(33, 56, 48, 0.1),
            0 0 0 4px rgba(83, 111, 99, 0.1);
        }

        .contact-choice-card:has(input:checked)::after {
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

        .contact-choice-icon {
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

        .contact-choice-copy {
          display: grid;
          gap: 8px;
          padding-top: 8px;
          padding-right: 76px;
        }

        .contact-choice-title {
          color: #24352f;
          font-size: 1.08rem;
          font-weight: 950;
          line-height: 1.2;
        }

        .contact-choice-description {
          color: #5d6677;
          font-weight: 700;
          line-height: 1.45;
        }

        .contact-phone-field {
          max-width: 38rem;
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

        .contact-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .dashboard-progress-note,
        .preference-text-large .contact-choice-description,
        .preference-text-large .contact-panel-heading p,
        .preference-text-large .contact-privacy-note {
          font-size: 1.04em;
        }

        .preference-view-simple .contact-choice-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .preference-view-simple .contact-choice-card {
          min-height: 142px;
          grid-template-columns: 1fr;
          justify-items: start;
          gap: 12px;
        }

        .preference-view-simple .contact-choice-icon {
          width: 68px;
          height: 68px;
          font-size: 2.15rem;
        }

        .preference-view-simple .contact-choice-copy {
          padding-top: 0;
          padding-right: 0;
        }

        .preference-theme-calm_green {
          background:
            radial-gradient(circle at top left, rgba(200, 243, 221, 0.58), transparent 34%),
            linear-gradient(135deg, #f3fff8 0%, #f7fbf5 46%, #fffaf2 100%);
        }

        .preference-theme-calm_green .dashboard-welcome-card,
        .preference-theme-calm_green .dashboard-progress-card,
        .preference-theme-calm_green .contact-panel,
        .preference-theme-calm_green .contact-choice-card {
          border-color: rgba(83, 111, 99, 0.2);
        }

        .preference-theme-calm_green .dashboard-progress-icon,
        .preference-theme-calm_green .contact-panel-icon,
        .preference-theme-calm_green .contact-choice-icon {
          background: rgba(226, 255, 239, 0.86);
        }

        .preference-theme-soft_blue {
          background:
            radial-gradient(circle at top left, rgba(197, 226, 255, 0.62), transparent 34%),
            linear-gradient(135deg, #f3f9ff 0%, #f8fbff 48%, #fffaf2 100%);
        }

        .preference-theme-soft_blue .dashboard-welcome-card,
        .preference-theme-soft_blue .dashboard-progress-card,
        .preference-theme-soft_blue .contact-panel,
        .preference-theme-soft_blue .contact-choice-card {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .preference-theme-soft_blue .dashboard-progress-icon,
        .preference-theme-soft_blue .contact-panel-icon,
        .preference-theme-soft_blue .contact-choice-icon {
          background: rgba(231, 244, 255, 0.92);
        }

        .preference-theme-warm_peach {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.58), transparent 34%),
            linear-gradient(135deg, #fff8f1 0%, #fffaf6 48%, #f7fff8 100%);
        }

        .preference-theme-warm_peach .dashboard-welcome-card,
        .preference-theme-warm_peach .dashboard-progress-card,
        .preference-theme-warm_peach .contact-panel,
        .preference-theme-warm_peach .contact-choice-card {
          border-color: rgba(190, 118, 76, 0.2);
        }

        .preference-theme-warm_peach .dashboard-progress-icon,
        .preference-theme-warm_peach .contact-panel-icon,
        .preference-theme-warm_peach .contact-choice-icon {
          background: rgba(255, 239, 226, 0.92);
        }

        .preference-theme-high_contrast {
          background: #f8fafc;
        }

        .preference-theme-high_contrast .dashboard-welcome-card,
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .contact-panel,
        .preference-theme-high_contrast .contact-choice-card,
        .preference-theme-high_contrast .contact-privacy-note {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .contact-panel-heading h2,
        .preference-theme-high_contrast .contact-choice-title {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .contact-panel-heading p,
        .preference-theme-high_contrast .contact-choice-description,
        .preference-theme-high_contrast .contact-privacy-note {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-progress-icon,
        .preference-theme-high_contrast .contact-panel-icon,
        .preference-theme-high_contrast .contact-choice-icon {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
        }

        .preference-theme-high_contrast .contact-choice-card:has(input:checked) {
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
        .preference-theme-neon_arcade .contact-panel,
        .preference-theme-neon_arcade .contact-choice-card,
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
        .preference-theme-neon_arcade .contact-panel-heading h2,
        .preference-theme-neon_arcade .contact-choice-title {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .contact-panel-heading p,
        .preference-theme-neon_arcade .contact-choice-description,
        .preference-theme-neon_arcade .contact-privacy-note {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .contact-panel-icon,
        .preference-theme-neon_arcade .contact-choice-icon {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .contact-choice-card:hover {
          border-color: rgba(167, 243, 208, 0.58);
          background: rgba(30, 41, 59, 0.92);
        }

        .preference-theme-neon_arcade .contact-choice-card:has(input:checked) {
          border-color: rgba(167, 243, 208, 0.76);
          background: rgba(30, 41, 59, 0.96);
          box-shadow:
            0 20px 54px rgba(0, 0, 0, 0.34),
            0 0 0 4px rgba(34, 211, 238, 0.16);
        }

        .preference-theme-neon_arcade .contact-choice-card:has(input:checked)::after {
          background: rgba(34, 211, 238, 0.16);
          color: #a7f3d0;
          border: 1px solid rgba(34, 211, 238, 0.3);
        }

        @media (max-width: 1200px) {
          .contact-choice-grid,
          .preference-view-simple .contact-choice-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .contact-panel {
            padding: 18px;
            border-radius: 26px;
          }

          .contact-panel-heading {
            grid-template-columns: 1fr;
          }

          .contact-choice-grid,
          .preference-view-simple .contact-choice-grid {
            grid-template-columns: 1fr;
          }

          .contact-choice-card,
          .preference-view-simple .contact-choice-card {
            min-height: 0;
            grid-template-columns: 1fr;
          }

          .contact-choice-icon,
          .preference-view-simple .contact-choice-icon {
            width: 58px;
            height: 58px;
            font-size: 1.9rem;
          }

          .contact-choice-copy,
          .preference-view-simple .contact-choice-copy {
            padding-top: 0;
            padding-right: 0;
          }

          .contact-choice-card:has(input:checked)::after {
            top: 14px;
            right: 14px;
          }

          .contact-actions {
            align-items: stretch;
            flex-direction: column-reverse;
          }

          .contact-actions .primary-button,
          .contact-actions .secondary-button {
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
