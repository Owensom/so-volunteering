import { redirect } from "next/navigation";
import { saveVolunteerAccessibility } from "./actions";
import { createClient } from "@/lib/supabase/server";

type AccessibilityNeed = {
  id: string;
  name: string;
  description: string | null;
};

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
          Tell us what would help make volunteering feel safe, welcoming and
          manageable. You control what is shared.
        </p>

        <div className="progress-track" aria-label="Profile setup progress">
          <span className="progress-fill progress-fill-50" />
        </div>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerAccessibility} className="form-stack">
          <fieldset className="choice-group">
            <legend>Select any accessibility needs that apply</legend>

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

          <label className="field-label">
            Would you like organisations to see these accessibility needs?
            <select name="share_accessibility_needs" defaultValue="false">
              <option value="false">No, keep them private for now</option>
              <option value="true">Yes, share them with organisations</option>
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
