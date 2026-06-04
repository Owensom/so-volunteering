import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { saveVolunteerPreferences } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  full_name: string | null;
  user_type: string | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
};

type Choice = {
  value: string;
  icon: string;
  title: string;
  description: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

const viewChoices: Choice[] = [
  {
    value: "simple",
    icon: "🌤️",
    title: "Simple view",
    description: "Fewer words, larger actions and calmer pages."
  },
  {
    value: "standard",
    icon: "🌱",
    title: "Standard view",
    description: "The current balanced layout with helpful detail."
  },
  {
    value: "detailed",
    icon: "📚",
    title: "Detailed view",
    description: "More information, prompts and tracking detail."
  }
];

const colourChoices: Choice[] = [
  {
    value: "default",
    icon: "🌈",
    title: "SO default",
    description: "The current SO Volunteering colours."
  },
  {
    value: "calm_green",
    icon: "🌿",
    title: "Calm green",
    description: "A softer green-led visual style."
  },
  {
    value: "soft_blue",
    icon: "💧",
    title: "Soft blue",
    description: "A cooler, calm blue-led style."
  },
  {
    value: "warm_peach",
    icon: "🍑",
    title: "Warm peach",
    description: "A warmer, gentle colour style."
  },
  {
    value: "high_contrast",
    icon: "⚫",
    title: "High contrast",
    description: "Stronger contrast for easier reading."
  }
];

const textChoices: Choice[] = [
  {
    value: "standard",
    icon: "A",
    title: "Standard text",
    description: "Use the normal text size."
  },
  {
    value: "large",
    icon: "A+",
    title: "Larger text",
    description: "Make text slightly larger where possible."
  }
];

const listenChoices: Choice[] = [
  {
    value: "always",
    icon: "🔊",
    title: "Always show Listen",
    description: "Keep Listen buttons visible on key pages."
  },
  {
    value: "context",
    icon: "🎧",
    title: "Show when most useful",
    description: "Use Listen support mainly on guidance-heavy pages."
  }
];

const avatarChoices = ["🌱", "🌈", "⭐", "🎨", "💻", "🧰", "☕", "🐾", "🎵", "🤝", "📚", "⚽"];

function PreferenceChoiceGroup({
  name,
  choices,
  selectedValue
}: {
  name: string;
  choices: Choice[];
  selectedValue: string;
}) {
  return (
    <div className="personalise-choice-grid">
      {choices.map((choice) => (
        <label key={choice.value} className="personalise-choice-card">
          <input
            type="radio"
            name={name}
            value={choice.value}
            defaultChecked={selectedValue === choice.value}
          />

          <span className="personalise-choice-icon" aria-hidden="true">
            {choice.icon}
          </span>

          <span className="personalise-choice-copy">
            <span className="personalise-choice-title">{choice.title}</span>
            <span className="personalise-choice-description">
              {choice.description}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

function AvatarChoiceGroup({ selectedValue }: { selectedValue: string }) {
  return (
    <div className="avatar-choice-grid">
      {avatarChoices.map((avatar) => (
        <label key={avatar} className="avatar-choice-card">
          <input
            type="radio"
            name="avatar_icon"
            value={avatar}
            defaultChecked={selectedValue === avatar}
          />

          <span aria-hidden="true">{avatar}</span>
        </label>
      ))}
    </div>
  );
}

export default async function PersonalisePage({
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
    .select("full_name,user_type")
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

  const { data: preferences } = await supabase
    .from("volunteer_preferences")
    .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerPreferences>();

  const displayName =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "there";

  const viewMode = preferences?.view_mode || "standard";
  const colourTheme = preferences?.colour_theme || "default";
  const textSize = preferences?.text_size || "standard";
  const avatarIcon = preferences?.avatar_icon || "🌱";
  const listenMode = preferences?.listen_mode || "always";

  const listenText =
    "You are on the Personalise my app page. This page lets you choose how SO Volunteering feels for you. First choose Simple, Standard or Detailed view. Simple view will later show fewer words and larger actions. Standard view keeps the current layout. Detailed view will later show more information. Next choose a safe colour theme, text size, avatar icon and Listen button preference. Press Save my preferences when you are ready. These choices are stored now and will be applied across the app in the next step.";

  return (
    <main className="dashboard-bg">
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
            <InclusiveAudioButton text={listenText} />

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
          aria-labelledby="personalise-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Your app settings</p>

            <h1 id="personalise-title" className="dashboard-title">
              <span aria-hidden="true">{avatarIcon}</span>
              <span>Personalise my app</span>
            </h1>

            <p className="dashboard-lead">
              Hi {displayName}. Choose how you would like SO Volunteering to
              feel. These settings are designed to support different confidence,
              reading and comfort needs.
            </p>

            <div className="dashboard-primary-actions">
              <a
                href="#personalise-form"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">✨</span>
                  <span>Choose settings</span>
                </span>
              </a>

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

          <aside className="dashboard-progress-card" aria-label="Current preferences">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {avatarIcon}
              </span>
              <div>
                <h2>Current choices</h2>
                <p>
                  View: <strong>{viewMode}</strong>
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Theme: <strong>{colourTheme.replaceAll("_", " ")}</strong>
            </p>
            <p className="dashboard-progress-note">
              Text: <strong>{textSize}</strong>
            </p>
            <p className="dashboard-progress-note">
              Listen: <strong>{listenMode}</strong>
            </p>
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form
          id="personalise-form"
          action={saveVolunteerPreferences}
          className="personalise-form"
        >
          <section className="info-card personalise-section">
            <div className="personalise-section-heading">
              <span className="dashboard-card-icon" aria-hidden="true">
                🧭
              </span>
              <div>
                <p className="dashboard-card-label">Display mode</p>
                <h2>How much detail would you like?</h2>
                <p>
                  You can change this later. Standard view keeps the current app
                  layout while we safely roll this out.
                </p>
              </div>
            </div>

            <PreferenceChoiceGroup
              name="view_mode"
              choices={viewChoices}
              selectedValue={viewMode}
            />
          </section>

          <section className="info-card personalise-section">
            <div className="personalise-section-heading">
              <span className="dashboard-card-icon" aria-hidden="true">
                🎨
              </span>
              <div>
                <p className="dashboard-card-label">Colour comfort</p>
                <h2>Choose a safe colour theme</h2>
                <p>
                  These are preset themes so the app stays readable and
                  accessible.
                </p>
              </div>
            </div>

            <PreferenceChoiceGroup
              name="colour_theme"
              choices={colourChoices}
              selectedValue={colourTheme}
            />
          </section>

          <section className="info-card personalise-section">
            <div className="personalise-section-heading">
              <span className="dashboard-card-icon" aria-hidden="true">
                🔠
              </span>
              <div>
                <p className="dashboard-card-label">Reading comfort</p>
                <h2>Choose text size</h2>
                <p>
                  Larger text will be applied carefully so mobile layouts stay
                  stable.
                </p>
              </div>
            </div>

            <PreferenceChoiceGroup
              name="text_size"
              choices={textChoices}
              selectedValue={textSize}
            />
          </section>

          <section className="info-card personalise-section">
            <div className="personalise-section-heading">
              <span className="dashboard-card-icon" aria-hidden="true">
                {avatarIcon}
              </span>
              <div>
                <p className="dashboard-card-label">Avatar</p>
                <h2>Choose a profile icon</h2>
                <p>
                  Start with a safe avatar icon. Profile image uploads can come
                  later with privacy checks.
                </p>
              </div>
            </div>

            <AvatarChoiceGroup selectedValue={avatarIcon} />
          </section>

          <section className="info-card personalise-section">
            <div className="personalise-section-heading">
              <span className="dashboard-card-icon" aria-hidden="true">
                🔊
              </span>
              <div>
                <p className="dashboard-card-label">Listen support</p>
                <h2>Choose Listen button preference</h2>
                <p>
                  Listen support can stay visible on key pages or appear mainly
                  where guidance is most useful.
                </p>
              </div>
            </div>

            <PreferenceChoiceGroup
              name="listen_mode"
              choices={listenChoices}
              selectedValue={listenMode}
            />
          </section>

          <button type="submit" className="primary-button personalise-save-button">
            <span className="button-balanced-inner">
              <span aria-hidden="true">✅</span>
              <span>Save my preferences</span>
            </span>
          </button>
        </form>
      </section>

      <style>{`
        .personalise-form {
          display: grid;
          gap: 22px;
        }

        .personalise-section {
          display: grid;
          gap: 22px;
        }

        .personalise-section-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
        }

        .personalise-section-heading h2 {
          margin: 0 0 8px;
          color: #24352f;
          font-size: clamp(1.15rem, 2.4vw, 1.55rem);
        }

        .personalise-section-heading p {
          margin: 0;
          color: #5d6677;
          line-height: 1.55;
        }

        .personalise-choice-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .personalise-choice-card,
        .avatar-choice-card {
          position: relative;
          display: grid;
          gap: 10px;
          min-height: 100%;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.76);
          box-shadow: 0 14px 34px rgba(33, 56, 48, 0.08);
          cursor: pointer;
          padding: 16px;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .personalise-choice-card:hover,
        .avatar-choice-card:hover {
          transform: translateY(-1px);
          border-color: rgba(108, 92, 160, 0.28);
          background: rgba(255, 255, 255, 0.94);
        }

        .personalise-choice-card input,
        .avatar-choice-card input {
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .personalise-choice-card:has(input:checked),
        .avatar-choice-card:has(input:checked) {
          border-color: rgba(83, 111, 99, 0.62);
          background: rgba(244, 255, 249, 0.96);
          box-shadow:
            0 18px 42px rgba(33, 56, 48, 0.1),
            0 0 0 4px rgba(83, 111, 99, 0.1);
        }

        .personalise-choice-icon {
          display: inline-flex;
          width: 54px;
          height: 54px;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.12);
          color: #536f63;
          font-size: 1.4rem;
          font-weight: 900;
        }

        .personalise-choice-copy {
          display: grid;
          gap: 6px;
        }

        .personalise-choice-title {
          color: #24352f;
          font-weight: 900;
        }

        .personalise-choice-description {
          color: #5d6677;
          font-size: 0.92rem;
          line-height: 1.45;
        }

        .avatar-choice-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
        }

        .avatar-choice-card {
          min-height: 74px;
          align-items: center;
          justify-content: center;
          padding: 12px;
          text-align: center;
        }

        .avatar-choice-card span {
          font-size: 2rem;
        }

        .personalise-save-button {
          justify-self: start;
        }

        @media (max-width: 900px) {
          .personalise-choice-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .avatar-choice-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .personalise-section-heading {
            grid-template-columns: 1fr;
          }

          .personalise-choice-grid,
          .avatar-choice-grid {
            grid-template-columns: 1fr;
          }

          .personalise-save-button {
            width: 100%;
          }

          .avatar-choice-card {
            min-height: 64px;
          }
        }
      `}</style>
    </main>
  );
}
