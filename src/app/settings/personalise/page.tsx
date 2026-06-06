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

function formatPreferenceValue(value: string) {
  if (value === "neon_arcade") return "Neon arcade";
  return value.replaceAll("_", " ");
}

const viewChoices: Choice[] = [
  {
    value: "simple",
    icon: "🌤️",
    title: "Simple view",
    description: "Fewer words, larger actions and calmer pages.",
  },
  {
    value: "standard",
    icon: "🌱",
    title: "Standard view",
    description: "The current balanced layout with helpful detail.",
  },
  {
    value: "detailed",
    icon: "📚",
    title: "Detailed view",
    description: "More information, prompts and tracking detail.",
  },
];

const colourChoices: Choice[] = [
  {
    value: "default",
    icon: "🌈",
    title: "SO default",
    description: "The current SO Volunteering colours.",
  },
  {
    value: "calm_green",
    icon: "🌿",
    title: "Calm green",
    description: "A softer green-led visual style.",
  },
  {
    value: "soft_blue",
    icon: "💧",
    title: "Soft blue",
    description: "A cooler, calm blue-led style.",
  },
  {
    value: "warm_peach",
    icon: "🍑",
    title: "Warm peach",
    description: "A warmer, gentle colour style.",
  },
  {
    value: "high_contrast",
    icon: "⚫",
    title: "High contrast",
    description: "Stronger contrast for easier reading.",
  },
  {
    value: "neon_arcade",
    icon: "🎮",
    title: "Neon arcade",
    description: "A brighter gamer-style theme with strong colours.",
  },
];

const textChoices: Choice[] = [
  {
    value: "standard",
    icon: "A",
    title: "Standard text",
    description: "Use the normal text size.",
  },
  {
    value: "large",
    icon: "A+",
    title: "Larger text",
    description: "Make text slightly larger where possible.",
  },
];

const listenChoices: Choice[] = [
  {
    value: "always",
    icon: "🔊",
    title: "Always show Listen",
    description: "Keep Listen buttons visible on key pages.",
  },
  {
    value: "context",
    icon: "🎧",
    title: "Show when most useful",
    description: "Use Listen support mainly on guidance-heavy pages.",
  },
];

const avatarChoices = [
  "🌱",
  "🌈",
  "⭐",
  "🎨",
  "💻",
  "🧰",
  "☕",
  "🐾",
  "🎵",
  "🤝",
  "📚",
  "⚽",
  "🎮",
  "🕹️",
  "🚀",
];

function PreferenceChoiceGroup({
  name,
  choices,
  selectedValue,
}: {
  name: string;
  choices: Choice[];
  selectedValue: string;
}) {
  return (
    <div className="personalise-choice-grid">
      {choices.map((choice) => (
        <label
          key={choice.value}
          className={`personalise-choice-card ${
            choice.value === "neon_arcade" ? "neon-choice-card" : ""
          }`}
        >
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

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const listenText =
    colourTheme === "neon_arcade"
      ? "You are on the Personalise my app page. Neon arcade is a brighter gamer-style colour option. It keeps clear text, large buttons and no flashing movement. Choose your view mode, colour theme, text size, avatar and Listen setting, then save."
      : "You are on the Personalise my app page. This page lets you choose how SO Volunteering feels for you. First choose Simple, Standard or Detailed view. Simple view shows fewer words and larger actions. Standard view keeps the balanced layout. Detailed view shows more information. Next choose a colour theme, text size, avatar icon and Listen button preference. Press Save my preferences when you are ready.";

  const shellClassName = [
    "dashboard-bg",
    "personalise-page",
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
              feel. Most users may prefer calm themes, but brighter choices are
              available too.
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
                  View: <strong>{formatPreferenceValue(viewMode)}</strong>
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Theme: <strong>{formatPreferenceValue(colourTheme)}</strong>
            </p>
            <p className="dashboard-progress-note">
              Text: <strong>{formatPreferenceValue(textSize)}</strong>
            </p>
            <p className="dashboard-progress-note">
              Listen: <strong>{formatPreferenceValue(listenMode)}</strong>
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
                  You can change this later. Simple reduces wording. Detailed
                  gives more guidance.
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
                <h2>Choose a colour theme</h2>
                <p>
                  Calm themes stay soft. Neon arcade gives a brighter gamer feel
                  without flashing or moving effects.
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
                  Choose an icon that feels like you. You can change it later.
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
        .personalise-page,
        .personalise-page * {
          box-sizing: border-box;
        }

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

        .neon-choice-card {
          background:
            radial-gradient(circle at top left, rgba(34, 211, 238, 0.2), transparent 55%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(49, 46, 129, 0.88));
          border-color: rgba(34, 211, 238, 0.35);
        }

        .neon-choice-card .personalise-choice-title {
          color: #e0f2fe;
        }

        .neon-choice-card .personalise-choice-description {
          color: #dbeafe;
        }

        .neon-choice-card .personalise-choice-icon {
          background: rgba(34, 211, 238, 0.14);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.3);
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .personalise-section-heading p,
        .preference-text-large .personalise-choice-description,
        .preference-text-large .dashboard-progress-note {
          font-size: 1.04em;
        }

        .preference-view-simple .personalise-choice-grid {
          gap: 16px;
        }

        .preference-view-simple .personalise-choice-card {
          min-height: 126px;
        }

        .preference-view-simple .personalise-choice-description {
          display: none;
        }

        .preference-view-simple .personalise-choice-icon {
          width: 62px;
          height: 62px;
          font-size: 1.7rem;
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
        .preference-theme-high_contrast .personalise-choice-card,
        .preference-theme-high_contrast .avatar-choice-card {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .personalise-section-heading h2,
        .preference-theme-high_contrast .personalise-choice-title {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .personalise-section-heading p,
        .preference-theme-high_contrast .personalise-choice-description {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-card-icon,
        .preference-theme-high_contrast .dashboard-progress-icon,
        .preference-theme-high_contrast .personalise-choice-icon {
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
        .preference-theme-neon_arcade .info-card,
        .preference-theme-neon_arcade .personalise-choice-card,
        .preference-theme-neon_arcade .avatar-choice-card {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .dashboard-title,
        .preference-theme-neon_arcade .personalise-section-heading h2,
        .preference-theme-neon_arcade .personalise-choice-title,
        .preference-theme-neon_arcade .dashboard-progress-card h2,
        .preference-theme-neon_arcade .dashboard-progress-note strong {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .personalise-section-heading p,
        .preference-theme-neon_arcade .personalise-choice-description {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-card-icon,
        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .personalise-choice-icon {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
        }

        .preference-theme-neon_arcade .personalise-choice-card:has(input:checked),
        .preference-theme-neon_arcade .avatar-choice-card:has(input:checked) {
          border-color: rgba(167, 243, 208, 0.76);
          background: rgba(30, 41, 59, 0.96);
          box-shadow:
            0 20px 54px rgba(0, 0, 0, 0.34),
            0 0 0 4px rgba(34, 211, 238, 0.16);
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
