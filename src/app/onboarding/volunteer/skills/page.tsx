import Link from "next/link";
import { redirect } from "next/navigation";
import { saveVolunteerSkills } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import {
  OnboardingProgress,
  ChoiceCards,
  OptionalTextarea
} from "@/components/InclusiveForm";

const skillOptions = [
  {
    value: "Being friendly and welcoming",
    label: "Being friendly and welcoming",
    icon: "😊",
    helpText: "Help people feel comfortable and included."
  },
  {
    value: "Listening to people",
    label: "Listening to people",
    icon: "👂",
    helpText: "Give people time, patience and attention."
  },
  {
    value: "Following instructions",
    label: "Following instructions",
    icon: "✅",
    helpText: "Work through clear steps safely and carefully."
  },
  {
    value: "Teamwork",
    label: "Teamwork",
    icon: "👥",
    helpText: "Work with other people towards a shared goal."
  },
  {
    value: "Organising things",
    label: "Organising things",
    icon: "🗂️",
    helpText: "Sort, plan, tidy, arrange or keep things on track."
  },
  {
    value: "Using a phone or computer",
    label: "Using a phone or computer",
    icon: "📱",
    helpText: "Use messages, online forms or simple digital tools."
  },
  {
    value: "Practical hands-on help",
    label: "Practical hands-on help",
    icon: "🛠️",
    helpText: "Move, carry, prepare, tidy or set things up."
  },
  {
    value: "Problem solving",
    label: "Problem solving",
    icon: "🧩",
    helpText: "Find practical ways to help when something changes."
  },
  {
    value: "Staying calm",
    label: "Staying calm",
    icon: "🌤️",
    helpText: "Take things one step at a time."
  },
  {
    value: "I am still finding my skills",
    label: "I am still finding my skills",
    icon: "🌱",
    helpText: "That is completely fine. Volunteering can help."
  }
];

export default async function VolunteerSkillsPage({
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

  const listenText =
    "This is step three of your volunteer profile setup. This page is called Skills. If you opened this page by mistake, use the Dashboard button at the top or the Cancel and return to profile button near the bottom. Choose skills you already have or would like to build. You can choose more than one large card. You do not need to type anything unless you want to. Near the bottom there is an optional box where you can add anything else in your own words. The final button says Save and continue.";

  return (
    <main className="onboarding-shell">
      <section className="onboarding-panel">
        <div className="onboarding-top-row">
          <div>
            <p className="brand-eyebrow">Profile setup</p>
          </div>

          <div className="onboarding-top-actions">
            <InclusiveAudioButton text={listenText} />

            <Link href="/dashboard" className="secondary-button onboarding-back-button">
              <span className="button-balanced-inner">
                <span aria-hidden="true">←</span>
                <span>Dashboard</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="onboarding-hero-grid">
          <div className="onboarding-hero-main">
            <div className="onboarding-title-lockup">
              <span className="onboarding-title-icon" aria-hidden="true">
                ⭐
              </span>

              <div>
                <h1 className="onboarding-title">
                  What can you do or build?
                </h1>
                <p className="onboarding-lead">
                  Choose skills you already have and skills you would like to
                  grow. It is okay if you are still finding your strengths.
                </p>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card">
            <OnboardingProgress step={3} total={5} />
          </div>
        </div>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerSkills} className="form-stack">
          <fieldset className="choice-group">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  ⭐
                </span>
                <span>Choose one or more skills</span>
              </span>
            </legend>

            <ChoiceCards name="skills" options={skillOptions} />
          </fieldset>

          <OptionalTextarea
            name="bio"
            label="Optional: tell us anything else in your own words"
            placeholder="You can leave this blank. Example: I like practical tasks, I want to build confidence, or I prefer learning one step at a time."
          />

          <div className="onboarding-form-actions">
            <Link href="/profile" className="secondary-button onboarding-cancel-button">
              <span className="button-balanced-inner">
                <span aria-hidden="true">←</span>
                <span>Cancel and return to profile</span>
              </span>
            </Link>

            <button
              type="submit"
              className="primary-button onboarding-submit-button"
            >
              <span className="button-balanced-inner">
                <span aria-hidden="true">➡️</span>
                <span>Save and continue</span>
              </span>
            </button>
          </div>
        </form>
      </section>

      <style>{`
        .onboarding-top-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: flex-end;
        }

        .onboarding-back-button,
        .onboarding-cancel-button {
          min-height: 44px;
          text-decoration: none;
        }

        .onboarding-form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
          padding-top: 4px;
        }

        .onboarding-form-actions .primary-button,
        .onboarding-form-actions .secondary-button {
          width: fit-content;
        }

        @media (max-width: 640px) {
          .onboarding-top-actions {
            width: 100%;
            justify-content: stretch;
          }

          .onboarding-top-actions .secondary-button,
          .onboarding-top-actions button {
            width: 100%;
          }

          .onboarding-form-actions {
            align-items: stretch;
            flex-direction: column-reverse;
          }

          .onboarding-form-actions .primary-button,
          .onboarding-form-actions .secondary-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
