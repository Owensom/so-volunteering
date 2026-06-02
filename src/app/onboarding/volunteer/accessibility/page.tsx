import { redirect } from "next/navigation";
import { saveVolunteerAccessibility } from "./actions";
import { createClient } from "@/lib/supabase/server";

type AccessibilityNeed = {
  id: string;
  name: string;
  description: string | null;
};

const supportOptions = [
  "Clear written instructions before I start",
  "Someone to meet me when I arrive",
  "A quieter environment where possible",
  "Flexible timings",
  "Shorter shifts to begin with",
  "Regular check-ins from a named person",
  "Help with transport information",
  "Extra time to learn new tasks",
  "Prefer remote or online opportunities",
  "Prefer practical tasks rather than lots of talking",
  "Prefer social roles where I can meet people",
  "I am not sure yet"
];

export default async function VolunteerAccessibilityPage({
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

  const { data: accessibilityNeeds } = await supabase
    .from("accessibility_needs")
    .select("id,name,description")
    .order("name", { ascending: true });

  return (
    <main className="center-shell">
      <section className="auth-card">
        <p className="brand-eyebrow">Profile setup · Step 2 of 4</p>
        <h1 className="page-title">Accessibility & support</h1>
        <p className="page-lead">
          Choose anything that would help make volunteering feel safer, easier or
          more welcoming. You do not need to write anything unless you want to.
        </p>

        <div className="progress-track" aria-label="Profile setup progress">
          <span className="progress-fill progress-fill-50" />
        </div>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerAccessibility} className="form-stack">
          <fieldset className="choice-group">
            <legend>Accessibility needs</legend>

            {(accessibilityNeeds as AccessibilityNeed[] | null)?.map((need) => (
              <label key={need.id} className="choice-card">
                <input
                  type="checkbox"
                  name="accessibility_needs"
                  value={need.id}
                />
                <span>
                  {need.name}
                  {need.description ? (
                    <small className="choice-help">{need.description}</small>
                  ) : null}
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="choice-group">
            <legend>Things that may help me</legend>

            {supportOptions.map((option) => (
              <label key={option} className="choice-card">
                <input type="checkbox" name="support_options" value={option} />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>

          <label className="field-label">
            Optional: add anything else in your own words
            <textarea
              name="support_needs"
              rows={5}
              placeholder="You can leave this blank. Example: I prefer quieter environments, clear instructions, flexible timings, or support with transport."
            />
          </label>

          <label className="field-label">
            Would you like organisations to see this information?
            <select name="share_accessibility_needs" defaultValue="false">
              <option value="false">No, keep it private for now</option>
              <option value="true">Yes, share it with organisations</option>
            </select>
          </label>

          <label className="field-label">
            Would you like optional wellbeing support reminders?
            <select name="wants_wellbeing_support" defaultValue="false">
              <option value="false">No, not right now</option>
              <option value="true">Yes, that would be helpful</option>
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
