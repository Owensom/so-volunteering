import { redirect } from "next/navigation";
import { saveVolunteerOnboarding } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { OnboardingProgress, ChoiceCards } from "@/components/InclusiveForm";

const goalOptions = [
  {
    value: "Support my community",
    label: "Support my community",
    icon: "🤝",
    helpText: "Help local people or causes."
  },
  {
    value: "Gain experience",
    label: "Gain experience",
    icon: "🧭",
    helpText: "Build useful experience."
  },
  {
    value: "Build skills",
    label: "Build skills",
    icon: "⭐",
    helpText: "Learn in a supportive way."
  },
  {
    value: "Improve confidence",
    label: "Improve confidence",
    icon: "🌱",
    helpText: "Start gently and grow."
  },
  {
    value: "Meet new people",
    label: "Meet new people",
    icon: "👋",
    helpText: "Feel more connected."
  },
  {
    value: "Progress towards employment",
    label: "Progress towards employment",
    icon: "💼",
    helpText: "Build CV evidence."
  },
  {
    value: "Education or training",
    label: "Education or training",
    icon: "🎓",
    helpText: "Support future learning."
  }
];

export default async function VolunteerOnboardingPage({
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
    "This is step one of your volunteer profile setup. This page asks what you would like to achieve. At the top there is Listen support. First, type your nearest town or city. Then choose one or more large goal cards. Each card has an icon and a short label. Near the bottom there is a choice for how you prefer to volunteer. The final button says Save and continue.";

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
                🌱
              </span>

              <div>
                <h1 className="onboarding-title">What would you like to achieve?</h1>
                <p className="onboarding-lead">
                  Choose what matters to you. We use this to suggest
                  volunteering that feels meaningful, supportive and useful.
                </p>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card">
            <OnboardingProgress step={1} total={4} />
          </div>
        </div>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerOnboarding} className="form-stack">
          <label className="field-label onboarding-field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                📍
              </span>
              <span>Your nearest town or city</span>
            </span>
            <input name="city" type="text" placeholder="Example: Aberdeen" required />
          </label>

          <fieldset className="choice-group">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  ✨
                </span>
                <span>Choose one or more goals</span>
              </span>
            </legend>

            <ChoiceCards name="goals" options={goalOptions} />
          </fieldset>

          <label className="field-label onboarding-field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                🧭
              </span>
              <span>How would you prefer to volunteer?</span>
            </span>
            <select name="volunteering_preference" defaultValue="both">
              <option value="both">Both in-person and remote</option>
              <option value="in_person">In-person</option>
              <option value="remote">Remote / digital</option>
            </select>
          </label>

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
