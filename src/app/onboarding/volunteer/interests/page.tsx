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

const interestChoices: InterestChoice[] = [
  {
    value: "Helping people",
    icon: "🤝",
    title: "Helping people",
    description: "Support visitors, neighbours or community members."
  },
  {
    value: "Animals and nature",
    icon: "🌿",
    title: "Animals and nature",
    description: "Outdoor roles, gardens, animals or green spaces."
  },
  {
    value: "Events and activities",
    icon: "🎪",
    title: "Events and activities",
    description: "Help at events, groups, clubs or fundraisers."
  },
  {
    value: "Creative tasks",
    icon: "🎨",
    title: "Creative tasks",
    description: "Music, art, design, photography, writing or making."
  },
  {
    value: "Practical tasks",
    icon: "🧰",
    title: "Practical tasks",
    description: "Set up rooms, sort items, pack things or hands-on help."
  },
  {
    value: "Digital or admin",
    icon: "💻",
    title: "Digital or admin",
    description: "Simple computer, forms, emails or organising tasks."
  },
  {
    value: "Sport and movement",
    icon: "⚽",
    title: "Sport and movement",
    description: "Active roles, coaching support or helping groups move."
  },
  {
    value: "Music and performance",
    icon: "🎵",
    title: "Music and performance",
    description: "Music, drama, performance, sound or creative events."
  },
  {
    value: "Learning and mentoring",
    icon: "📚",
    title: "Learning and mentoring",
    description: "Support learning, reading, confidence or skills."
  },
  {
    value: "Food and hospitality",
    icon: "☕",
    title: "Food and hospitality",
    description: "Welcome people, serve refreshments or help with meals."
  },
  {
    value: "Community projects",
    icon: "🏘️",
    title: "Community projects",
    description: "Local groups, neighbourhood projects or community support."
  },
  {
    value: "Open to ideas",
    icon: "🌈",
    title: "Open to ideas",
    description: "You are not sure yet and would like to explore options."
  }
];

export default async function VolunteerInterestsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";

  const supabase = await createClient();

  const {
    data: { user }
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

  const selectedInterests = new Set(volunteerProfile?.interests ?? []);

  const listenText =
    "You are on step two of your volunteer profile setup. This page asks what you might enjoy trying. If you opened this page by mistake, use the Dashboard button at the top or the Cancel and return to profile button near the bottom. First, choose one or more interest cards. You can choose as many as feel right. This does not lock you into anything. It just helps the app understand what might feel enjoyable, realistic and encouraging. If you are not sure, choose Open to ideas. Press Continue to skills when you are ready.";

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
          className="dashboard-welcome-card onboarding-welcome-card"
          aria-labelledby="interests-title"
        >
          <div className="dashboard-welcome-copy onboarding-welcome-copy">
            <p className="dashboard-kicker">Profile setup</p>

            <h1 id="interests-title" className="dashboard-title">
              <span aria-hidden="true">💚</span>
              <span>What would you enjoy trying?</span>
            </h1>

            <p className="dashboard-lead">
              Choose the areas that interest you. This does not lock you into
              anything — it just helps us understand what might feel enjoyable,
              realistic and encouraging.
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
                ✨
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
              ✨ Choose one or more interests
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
                    <span className="onboarding-choice-description">
                      {choice.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="onboarding-actions">
            <Link href="/profile" className="secondary-button">
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Cancel and return to profile</span>
              </span>
            </Link>

            <button type="submit" className="primary-button">
              <span className="button-balanced-inner">
                <span aria-hidden="true">⭐</span>
                <span>Continue to skills</span>
              </span>
            </button>
          </div>
        </form>
      </section>

      <style>{`
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

        @media (max-width: 900px) {
          .onboarding-choice-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .onboarding-choice-grid {
            grid-template-columns: 1fr;
          }

          .onboarding-choice-card {
            min-height: 0;
            grid-template-columns: 1fr;
          }

          .onboarding-choice-icon {
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
        }
      `}</style>
    </main>
  );
}
