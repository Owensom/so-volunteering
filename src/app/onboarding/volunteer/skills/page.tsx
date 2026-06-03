import { redirect } from "next/navigation";
import { saveVolunteerSkills } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import {
  OnboardingProgress,
  ChoiceCards,
  OptionalTextarea
} from "@/components/InclusiveForm";

const interestOptions = [
  {
    value: "Helping people",
    label: "Helping people",
    icon: "🤝",
    helpText: "Support visitors, neighbours or community members."
  },
  {
    value: "Animals and nature",
    label: "Animals and nature",
    icon: "🌿",
    helpText: "Outdoor roles, gardens, animals or local green spaces."
  },
  {
    value: "Events and activities",
    label: "Events and activities",
    icon: "🎪",
    helpText: "Help at events, groups, clubs or fundraisers."
  },
  {
    value: "Creative tasks",
    label: "Creative tasks",
    icon: "🎨",
    helpText: "Music, art, design, photography, writing or making."
  },
  {
    value: "Practical tasks",
    label: "Practical tasks",
    icon: "🧰",
    helpText: "Set up rooms, sort items, pack things or hands-on help."
  },
  {
    value: "Digital or admin",
    label: "Digital or admin",
    icon: "💻",
    helpText: "Simple computer, forms, emails or organising tasks."
  },
  {
    value: "Food and hospitality",
    label: "Food and hospitality",
    icon: "☕",
    helpText: "Refreshments, welcoming, kitchen support or café roles."
  },
  {
    value: "Sport and wellbeing",
    label: "Sport and wellbeing",
    icon: "⚽",
    helpText: "Active roles, walking groups or wellbeing activities."
  },
  {
    value: "Shops and donations",
    label: "Shops and donations",
    icon: "🛍️",
    helpText: "Sort stock, welcome customers or help with donations."
  },
  {
    value: "I am open to ideas",
    label: "I am open to ideas",
    icon: "🌈",
    helpText: "That is okay. You can explore what feels right."
  }
];

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
    "This is step two of your volunteer profile setup. This page is called Skills and interests. At the top there is Listen support and your setup progress. First, choose things you enjoy or might like to try. Then choose skills you already have or would like to build. You can choose more than one card in each section. You do not need to type anything unless you want to. Near the bottom there is an optional box where you can add anything else in your own words. The final button says Save and continue.";

  return (
    <main className="onboarding-shell">
      <section className="onboarding-panel">
        <div className="onboarding-top-row">
          <div>
            <p className="brand-eyebrow">Profile setup</p>
          </div>

          <InclusiveAudioButton text={listenText} />
        </div>

        <div className="onboarding-hero-grid">
          <div className="onboarding-hero-main">
            <div className="onboarding-title-lockup">
              <span className="onboarding-title-icon" aria-hidden="true">
                🧩
              </span>

              <div>
                <h1 className="onboarding-title">Skills & interests</h1>
                <p className="onboarding-lead">
                  Choose what you enjoy, what you can already do, and what you
                  might like to build. This helps us suggest opportunities that
                  feel realistic, useful and encouraging.
                </p>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card">
            <OnboardingProgress step={2} total={4} />
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
                  💚
                </span>
                <span>Things I enjoy or might like to try</span>
              </span>
            </legend>

            <ChoiceCards name="interests" options={interestOptions} />
          </fieldset>

          <fieldset className="choice-group">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  ⭐
                </span>
                <span>Skills I have or want to build</span>
              </span>
            </legend>

            <ChoiceCards name="skills" options={skillOptions} />
          </fieldset>

          <OptionalTextarea
            name="bio"
            label="Optional: tell us anything else in your own words"
            placeholder="You can leave this blank. Example: I like working with animals, I prefer practical tasks, or I would like to build confidence talking to people."
          />

          <button type="submit" className="primary-button onboarding-submit-button">
            <span className="button-balanced-inner">
              <span aria-hidden="true">➡️</span>
              <span>Save and continue</span>
            </span>
          </button>
        </form>
      </section>
    </main>
  );
}
