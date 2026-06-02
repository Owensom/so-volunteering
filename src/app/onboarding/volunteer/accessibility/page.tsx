import { redirect } from "next/navigation";
import { saveVolunteerAccessibility } from "./actions";
import { createClient } from "@/lib/supabase/server";
import {
  InclusiveAudioButton,
  IconLabel
} from "@/components/InclusiveSupport";
import {
  OnboardingProgress,
  ChoiceCards,
  OptionalTextarea
} from "@/components/InclusiveForm";

type AccessibilityNeed = {
  id: string;
  name: string;
  description: string | null;
};

const supportOptions = [
  { value: "Clear written instructions before I start", label: "Clear written instructions before I start" },
  { value: "Someone to meet me when I arrive", label: "Someone to meet me when I arrive" },
  { value: "A quieter environment where possible", label: "A quieter environment where possible" },
  { value: "Flexible timings", label: "Flexible timings" },
  { value: "Shorter shifts to begin with", label: "Shorter shifts to begin with" },
  { value: "Regular check-ins from a named person", label: "Regular check-ins from a named person" },
  { value: "Help with transport information", label: "Help with transport information" },
  { value: "Extra time to learn new tasks", label: "Extra time to learn new tasks" },
  { value: "Prefer remote or online opportunities", label: "Prefer remote or online opportunities" },
  { value: "Prefer practical tasks rather than lots of talking", label: "Prefer practical tasks rather than lots of talking" },
  { value: "Prefer social roles where I can meet people", label: "Prefer social roles where I can meet people" },
  { value: "I am not sure yet", label: "I am not sure yet" }
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

  const accessibilityOptions =
    (accessibilityNeeds as AccessibilityNeed[] | null)?.map((need) => ({
      value: need.id,
      label: need.name,
      helpText: need.description ?? undefined
    })) ?? [];

  const listenText =
    "This is step two of your volunteer profile setup. Choose any accessibility or support options that would help you. You do not need to write anything unless you want to. You control what is shared with organisations.";

  return (
    <main className="center-shell">
      <section className="auth-card">
        <div className="page-top-row">
          <p className="brand-eyebrow">Profile setup</p>
          <InclusiveAudioButton text={listenText} />
        </div>

        <h1 className="page-title">
          <IconLabel icon="💛">Accessibility & support</IconLabel>
        </h1>

        <p className="page-lead">
          Choose anything that would help make volunteering feel safer, easier or
          more welcoming. You do not need to write anything unless you want to.
        </p>

        <OnboardingProgress step={2} total={4} />

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerAccessibility} className="form-stack">
          <fieldset className="choice-group">
            <legend>
              <IconLabel icon="♿">Accessibility needs</IconLabel>
            </legend>
            <ChoiceCards name="accessibility_needs" options={accessibilityOptions} />
          </fieldset>

          <fieldset className="choice-group">
            <legend>
              <IconLabel icon="🤲">Things that may help me</IconLabel>
            </legend>
            <ChoiceCards name="support_options" options={supportOptions} />
          </fieldset>

          <OptionalTextarea
            name="support_needs"
            label="Optional: add anything else in your own words"
            placeholder="You can leave this blank. Example: I prefer quieter environments, clear instructions, flexible timings, or support with transport."
          />

          <label className="field-label">
            <IconLabel icon="👁️">Would you like organisations to see this information?</IconLabel>
            <select name="share_accessibility_needs" defaultValue="false">
              <option value="false">No, keep it private for now</option>
              <option value="true">Yes, share it with organisations</option>
            </select>
          </label>

          <label className="field-label">
            <IconLabel icon="🔔">Would you like optional wellbeing support reminders?</IconLabel>
            <select name="wants_wellbeing_support" defaultValue="false">
              <option value="false">No, not right now</option>
              <option value="true">Yes, that would be helpful</option>
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
