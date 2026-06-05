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

function normaliseUserType(value: string | null | undefined) {
  if (value?.trim().toLowerCase() === "organisation") {
    return "organisation";
  }

  return "volunteer";
}

function getDashboardHref(userType: string) {
  return userType === "organisation" ? "/organisation/dashboard" : "/dashboard";
}

const helpCategories = [
  {
    value: "stuck_using_app",
    icon: "🧭",
    title: "I am stuck using the app",
    description: "You are not sure where to go or what to do next."
  },
  {
    value: "something_not_working",
    icon: "🛠️",
    title: "Something is not working",
    description: "A page, button, form or link is not working as expected."
  },
  {
    value: "account_or_profile",
    icon: "👤",
    title: "I need help with my account or profile",
    description: "You need help with login, setup, profile details or contact information."
  },
  {
    value: "opportunity_help",
    icon: "📣",
    title: "I need help with an opportunity",
    description: "You need help with a volunteering role, interest, or role information."
  },
  {
    value: "report_problem",
    icon: "⚠️",
    title: "I want to report a problem",
    description: "Something looks wrong, confusing, inappropriate or unsafe in the app."
  },
  {
    value: "safety_or_safeguarding",
    icon: "🛡️",
    title: "I have a safety or safeguarding concern",
    description: "Use this if your concern is serious or relates to safety."
  }
];

export default async function HelpUsingAppPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";
  const successMessage = params.message ? decodeURIComponent(params.message) : "";

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
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);
  const dashboardHref = getDashboardHref(userType);

  const displayName =
    profile?.full_name ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "there";

  const listenText =
    "This page is called Help using the app. It is for getting help if you are stuck, something is not working, or you want to report a problem with SO Volunteering. This is different from your personal support needs profile. Choose one help card, then write a short message about what happened. If someone is in immediate danger, contact emergency services first. This form is not monitored instantly.";

  return (
    <main className="dashboard-bg app-help-page">
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
            <InclusiveAudioButton text={listenText} />

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
              <span aria-hidden="true">🧭</span>
              <span>Need help using SO Volunteering?</span>
            </h1>

            <p className="dashboard-lead app-help-lead">
              Hi {displayName}. Use this page if you are stuck, something is not
              working, or you want to report a problem with the app.
            </p>

            <p className="app-help-clarity-note">
              This is for app help. Your personal volunteering support needs are
              still managed in your profile.
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
              ✨ What do you need help with?
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
                    <span className="app-help-choice-description">
                      {category.description}
                    </span>
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
              <span>Tell us what happened</span>
            </span>
            <textarea
              name="message"
              rows={5}
              required
              placeholder="Please write a short message. For example: I was on the profile page and the save button did not work."
            />
          </label>

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

          <div className="app-help-actions">
            <Link href={dashboardHref} className="secondary-button">
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Cancel and return to dashboard</span>
              </span>
            </Link>

            <button type="submit" className="primary-button">
              <span className="button-balanced-inner">
                <span aria-hidden="true">✅</span>
                <span>Send help request</span>
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

        @media (max-width: 900px) {
          .app-help-choice-grid {
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

          .app-help-choice-grid {
            grid-template-columns: 1fr;
          }

          .app-help-choice-card {
            min-height: 0;
            grid-template-columns: 1fr;
          }

          .app-help-choice-icon {
            width: 58px;
            height: 58px;
          }

          .app-help-actions {
            align-items: stretch;
            flex-direction: column-reverse;
          }

          .app-help-actions .primary-button,
          .app-help-actions .secondary-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
