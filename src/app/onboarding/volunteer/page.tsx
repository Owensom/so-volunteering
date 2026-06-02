import { redirect } from "next/navigation";
import { saveVolunteerOnboarding } from "./actions";
import { createClient } from "@/lib/supabase/server";

const goalOptions = [
  "Support my community",
  "Gain experience",
  "Build skills",
  "Improve confidence",
  "Meet new people",
  "Progress towards employment",
  "Progress towards education or training"
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

  return (
    <main className="center-shell">
      <section className="auth-card">
        <p className="brand-eyebrow">Volunteer onboarding</p>
        <h1 className="page-title">What would you like to achieve?</h1>
        <p className="page-lead">
          This helps SO Volunteering recommend opportunities that feel meaningful,
          supportive and useful for your next step.
        </p>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerOnboarding} className="form-stack">
          <label className="field-label">
            Your nearest town or city
            <input
              name="city"
              type="text"
              placeholder="Example: Aberdeen"
              required
            />
          </label>

          <fieldset className="choice-group">
            <legend>Choose one or more goals</legend>
            {goalOptions.map((goal) => (
              <label key={goal} className="choice-card">
                <input type="checkbox" name="goals" value={goal} />
                <span>{goal}</span>
              </label>
            ))}
          </fieldset>

          <label className="field-label">
            How would you prefer to volunteer?
            <select name="volunteering_preference" defaultValue="both">
              <option value="both">Both in-person and remote</option>
              <option value="in_person">In-person</option>
              <option value="remote">Remote / digital</option>
            </select>
          </label>

          <button type="submit" className="primary-button">
            Save and continue
          </button>
        </form>
      </section>
    </main>
  );
}
