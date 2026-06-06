import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { submitAppHelpRequest } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  full_name: string | null;
  email: string | null;
  user_type: string | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
};

type HelpCategory = {
  value: string;
  icon: string;
  title: string;
  description: string;
};

function normaliseUserType(value: string | null | undefined) {
  if (value?.trim().toLowerCase() === "organisation") {
    return "organisation";
  }

  return "volunteer";
}

function getDashboardHref(userType: string) {
  return userType === "organisation" ? "/organisation/dashboard" : "/dashboard";
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
  return value && value.trim() ? value : "🧭";
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

const helpCategories: HelpCategory[] = [
  {
    value: "stuck_using_app",
    icon: "🧭",
    title: "I am stuck using the app",
    description: "You are not sure where to go or what to do next.",
  },
  {
    value: "something_not_working",
    icon: "🛠️",
    title: "Something is not working",
    description: "A page, button, form or link is not working as expected.",
  },
  {
    value: "account_or_profile",
    icon: "👤",
    title: "I need help with my account or profile",
    description:
      "You need help with login, setup, profile details or contact information.",
  },
  {
    value: "opportunity_help",
    icon: "📣",
    title: "I need help with an opportunity",
    description:
      "You need help with a volunteering role, interest, or role information.",
  },
  {
    value: "report_problem",
    icon: "⚠️",
    title: "I want to report a problem",
    description:
      "Something looks wrong, confusing, inappropriate or unsafe in the app.",
  },
  {
    value: "safety_or_safeguarding",
    icon: "🛡️",
    title: "I have a safety or safeguarding concern",
    description: "Use this if your concern is serious or relates to safety.",
  },
];

export default async function HelpUsingAppPage({
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
    .select("full_name,email,user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);
  const dashboardHref = getDashboardHref(userType);

  const { data: preferences } =
    userType === "volunteer"
      ? await supabase
          .from("volunteer_preferences")
          .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
          .eq("user_id", user.id)
          .maybeSingle<VolunteerPreferences>()
      : { data: null as VolunteerPreferences | null };

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = userType === "volunteer" && viewMode === "simple";
  const detailedView = userType === "volunteer" && viewMode === "detailed";

  const displayName =
    profile?.full_name ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "there";

  const listenText = simpleView
    ? "This page is for help using the app. Choose one card, write a short message, then send. If someone is in immediate danger, contact emergency services first."
    : "This page is called Help using the app. It is for getting help if you are stuck, something is not working, or you want to report a problem with SO Volunteering. This is different from your personal support needs profile. Choose one help card, then write a short message about what happened. If someone is in immediate danger, contact emergency services first. This form is not monitored instantly.";

  const shellClassName =
    userType === "volunteer"
      ? [
          "dashboard-bg",
          "app-help-page",
          getThemeClass(colourTheme),
          getTextClass(textSize),
          getViewClass(viewMode),
        ].join(" ")
      : "dashboard-bg app-help-page";

  return (
    <main className={shellClassName}>
      <section className="dashboard-shell">
        <header className="dashboard-topbar app-help-topbar">
          <Link
            href={dashboardHref}
            className="dashboard-brand"
            aria-label="Back to dashboard"
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

          <div className="dashboard-topbar-actions app-help-topbar-actions">
            {userType === "organisation" ||
            listenMode === "always" ||
            listenMode === "context" ? (
              <InclusiveAudioButton text={listenText} />
            ) : null}

            <Link
              href={dashboardHref}
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
          className="dashboard-welcome-card app-help-hero"
          aria-labelledby="help-title"
        >
          <div className="dashboard-welcome-copy app-help-hero-copy">
            <p className="dashboard-kicker">Help using the app</p>

            <h1 id="help-title" className="dashboard-title app-help-title">
              <span aria-hidden="true">
                {userType === "volunteer" ? avatarIcon : "🧭"}
              </span>
              <span>
                {simpleView
                  ? "Need app help?"
                  : "Need help using SO Volunteering?"}
              </span>
            </h1>

            <p className="dashboard-lead app-help-lead">
              {simpleView
                ? `Hi ${displayName}. Tell us what is not working or where you are stuck.`
                : `Hi ${displayName}. Use this page if you are stuck, something is not working, or you want to report a problem with the app.`}
            </p>

            <p className="app-help-clarity-note">
              {simpleView
                ? "This is for app help."
                : "This is for app help. Your personal volunteering support needs are still managed in your profile."}
            </p>
          </div>

          <aside className="dashboard-progress-card app-help-safety-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                🛡️
              </span>
              <div>
                <h2>Safety note</h2>
                <p>This form is not monitored instantly.</p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              If someone is in immediate danger, contact emergency services
              first.
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

        <form action={submitAppHelpRequest} className="app-help-form">
          <section className="app-help-section" aria-labelledby="help-category">
            <p id="help-category" className="section-label">
              ✨ {simpleView ? "Choose help type" : "What do you need help with?"}
            </p>

            <div className="app-help-choice-grid">
              {helpCategories.map((category) => (
                <label key={category.value} className="app-help-choice-card">
                  <input
                    type="radio"
                    name="category"
                    value={category.value}
                    required
                  />

                  <span className="app-help-choice-icon" aria-hidden="true">
                    {category.icon}
                  </span>

                  <span className="app-help-choice-copy">
                    <span className="app-help-choice-title">
                      {category.title}
                    </span>
                    {!simpleView ? (
                      <span className="app-help-choice-description">
                        {category.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                💬
              </span>
              <span>{simpleView ? "What happened?" : "Tell us what happened"}</span>
            </span>
            <textarea
              name="message"
              rows={simpleView ? 4 : 5}
              required
              placeholder={
                simpleView
                  ? "Write a short message."
                  : "Please write a short message. For example: I was on the profile page and the save button did not work."
              }
            />
          </label>

          {!simpleView ? (
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  🔗
                </span>
                <span>Optional: page or area of the app</span>
              </span>
              <input
                name="page_context"
                type="text"
                placeholder="Example: Dashboard, Profile, Opportunities, Interest inbox"
              />
            </label>
          ) : (
            <input type="hidden" name="page_context" value="" />
          )}

          <div className="app-help-actions">
            <Link href={dashboardHref} className="secondary-button">
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>
                  {simpleView ? "Cancel" : "Cancel and return to dashboard"}
                </span>
              </span>
            </Link>

            <button type="submit" className="primary-button">
              <span className="button-balanced-inner">
                <span aria-hidden="true">✅</span>
                <span>{simpleView ? "Send" : "Send help request"}</span>
              </span>
            </button>
          </div>
        </form>
      </section>

      <style>{`
        .app-help-page,
        .app-help-page * {
          box-sizing: border-box;
        }

        .app-help-clarity-note {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          margin: 0;
          padding: 10px 14px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.82);
          color: #536f63;
          font-weight: 850;
          line-height: 1.25;
        }

        .app-help-form {
          display: grid;
          gap: 24px;
        }

        .app-help-section {
          display: grid;
          gap: 14px;
        }

        .section-label {
          margin: 0;
          color: #4d5566;
          font-weight: 900;
          letter-spacing: 0.01em;
        }

        .app-help-choice-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .app-help-choice-card {
          position: relative;
          display: grid;
          min-height: 172px;
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

        .app-help-choice-card:hover {
          transform: translateY(-1px);
          border-color: rgba(83, 111, 99, 0.28);
          background: rgba(255, 255, 255, 0.96);
        }

        .app-help-choice-card input {
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .app-help-choice-card:has(input:checked) {
          border-color: rgba(83, 111, 99, 0.58);
          background: rgba(244, 255, 249, 0.98);
          box-shadow:
            0 18px 42px rgba(33, 56, 48, 0.1),
            0 0 0 4px rgba(83, 111, 99, 0.1);
        }

        .app-help-choice-card:has(input:checked)::after {
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

        .app-help-choice-icon {
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

        .app-help-choice-copy {
          display: grid;
          gap: 8px;
          padding-top: 8px;
          padding-right: 76px;
        }

        .app-help-choice-title {
          color: #24352f;
          font-size: 1.04rem;
          font-weight: 950;
          line-height: 1.2;
        }

        .app-help-choice-description {
          color: #5d6677;
          font-weight: 700;
          line-height: 1.45;
        }

        .app-help-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
        }

        .preference-view-simple .app-help-choice-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .preference-view-simple .app-help-choice-card {
          min-height: 144px;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .preference-view-simple .app-help-choice-icon {
          width: 68px;
          height: 68px;
          font-size: 2.15rem;
        }

        .preference-view-simple .app-help-choice-copy {
          padding-top: 0;
          padding-right: 0;
        }

        .preference-view-simple .app-help-choice-title {
          font-size: 1.02rem;
        }

        .preference-view-detailed .app-help-choice-card {
          min-height: 184px;
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .dashboard-progress-note,
        .preference-text-large .app-help-choice-description,
        .preference-text-large .section-label,
        .preference-text-large .app-help-clarity-note {
          font-size: 1.04em;
        }

        .preference-theme-calm_green {
          background:
            radial-gradient(circle at top left, rgba(200, 243, 221, 0.58), transparent 34%),
            linear-gradient(135deg, #f3fff8 0%, #f7fbf5 46%, #fffaf2 100%);
        }

        .preference-theme-calm_green .dashboard-welcome-card,
        .preference-theme-calm_green .dashboard-progress-card,
        .preference-theme-calm_green .app-help-choice-card,
        .preference-theme-calm_green .app-help-clarity-note {
          border-color: rgba(83, 111, 99, 0.2);
        }

        .preference-theme-calm_green .dashboard-progress-icon,
        .preference-theme-calm_green .app-help-choice-icon {
          background: rgba(226, 255, 239, 0.86);
        }

        .preference-theme-soft_blue {
          background:
            radial-gradient(circle at top left, rgba(197, 226, 255, 0.62), transparent 34%),
            linear-gradient(135deg, #f3f9ff 0%, #f8fbff 48%, #fffaf2 100%);
        }

        .preference-theme-soft_blue .dashboard-welcome-card,
        .preference-theme-soft_blue .dashboard-progress-card,
        .preference-theme-soft_blue .app-help-choice-card,
        .preference-theme-soft_blue .app-help-clarity-note {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .preference-theme-soft_blue .dashboard-progress-icon,
        .preference-theme-soft_blue .app-help-choice-icon {
          background: rgba(231, 244, 255, 0.92);
        }

        .preference-theme-warm_peach {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.58), transparent 34%),
            linear-gradient(135deg, #fff8f1 0%, #fffaf6 48%, #f7fff8 100%);
        }

        .preference-theme-warm_peach .dashboard-welcome-card,
        .preference-theme-warm_peach .dashboard-progress-card,
        .preference-theme-warm_peach .app-help-choice-card,
        .preference-theme-warm_peach .app-help-clarity-note {
          border-color: rgba(190, 118, 76, 0.2);
        }

        .preference-theme-warm_peach .dashboard-progress-icon,
        .preference-theme-warm_peach .app-help-choice-icon {
          background: rgba(255, 239, 226, 0.92);
        }

        .preference-theme-high_contrast {
          background: #f8fafc;
        }

        .preference-theme-high_contrast .dashboard-welcome-card,
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .app-help-choice-card,
        .preference-theme-high_contrast .app-help-clarity-note {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .app-help-choice-title {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .section-label,
        .preference-theme-high_contrast .app-help-choice-description,
        .preference-theme-high_contrast .app-help-clarity-note {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-progress-icon,
        .preference-theme-high_contrast .app-help-choice-icon {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
        }

        .preference-theme-high_contrast .app-help-choice-card:has(input:checked) {
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
        .preference-theme-neon_arcade .app-help-choice-card,
        .preference-theme-neon_arcade .app-help-clarity-note {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .dashboard-title,
        .preference-theme-neon_arcade .dashboard-progress-card h2,
        .preference-theme-neon_arcade .dashboard-progress-note strong,
        .preference-theme-neon_arcade .app-help-choice-title {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .section-label,
        .preference-theme-neon_arcade .app-help-choice-description,
        .preference-theme-neon_arcade .app-help-clarity-note {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .app-help-choice-icon {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .app-help-choice-card:hover {
          border-color: rgba(167, 243, 208, 0.58);
          background: rgba(30, 41, 59, 0.92);
        }

        .preference-theme-neon_arcade .app-help-choice-card:has(input:checked) {
          border-color: rgba(167, 243, 208, 0.76);
          background: rgba(30, 41, 59, 0.96);
          box-shadow:
            0 20px 54px rgba(0, 0, 0, 0.34),
            0 0 0 4px rgba(34, 211, 238, 0.16);
        }

        .preference-theme-neon_arcade .app-help-choice-card:has(input:checked)::after {
          background: rgba(34, 211, 238, 0.16);
          color: #a7f3d0;
          border: 1px solid rgba(34, 211, 238, 0.3);
        }

        @media (max-width: 900px) {
          .app-help-choice-grid,
          .preference-view-simple .app-help-choice-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .app-help-topbar {
            gap: 14px;
          }

          .app-help-topbar-actions {
            width: 100%;
            justify-content: stretch;
          }

          .app-help-topbar-actions > *,
          .app-help-topbar-actions a,
          .app-help-topbar-actions button {
            width: 100%;
          }

          .app-help-hero {
            padding: 24px 20px;
          }

          .app-help-title {
            font-size: 2.25rem !important;
            line-height: 1.03 !important;
            letter-spacing: -0.045em !important;
          }

          .app-help-lead {
            font-size: 1.02rem !important;
            line-height: 1.48 !important;
          }

          .app-help-clarity-note {
            width: 100%;
            border-radius: 18px;
          }

          .app-help-choice-grid,
          .preference-view-simple .app-help-choice-grid {
            grid-template-columns: 1fr;
          }

          .app-help-choice-card,
          .preference-view-simple .app-help-choice-card,
          .preference-view-detailed .app-help-choice-card {
            min-height: 0;
            grid-template-columns: 1fr;
          }

          .app-help-choice-icon,
          .preference-view-simple .app-help-choice-icon {
            width: 58px;
            height: 58px;
            font-size: 1.9rem;
          }

          .app-help-choice-copy,
          .preference-view-simple .app-help-choice-copy {
            padding-top: 0;
            padding-right: 0;
          }

          .app-help-choice-card:has(input:checked)::after {
            top: 14px;
            right: 14px;
          }

          .app-help-actions {
            align-items: stretch;
            flex-direction: column-reverse;
          }

          .app-help-actions .primary-button,
          .app-help-actions .secondary-button {
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
