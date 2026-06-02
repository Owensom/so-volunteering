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
  { value: "Support my community", label: "Support my community", helpText: "Help people, groups or local causes." },
  { value: "Gain experience", label: "Gain experience", helpText: "Build useful experience for your next step." },
  { value: "Build skills", label: "Build skills", helpText: "Learn or practise skills in a supportive way." },
  { value: "Improve confidence", label: "Improve confidence", helpText: "Start gently and grow over time." },
  { value: "Meet new people", label: "Meet new people", helpText: "Feel more connected to others." },
  { value: "Progress towards employment", label: "Progress towards employment", helpText: "Build evidence for a CV or job application." },
  { value: "Progress towards education or training", label: "Progress towards education or training", helpText: "Support college, training or future learning." }
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
    "This is step one of your volunteer profile setup. Choose what you would like to achieve. You can choose more than one option. You only need to type your nearest town or city.";

  return (
    <main className="center-shell">
      <section className="auth-card">
        <div className="page-top-row">
          <p className="brand-eyebrow">Profile setup</p>
          <InclusiveAudioButton text={listenText} />
        </div>

        <h1 className="page-title">
          <IconLabel icon="🌱">What would you like to achieve?</IconLabel>
        </h1>

        <p className="page-lead">
          Choose what matters to you. This helps us recommend opportunities that
          feel meaningful, supportive and useful.
        </p>

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
