import Link from "next/link";
import { redirect } from "next/navigation";
import { saveVolunteerAvailability } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import {
  OnboardingProgress,
  ChoiceCards,
  OptionalTextarea
} from "@/components/InclusiveForm";

const availabilityOptions = [
  {
    value: "Weekday mornings",
    label: "Weekday mornings",
    icon: "🌅",
    helpText: "Monday to Friday before lunchtime."
  },
  {
    value: "Weekday afternoons",
    label: "Weekday afternoons",
    icon: "🌤️",
    helpText: "Monday to Friday after lunchtime."
  },
  {
    value: "Weekday evenings",
    label: "Weekday evenings",
    icon: "🌙",
    helpText: "After school, college, work or daytime commitments."
  },
  {
    value: "Weekends",
    label: "Weekends",
    icon: "📅",
    helpText: "Saturday or Sunday opportunities."
  },
  {
    value: "One-off opportunities",
    label: "One-off opportunities",
    icon: "🎟️",
    helpText: "Events, short projects or occasional help."
  },
  {
    value: "Regular weekly volunteering",
    label: "Regular weekly volunteering",
    icon: "🔁",
    helpText: "A steady weekly routine."
  },
  {
    value: "Short shifts to start",
    label: "Short shifts to start",
    icon: "🌱",
    helpText: "Start small and build up over time."
  },
  {
    value: "Remote or online",
    label: "Remote or online",
    icon: "💻",
    helpText: "Volunteering from home or online."
  },
  {
    value: "Flexible or varies",
    label: "Flexible or varies",
    icon: "🧭",
    helpText: "Your availability changes from week to week."
  },
  {
    value: "I am not sure yet",
    label: "I am not sure yet",
    icon: "🌈",
    helpText: "That is okay. You can update this later."
  }
];

type VolunteerProfile = {
  preferred_contact_method: string | null;
  phone_number: string | null;
};

function normaliseContactMethod(value: string | null | undefined) {
  if (value === "phone") return "phone";
  if (value === "sms") return "sms";
  return "email";
}

export default async function VolunteerAvailabilityPage({
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

  const { data: volunteerProfile } = await supabase
    .from("volunteer_profiles")
    .select("preferred_contact_method,phone_number")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const preferredContactMethod = normaliseContactMethod(
    volunteerProfile?.preferred_contact_method
  );

  const listenText =
    "This is step five of your volunteer profile setup. This page is called Availability. If you opened this page by mistake, use the Dashboard button at the top or the Cancel and return to profile button near the bottom. Choose when or how often you might like to volunteer. You can choose more than one card. Then choose your preferred contact method. If you choose phone call or text message, add a phone number so an organisation can contact you if you express interest in one of their roles. The final button says Finish setup.";

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
                📅
              </span>

              <div>
                <h1 className="onboarding-title">When might work for you?</h1>
                <p className="onboarding-lead">
                  Choose what feels realistic. You can be flexible, unsure, or
                  start small — this can always be changed later.
                </p>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card">
            <OnboardingProgress step={5} total={5} />
          </div>
        </div>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerAvailability} className="form-stack">
          <fieldset className="choice-group">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  🕒
                </span>
                <span>Choose one or more availability options</span>
              </span>
            </legend>

            <ChoiceCards name="availability" options={availabilityOptions} />
          </fieldset>

          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                💬
              </span>
              <span>Preferred contact method</span>
            </span>
            <select
              name="preferred_contact_method"
              defaultValue={preferredContactMethod}
            >
              <option value="email">Email</option>
              <option value="phone">Phone call</option>
              <option value="sms">Text message</option>
            </select>
          </label>

          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                📱
              </span>
              <span>Phone number</span>
            </span>
            <input
              name="phone_number"
              type="tel"
              defaultValue={volunteerProfile?.phone_number || ""}
              placeholder="Optional unless you choose phone call or text message"
              autoComplete="tel"
            />
            <span className="field-help">
              If you choose phone call or text message, add a number so an
              organisation can contact you after you express interest.
            </span>
          </label>

          <OptionalTextarea
            name="availability_notes"
            label="Optional: add anything else about your availability"
            placeholder="You can leave this blank. Example: I can only do school term time, I need flexible times, or I would like short shifts to begin with."
          />

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
                <span aria-hidden="true">✅</span>
                <span>Finish setup</span>
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
