import { redirect } from "next/navigation";
import { saveVolunteerInterests } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { OnboardingProgress, ChoiceCards } from "@/components/InclusiveForm";

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
    helpText: "Outdoor roles, gardens, animals or green spaces."
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

  const listenText =
    "This is step two of your volunteer profile setup. This page is called Interests. At the top there is Listen support and your setup progress. Choose things you enjoy or might like to try. You can choose more than one large card. The final button says Save and continue.";

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
                💚
              </span>

              <div>
                <h1 className="onboarding-title">
                  What would you enjoy trying?
                </h1>
                <p className="onboarding-lead">
                  Choose the areas that interest you. This does not lock you
                  into anything — it just helps us understand what might feel
                  enjoyable, realistic and encouraging.
                </p>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card">
            <OnboardingProgress step={2} total={5} />
          </div>
        </div>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerInterests} className="form-stack">
          <fieldset className="choice-group">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  ✨
                </span>
                <span>Choose one or more interests</span>
              </span>
            </legend>

            <ChoiceCards name="interests" options={interestOptions} />
          </fieldset>

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
