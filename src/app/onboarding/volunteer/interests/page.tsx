import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { saveVolunteerInterests } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type VolunteerProfile = {
  interests: string[] | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
};

type InterestChoice = {
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

const interestChoices: InterestChoice[] = [
  {
    value: "Helping people",
    icon: "🤝",
    title: "Helping people",
    description: "Support visitors, neighbours or community members.",
  },
  {
    value: "Animals and nature",
    icon: "🌿",
    title: "Animals and nature",
    description: "Outdoor roles, gardens, animals or green spaces.",
  },
  {
    value: "Events and activities",
    icon: "🎪",
    title: "Events and activities",
    description: "Help at events, groups, clubs or fundraisers.",
  },
  {
    value: "Creative tasks",
    icon: "🎨",
    title: "Creative tasks",
    description: "Music, art, design, photography, writing or making.",
  },
  {
    value: "Practical tasks",
    icon: "🧰",
    title: "Practical tasks",
    description: "Set up rooms, sort items, pack things or hands-on help.",
  },
  {
    value: "Digital or admin",
    icon: "💻",
    title: "Digital or admin",
    description: "Simple computer, forms, emails or organising tasks.",
  },
  {
    value: "Sport and movement",
    icon: "⚽",
    title: "Sport and movement",
    description: "Active roles, coaching support or helping groups move.",
  },
  {
    value: "Music and performance",
    icon: "🎵",
    title: "Music and performance",
    description: "Music, drama, performance, sound or creative events.",
  },
  {
    value: "Learning and mentoring",
    icon: "📚",
    title: "Learning and mentoring",
    description: "Support learning, reading, confidence or skills.",
  },
  {
    value: "Food and hospitality",
    icon: "☕",
    title: "Food and hospitality",
    description: "Welcome people, serve refreshments or help with meals.",
  },
  {
    value: "Community projects",
    icon: "🏘️",
    title: "Community projects",
    description: "Local groups, neighbourhood projects or community support.",
  },
  {
    value: "Open to ideas",
    icon: "🌈",
    title: "Open to ideas",
    description: "You are not sure yet and would like to explore options.",
  },
];

export default async function VolunteerInterestsPage({
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
    .select("interests")
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

  const selectedInterests = new Set(volunteerProfile?.interests ?? []);
  const selectedCount = selectedInterests.size;

  const listenText = simpleView
    ? "You are on step two. Choose what you might enjoy trying. Pick one or more cards. Choose Open to ideas if you are not sure. Press Continue to skills when you are ready."
    : "You are on step two of your volunteer profile setup. This page asks what you might enjoy trying. If you opened this page by mistake, use the Dashboard button at the top or the Cancel and return to profile button near the bottom. First, choose one or more interest cards. You can choose as many as feel right. This does not lock you into anything. It just helps the app understand what might feel enjoyable, realistic and encouraging. If you are not sure, choose Open to ideas. Press Continue to skills when you are ready.";

  const shellClassName = [
    "dashboard-bg",
    "volunteer-interests-page",
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
          aria-labelledby="interests-title"
        >
          <div className="dashboard-welcome-copy onboarding-welcome-copy">
            <p className="dashboard-kicker">Profile setup</p>

            <h1 id="interests-title" className="dashboard-title">
              <span aria-hidden="true">{avatarIcon}</span>
              <span>
                {simpleView
                  ? "What sounds good?"
                  : "What would you enjoy trying?"}
              </span>
            </h1>

            <p className="dashboard-lead">
              {simpleView
                ? "Choose one or more cards. This does not lock you in."
                : "Choose the areas that interest you. This does not lock you into anything — it just helps us understand what might feel enjoyable, realistic and encouraging."}
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
                💚
              </span>
              <div>
                <h2>Step 2 of 5</h2>
                <p>40% complete</p>
              </div>
            </div>

            <div className="progress-wrap dashboard-progress-wrap">
              <div className="progress-meta">
                <span>Step 2 of 5</span>
                <span>40% complete</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span className="progress-fill" style={{ width: "40%" }} />
              </div>
            </div>

            {!simpleView ? (
              <p className="dashboard-progress-note">
                Selected interests: <strong>{selectedCount}</strong>
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

        <form action={saveVolunteerInterests} className="onboarding-form">
          <section
            className="onboarding-choice-section"
            aria-labelledby="choose-interests-title"
          >
            <p id="choose-interests-title" className="section-label">
              ✨{" "}
              {simpleView
                ? "Pick your interests"
                : "Choose one or more interests"}
            </p>

            <div className="onboarding-choice-grid">
              {interestChoices.map((choice) => (
                <label key={choice.value} className="onboarding-choice-card">
                  <input
                    type="checkbox"
                    name="interests"
                    value={choice.value}
                    defaultChecked={selectedInterests.has(choice.value)}
                  />

                  <span className="onboarding-choice-icon" aria-hidden="true">
                    {choice.icon}
                  </span>

                  <span className="onboarding-choice-copy">
                    <span className="onboarding-choice-title">
                      {choice.title}
                    </span>
                    {!simpleView ? (
                      <span className="onboarding-choice-description">
                        {choice.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="onboarding-actions">
            <Link href="/profile" className="secondary-button">
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>{simpleView ? "Cancel" : "Cancel and return to profile"}</span>
              </span>
            </Link>

            <button type="submit" className="primary-button">
              <span className="button-balanced-inner">
                <span aria-hidden="true">⭐</span>
                <span>{simpleView ? "Continue" : "Continue to skills"}</span>
              </span>
            </button>
          </div>
        </form>
      </section>

      <style>{`
        .volunteer-interests-page,
        .volunteer-interests-page * {
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
          display: grid;
          gap: 14px;
        }

        .section-label {
          margin: 0;
          color: #4d5566;
          font-weight: 900;
          letter-spacing: 0.01em;
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

        .preference-view-detailed .onboarding-choice-card {
          min-height: 178px;
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .dashboard-progress-note,
        .preference-text-large .onboarding-choice-description,
        .preference-text-large .section-label {
          font-size: 1.04em;
        }

        .preference-theme-calm_green {
          background:
            radial-gradient(circle at top left, rgba(200, 243, 221, 0.58), transparent 34%),
            linear-gradient(135deg, #f3fff8 0%, #f7fbf5 46%, #fffaf2 100%);
        }

        .preference-theme-calm_green .dashboard-welcome-card,
        .preference-theme-calm_green .dashboard-progress-card,
        .preference-theme-calm_green .onboarding-choice-card {
          border-color: rgba(83, 111, 99, 0.2);
        }

        .preference-theme-calm_green .dashboard-progress-icon,
        .preference-theme-calm_green .onboarding-choice-icon {
          background: rgba(226, 255, 239, 0.86);
        }

        .preference-theme-soft_blue {
          background:
            radial-gradient(circle at top left, rgba(197, 226, 255, 0.62), transparent 34%),
            linear-gradient(135deg, #f3f9ff 0%, #f8fbff 48%, #fffaf2 100%);
        }

        .preference-theme-soft_blue .dashboard-welcome-card,
        .preference-theme-soft_blue .dashboard-progress-card,
        .preference-theme-soft_blue .onboarding-choice-card {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .preference-theme-soft_blue .dashboard-progress-icon,
        .preference-theme-soft_blue .onboarding-choice-icon {
          background: rgba(231, 244, 255, 0.92);
        }

        .preference-theme-warm_peach {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.58), transparent 34%),
            linear-gradient(135deg, #fff8f1 0%, #fffaf6 48%, #f7fff8 100%);
        }

        .preference-theme-warm_peach .dashboard-welcome-card,
        .preference-theme-warm_peach .dashboard-progress-card,
        .preference-theme-warm_peach .onboarding-choice-card {
          border-color: rgba(190, 118, 76, 0.2);
        }

        .preference-theme-warm_peach .dashboard-progress-icon,
        .preference-theme-warm_peach .onboarding-choice-icon {
          background: rgba(255, 239, 226, 0.92);
        }

        .preference-theme-high_contrast {
          background: #f8fafc;
        }

        .preference-theme-high_contrast .dashboard-welcome-card,
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .onboarding-choice-card {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .onboarding-choice-title {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .progress-meta,
        .preference-theme-high_contrast .section-label,
        .preference-theme-high_contrast .onboarding-choice-description {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-progress-icon,
        .preference-theme-high_contrast .onboarding-choice-icon {
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
        .preference-theme-neon_arcade .onboarding-choice-card {
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
        .preference-theme-neon_arcade .progress-meta {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .section-label,
        .preference-theme-neon_arcade .onboarding-choice-description {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .onboarding-choice-icon {
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
          .preference-view-simple .onboarding-choice-grid {
            grid-template-columns: 1fr;
          }

          .onboarding-choice-card,
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
