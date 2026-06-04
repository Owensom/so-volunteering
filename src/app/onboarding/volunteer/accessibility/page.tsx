import Link from "next/link";
import { redirect } from "next/navigation";
import { saveVolunteerAccessibility } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
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
  {
    value: "Clear written instructions before I start",
    label: "Clear written instructions",
    icon: "📝",
    helpText: "Know what to expect before you begin."
  },
  {
    value: "Someone to meet me when I arrive",
    label: "Someone to meet me",
    icon: "👋",
    helpText: "Have a named person welcome you."
  },
  {
    value: "A quieter environment where possible",
    label: "Quieter environment",
    icon: "🌙",
    helpText: "Reduce noise and busy spaces where possible."
  },
  {
    value: "Flexible timings",
    label: "Flexible timings",
    icon: "🕒",
    helpText: "Adjust times where the role allows."
  },
  {
    value: "Shorter shifts to begin with",
    label: "Shorter shifts",
    icon: "🌱",
    helpText: "Start small and build up gradually."
  },
  {
    value: "Regular check-ins from a named person",
    label: "Regular check-ins",
    icon: "🤲",
    helpText: "Have someone check how things are going."
  },
  {
    value: "Help with transport information",
    label: "Transport information",
    icon: "🚌",
    helpText: "Get help understanding how to get there."
  },
  {
    value: "Extra time to learn new tasks",
    label: "Extra time to learn",
    icon: "🧭",
    helpText: "Learn tasks at a steady pace."
  },
  {
    value: "Prefer practical tasks rather than lots of talking",
    label: "Practical tasks",
    icon: "🧰",
    helpText: "Do hands-on tasks rather than lots of talking."
  },
  {
    value: "I am not sure yet",
    label: "I am not sure yet",
    icon: "🌈",
    helpText: "That is okay. You can update this later."
  }
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
      icon: "♿",
      helpText: need.description ?? undefined
    })) ?? [];

  const listenText =
    "This is step four of your volunteer profile setup. This page is called Accessibility and support. If you opened this page by mistake, use the Dashboard button at the top or the Cancel and return to profile button near the bottom. Choose any accessibility or support options that would help make volunteering feel safer, easier or more welcoming. You do not need to type anything unless you want to. You can choose whether organisations can see this information. The final button says Save and continue.";

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
                💛
              </span>

              <div>
                <h1 className="onboarding-title">What support helps you?</h1>
                <p className="onboarding-lead">
                  Choose anything that would make volunteering feel safer,
                  easier or more welcoming. You are in control of what is shared.
                </p>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card">
            <OnboardingProgress step={4} total={5} />
          </div>
        </div>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerAccessibility} className="form-stack">
          {accessibilityOptions.length ? (
            <fieldset className="choice-group">
              <legend>
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    ♿
                  </span>
                  <span>Accessibility needs</span>
                </span>
              </legend>

              <ChoiceCards
                name="accessibility_needs"
                options={accessibilityOptions}
              />
            </fieldset>
          ) : null}

          <fieldset className="choice-group">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  🤲
                </span>
                <span>Things that may help me</span>
              </span>
            </legend>

            <ChoiceCards name="support_options" options={supportOptions} />
          </fieldset>

          <OptionalTextarea
            name="support_needs"
            label="Optional: add anything else in your own words"
            placeholder="You can leave this blank. Example: I prefer quieter environments, clear instructions, flexible timings, or support with transport."
          />

          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                👁️
              </span>
              <span>Would you like organisations to see this information?</span>
            </span>
            <select name="share_accessibility_needs" defaultValue="false">
              <option value="false">No, keep it private for now</option>
              <option value="true">Yes, share it with organisations</option>
            </select>
          </label>

          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                🔔
              </span>
              <span>Would you like optional wellbeing support reminders?</span>
            </span>
            <select name="wants_wellbeing_support" defaultValue="false">
              <option value="false">No, not right now</option>
              <option value="true">Yes, that would be helpful</option>
            </select>
          </label>

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
