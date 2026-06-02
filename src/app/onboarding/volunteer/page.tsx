import { redirect } from "next/navigation";
import { saveVolunteerOnboarding } from "./actions";
import { createClient } from "@/lib/supabase/server";
import {
  InclusiveAudioButton,
  IconLabel
} from "@/components/InclusiveSupport";
import {
  OnboardingProgress,
  ChoiceCards
} from "@/components/InclusiveForm";

const goalOptions = [
  {
    value: "Support my community",
    label: "Support my community",
    icon: "🤝",
    helpText: "Help local people, groups or causes."
  },
  {
    value: "Gain experience",
    label: "Gain experience",
    icon: "🧭",
    helpText: "Build useful experience for your next step."
  },
  {
    value: "Build skills",
    label: "Build skills",
    icon: "⭐",
    helpText: "Learn and practise in a supportive way."
  },
  {
    value: "Improve confidence",
    label: "Improve confidence",
    icon: "🌱",
    helpText: "Start gently and grow over time."
  },
  {
    value: "Meet new people",
    label: "Meet new people",
    icon: "👋",
    helpText: "Feel more connected to others."
  },
  {
    value: "Progress towards employment",
    label: "Progress towards employment",
    icon: "💼",
    helpText: "Build evidence for a CV or job application."
  },
  {
    value: "Progress towards education or training",
    label: "Progress towards education or training",
    icon: "🎓",
    helpText: "Support college, training or future learning."
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
    "This is step one of your volunteer profile setup. This page asks what you would like to achieve. At the top there is Listen support. First, type your nearest town or city. Then choose one or more goal cards. Each card has a large icon, a short title and a short description. Near the bottom there is a choice for how you prefer to volunteer. The final button says Save and continue.";

  return (
    <main className="center-shell">
      <section className="auth-card onboarding-card">
        <div className="page-top-row onboarding-top-row">
          <p className="brand-eyebrow">Profile setup</p>
          <InclusiveAudioButton text={listenText} />
        </div>

        <div className="onboarding-hero-copy">
          <h1 className="page-title onboarding-title">
            <IconLabel icon="🌱">What would you like to achieve?</IconLabel>
          </h1>

          <p className="page-lead onboarding-lead">
            Choose what matters to you. This helps us suggest volunteering that
            feels meaningful, supportive and useful.
          </p>
        </div>

        <OnboardingProgress step={1} total={4} />

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerOnboarding} className="form-stack">
          <label className="field-label">
            <IconLabel icon="📍">Your nearest town or city</IconLabel>
            <input name="city" type="text" placeholder="Example: Aberdeen" required />
          </label>

          <fieldset className="choice-group">
            <legend>
              <IconLabel icon="✨">Choose one or more goals</IconLabel>
            </legend>
            <ChoiceCards name="goals" options={goalOptions} />
          </fieldset>

          <label className="field-label">
            <IconLabel icon="🧭">How would you prefer to volunteer?</IconLabel>
            <select name="volunteering_preference" defaultValue="both">
              <option value="both">Both in-person and remote</option>
              <option value="in_person">In-person</option>
              <option value="remote">Remote / digital</option>
            </select>
          </label>

          <button type="submit" className="primary-button">
            <IconLabel icon="➡️">Save and continue</IconLabel>
          </button>
        </form>
      </section>
    </main>
  );
}
