import Link from "next/link";
import { redirect } from "next/navigation";
import { createOpportunity } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  full_name: string | null;
  email: string | null;
  user_type: string | null;
};

type OrganisationProfile = {
  organisation_name: string | null;
  contact_email: string | null;
  support_offered: string[] | null;
  profile_completed: boolean | null;
};

type ChoiceOption = {
  value: string;
  label: string;
  icon: string;
  helpText: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

const interestOptions: ChoiceOption[] = [
  {
    value: "Helping people",
    label: "Helping people",
    icon: "🤝",
    helpText: "Welcoming, supporting or helping community members.",
  },
  {
    value: "Animals and nature",
    label: "Animals and nature",
    icon: "🌿",
    helpText: "Gardens, green spaces, animals or outdoor roles.",
  },
  {
    value: "Events and activities",
    label: "Events and activities",
    icon: "🎪",
    helpText: "Events, groups, clubs, fundraisers or activities.",
  },
  {
    value: "Creative tasks",
    label: "Creative tasks",
    icon: "🎨",
    helpText: "Music, art, design, photography, writing or making.",
  },
  {
    value: "Practical tasks",
    label: "Practical tasks",
    icon: "🧰",
    helpText: "Set up, sort items, pack things or hands-on help.",
  },
  {
    value: "Digital or admin",
    label: "Digital or admin",
    icon: "💻",
    helpText: "Simple forms, emails, organising or computer tasks.",
  },
  {
    value: "Food and hospitality",
    label: "Food and hospitality",
    icon: "☕",
    helpText: "Refreshments, café support, kitchen help or hosting.",
  },
  {
    value: "Sport and wellbeing",
    label: "Sport and wellbeing",
    icon: "⚽",
    helpText: "Active roles, walking groups or wellbeing activities.",
  },
  {
    value: "Shops and donations",
    label: "Shops and donations",
    icon: "🛍️",
    helpText: "Shop support, stock sorting, donations or customers.",
  },
  {
    value: "Open to ideas",
    label: "Open to ideas",
    icon: "🌈",
    helpText: "Good for volunteers exploring what suits them.",
  },
];

const skillOptions: ChoiceOption[] = [
  {
    value: "Being friendly and welcoming",
    label: "Friendly and welcoming",
    icon: "😊",
    helpText: "Helping people feel comfortable and included.",
  },
  {
    value: "Listening to people",
    label: "Listening",
    icon: "👂",
    helpText: "Giving people time, patience and attention.",
  },
  {
    value: "Following instructions",
    label: "Following instructions",
    icon: "✅",
    helpText: "Working through clear steps safely and carefully.",
  },
  {
    value: "Teamwork",
    label: "Teamwork",
    icon: "👥",
    helpText: "Working with others towards a shared goal.",
  },
  {
    value: "Organising things",
    label: "Organising things",
    icon: "🗂️",
    helpText: "Sorting, planning, arranging or keeping tasks on track.",
  },
  {
    value: "Using a phone or computer",
    label: "Phone or computer",
    icon: "📱",
    helpText: "Using messages, forms or simple digital tools.",
  },
  {
    value: "Practical hands-on help",
    label: "Hands-on help",
    icon: "🛠️",
    helpText: "Moving, carrying, preparing, tidying or setting up.",
  },
  {
    value: "Problem solving",
    label: "Problem solving",
    icon: "🧩",
    helpText: "Finding practical ways to help when things change.",
  },
  {
    value: "Staying calm",
    label: "Staying calm",
    icon: "🌤️",
    helpText: "Taking things one step at a time.",
  },
  {
    value: "No experience needed",
    label: "No experience needed",
    icon: "🌱",
    helpText: "A gentle role where people can learn as they go.",
  },
];

const supportOptions: ChoiceOption[] = [
  {
    value: "Clear written instructions",
    label: "Clear instructions",
    icon: "📝",
    helpText: "Volunteers know what to expect before starting.",
  },
  {
    value: "Named contact person",
    label: "Named contact",
    icon: "👋",
    helpText: "A clear person volunteers can ask for help.",
  },
  {
    value: "Shorter starter shifts",
    label: "Shorter shifts",
    icon: "🌱",
    helpText: "People can start gently and build confidence.",
  },
  {
    value: "Flexible timings where possible",
    label: "Flexible timings",
    icon: "🕒",
    helpText: "Times can be adjusted where the role allows.",
  },
  {
    value: "Quiet space or calmer option",
    label: "Quiet option",
    icon: "🌙",
    helpText: "A quieter space or lower-pressure task where possible.",
  },
  {
    value: "Check-ins and encouragement",
    label: "Check-ins",
    icon: "💛",
    helpText: "Regular supportive check-ins from the organisation.",
  },
];

function ChoiceGrid({
  name,
  options,
  defaultValues = [],
}: {
  name: string;
  options: ChoiceOption[];
  defaultValues?: string[];
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <label key={option.value} className="choice-card">
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={defaultValues.includes(option.value)}
          />

          <span className="choice-card-icon" aria-hidden="true">
            {option.icon}
          </span>

          <span className="choice-card-copy">
            <span className="choice-card-title">{option.label}</span>
            <small className="choice-help">{option.helpText}</small>
          </span>
        </label>
      ))}
    </div>
  );
}

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);

  if (userType !== "organisation") {
    redirect("/dashboard");
  }

  const { data: organisationProfile } = await supabase
    .from("organisation_profiles")
    .select("organisation_name,contact_email,support_offered,profile_completed")
    .eq("user_id", user.id)
    .maybeSingle<OrganisationProfile>();

  const profileCompleted = organisationProfile?.profile_completed === true;

  const listenText =
    "This is the create opportunity page. Add a clear title, plain language description, location type, detailed location information, time commitment, interests, skills, support available, contact details, safety notes and status. For safety, you can choose to hide the exact venue or postcode until a volunteer has been contacted or accepted. You can save as draft or publish if your organisation profile is complete.";

  return (
    <main className="onboarding-shell">
      <section className="onboarding-panel">
        <div className="onboarding-top-row">
          <div>
            <p className="brand-eyebrow">Opportunity setup</p>
          </div>

          <div className="dashboard-topbar-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href="/organisation/opportunities"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Opportunities</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="onboarding-hero-grid">
          <div className="onboarding-hero-main">
            <div className="onboarding-title-lockup">
              <span className="onboarding-title-icon" aria-hidden="true">
                📣
              </span>

              <div>
                <h1 className="onboarding-title">Create a volunteering role</h1>
                <p className="onboarding-lead">
                  Keep the role clear, supportive and realistic. Volunteers
                  should understand what they will do, where it happens, when it
                  happens, and what help is available before they apply.
                </p>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Publishing status</h2>
                <p>
                  {profileCompleted
                    ? "You can save drafts or publish roles."
                    : "Complete organisation profile before publishing."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={createOpportunity} className="form-stack">
          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                📣
              </span>
              <span>Opportunity title</span>
            </span>
            <input
              name="title"
              type="text"
              required
              placeholder="Example: Community café welcome volunteer"
            />
          </label>

          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                💬
              </span>
              <span>Short plain-language description</span>
            </span>
            <textarea
              name="summary"
              rows={5}
              required
              placeholder="Example: Help welcome visitors, offer tea and coffee, and keep the café area calm and friendly."
            />
          </label>

          <section className="location-details-panel" aria-labelledby="location-details-title">
            <div className="location-details-heading">
              <span className="location-details-icon" aria-hidden="true">
                📍
              </span>
              <div>
                <p className="brand-eyebrow">Location details</p>
                <h2 id="location-details-title">Help volunteers decide if the role is realistic</h2>
                <p>
                  Add enough location information to help people plan safely. You
                  can hide the exact venue or postcode from the public page until
                  you have contacted or accepted a volunteer.
                </p>
              </div>
            </div>

            <div className="dashboard-grid">
              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    📍
                  </span>
                  <span>Location type</span>
                </span>
                <select name="location_type" defaultValue="in_person">
                  <option value="in_person">In-person</option>
                  <option value="remote">Remote / online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🏙️
                  </span>
                  <span>Town or city</span>
                </span>
                <input
                  name="location_town_city"
                  type="text"
                  placeholder="Example: Aberdeen"
                />
              </label>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🗺️
                  </span>
                  <span>Area or neighbourhood optional</span>
                </span>
                <input
                  name="location_area"
                  type="text"
                  placeholder="Example: City centre, Torry, Rosemount"
                />
              </label>
            </div>

            <div className="dashboard-grid">
              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🏢
                  </span>
                  <span>Venue or meeting place optional</span>
                </span>
                <input
                  name="location_venue"
                  type="text"
                  placeholder="Example: Community hub reception"
                />
              </label>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    📮
                  </span>
                  <span>Postcode optional</span>
                </span>
                <input
                  name="location_postcode"
                  type="text"
                  placeholder="Example: AB10"
                />
              </label>

              <label className="field-label legacy-location-field">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🗺️
                  </span>
                  <span>Public location summary fallback</span>
                </span>
                <input
                  name="location"
                  type="text"
                  placeholder="Example: Aberdeen city centre"
                />
              </label>
            </div>

            <label className="field-label privacy-check-row">
              <input name="hide_exact_location" type="checkbox" />
              <span>
                Hide exact venue and postcode from the public page until the
                volunteer has been contacted or accepted.
              </span>
            </label>

            <div className="dashboard-grid">
              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🚌
                  </span>
                  <span>Travel notes optional</span>
                </span>
                <textarea
                  name="travel_notes"
                  rows={4}
                  placeholder="Example: Close to bus routes. Parking nearby. Volunteers can ask for help planning the first visit."
                />
              </label>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    ♿
                  </span>
                  <span>Accessibility or building notes optional</span>
                </span>
                <textarea
                  name="accessibility_notes"
                  rows={4}
                  placeholder="Example: Step-free entrance, quiet waiting area, accessible toilet, lift access, or any barriers volunteers should know about."
                />
              </label>
            </div>
          </section>

          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                🕒
              </span>
              <span>Time commitment</span>
            </span>
            <select name="time_commitment" defaultValue="">
              <option value="">Choose one</option>
              <option value="One-off">One-off</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Flexible">Flexible</option>
              <option value="Short shifts to start">Short shifts to start</option>
            </select>
          </label>

          <fieldset className="choice-group">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  💚
                </span>
                <span>Interests this role may suit</span>
              </span>
            </legend>
            <ChoiceGrid name="interests" options={interestOptions} />
          </fieldset>

          <fieldset className="choice-group">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  ⭐
                </span>
                <span>Helpful skills or skills volunteers can build</span>
              </span>
            </legend>
            <ChoiceGrid name="skills" options={skillOptions} />
          </fieldset>

          <fieldset className="choice-group">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  💛
                </span>
                <span>Support available for this role</span>
              </span>
            </legend>
            <ChoiceGrid
              name="support_offered"
              options={supportOptions}
              defaultValues={organisationProfile?.support_offered ?? []}
            />
          </fieldset>

          <div className="dashboard-grid">
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  👤
                </span>
                <span>Contact name optional</span>
              </span>
              <input
                name="contact_name"
                type="text"
                defaultValue={organisationProfile?.organisation_name || ""}
                placeholder="Example: Volunteer coordinator"
              />
            </label>

            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  ✉️
                </span>
                <span>Contact email</span>
              </span>
              <input
                name="contact_email"
                type="email"
                required
                defaultValue={
                  organisationProfile?.contact_email ||
                  profile?.email ||
                  user.email ||
                  ""
                }
                placeholder="volunteering@example.org"
              />
            </label>
          </div>

          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                🛡️
              </span>
              <span>Safety or supervision notes optional</span>
            </span>
            <textarea
              name="safety_notes"
              rows={5}
              placeholder="Optional. Example: Volunteers will be welcomed by a named contact, shown the space, and told who to speak to if they need help."
            />
          </label>

          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                📝
              </span>
              <span>Status</span>
            </span>
            <select name="status" defaultValue="draft">
              <option value="draft">Save as draft</option>
              <option value="published">Publish opportunity</option>
            </select>
          </label>

          <button
            type="submit"
            className="primary-button onboarding-submit-button"
          >
            <span className="button-balanced-inner">
              <span aria-hidden="true">✅</span>
              <span>Save opportunity</span>
            </span>
          </button>
        </form>
      </section>

      <style>{`
        .location-details-panel {
          display: grid;
          gap: 18px;
          padding: clamp(18px, 4vw, 24px);
          border: 1px solid rgba(143, 178, 158, 0.22);
          border-radius: 28px;
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.72), rgba(255, 255, 255, 0.86)),
            rgba(255, 255, 255, 0.82);
          box-shadow: 0 18px 48px rgba(33, 56, 48, 0.07);
        }

        .location-details-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .location-details-icon {
          display: inline-flex;
          width: 58px;
          height: 58px;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.8rem;
        }

        .location-details-heading h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.25rem, 3vw, 1.65rem);
          letter-spacing: -0.035em;
          line-height: 1.12;
        }

        .location-details-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.5;
        }

        .legacy-location-field {
          border-style: dashed;
        }

        .privacy-check-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          padding: 14px 16px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
          color: #4d5566;
          font-weight: 850;
          line-height: 1.45;
        }

        .privacy-check-row input {
          width: 22px;
          height: 22px;
          margin-top: 2px;
          accent-color: #536f63;
        }

        @media (max-width: 640px) {
          .location-details-heading {
            grid-template-columns: 1fr;
          }

          .location-details-panel {
            border-radius: 24px;
          }

          .location-details-icon {
            width: 54px;
            height: 54px;
          }

          .privacy-check-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
