import Link from "next/link";
import { redirect } from "next/navigation";
import { updateOpportunity } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  email: string | null;
  user_type: string | null;
};

type OrganisationProfile = {
  organisation_name: string | null;
  contact_email: string | null;
  support_offered: string[] | null;
  profile_completed: boolean | null;
};

type Opportunity = {
  id: string;
  title: string;
  summary: string;
  location_type: string;
  location: string | null;
  time_commitment: string | null;
  interests: string[] | null;
  skills: string[] | null;
  support_offered: string[] | null;
  contact_name: string | null;
  contact_email: string | null;
  safety_notes: string | null;
  status: string;
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

function isChecked(savedValues: string[] | null | undefined, value: string) {
  return Array.isArray(savedValues) && savedValues.includes(value);
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
  savedValues,
}: {
  name: string;
  options: ChoiceOption[];
  savedValues: string[] | null | undefined;
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <label key={option.value} className="choice-card">
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={isChecked(savedValues, option.value)}
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

export default async function EditOpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const opportunityId = resolvedParams.id;
  const errorMessage = resolvedSearchParams.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email,user_type")
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

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id,title,summary,location_type,location,time_commitment,interests,skills,support_offered,contact_name,contact_email,safety_notes,status",
    )
    .eq("id", opportunityId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<Opportunity>();

  if (!opportunity) {
    redirect("/organisation/opportunities");
  }

  const profileCompleted = organisationProfile?.profile_completed === true;

  const listenText =
    "This is the edit opportunity page. You can update the title, description, location, time commitment, interests, skills, support, contact details, safety notes and status. Use Skills reviews to add positive skills feedback for volunteers who registered interest in this role. Save changes returns you to the opportunities list.";

  return (
    <main className="onboarding-shell opportunity-edit-page">
      <section className="onboarding-panel">
        <div className="onboarding-top-row">
          <div>
            <p className="brand-eyebrow">Opportunity editor</p>
          </div>

          <div className="dashboard-topbar-actions opportunity-editor-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href={`/organisation/opportunities/${opportunity.id}/reviews`}
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">⭐</span>
                <span>Skills reviews</span>
              </span>
            </Link>

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
                📝
              </span>

              <div>
                <h1 className="onboarding-title">Edit volunteering role</h1>
                <p className="onboarding-lead">
                  Review the role before volunteers see it. Keep the language
                  clear, supportive and practical.
                </p>

                <div className="opportunity-editor-hero-actions">
                  <Link
                    href={`/organisation/opportunities/${opportunity.id}/reviews`}
                    className="primary-button"
                  >
                    <span className="button-balanced-inner">
                      <span aria-hidden="true">⭐</span>
                      <span>Skills reviews</span>
                    </span>
                  </Link>

                  <Link
                    href="/organisation/opportunities"
                    className="secondary-button"
                  >
                    <span className="button-balanced-inner">
                      <span aria-hidden="true">📣</span>
                      <span>All roles</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Current status</h2>
                <p>
                  {opportunity.status === "published"
                    ? "Published"
                    : opportunity.status === "closed"
                      ? "Closed"
                      : "Draft"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!profileCompleted ? (
          <div className="alert alert-error">
            Complete your organisation profile before publishing. You can still
            save this opportunity as a draft.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={updateOpportunity} className="form-stack">
          <input type="hidden" name="opportunity_id" value={opportunity.id} />

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
              defaultValue={opportunity.title}
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
              defaultValue={opportunity.summary}
              placeholder="Example: Help welcome visitors, offer tea and coffee, and keep the café area calm and friendly."
            />
          </label>

          <div className="dashboard-grid">
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  📍
                </span>
                <span>Location type</span>
              </span>
              <select
                name="location_type"
                defaultValue={opportunity.location_type || "in_person"}
              >
                <option value="in_person">In-person</option>
                <option value="remote">Remote / online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>

            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  🗺️
                </span>
                <span>Town, city or area</span>
              </span>
              <input
                name="location"
                type="text"
                defaultValue={opportunity.location || ""}
                placeholder="Example: Aberdeen"
              />
            </label>

            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  🕒
                </span>
                <span>Time commitment</span>
              </span>
              <select
                name="time_commitment"
                defaultValue={opportunity.time_commitment || ""}
              >
                <option value="">Choose one</option>
                <option value="One-off">One-off</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Flexible">Flexible</option>
                <option value="Short shifts to start">
                  Short shifts to start
                </option>
              </select>
            </label>
          </div>

          <fieldset className="choice-group">
            <legend>
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  💚
                </span>
                <span>Interests this role may suit</span>
              </span>
            </legend>
            <ChoiceGrid
              name="interests"
              options={interestOptions}
              savedValues={opportunity.interests}
            />
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
            <ChoiceGrid
              name="skills"
              options={skillOptions}
              savedValues={opportunity.skills}
            />
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
              savedValues={opportunity.support_offered}
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
                defaultValue={
                  opportunity.contact_name ||
                  organisationProfile?.organisation_name ||
                  ""
                }
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
                  opportunity.contact_email ||
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
              defaultValue={opportunity.safety_notes || ""}
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
            <select name="status" defaultValue={opportunity.status || "draft"}>
              <option value="draft">Save as draft</option>
              <option value="published">Publish opportunity</option>
              <option value="closed">Close opportunity</option>
            </select>
          </label>

          <button
            type="submit"
            className="primary-button onboarding-submit-button"
          >
            <span className="button-balanced-inner">
              <span aria-hidden="true">✅</span>
              <span>Save changes</span>
            </span>
          </button>
        </form>
      </section>

      <style>{`
        .opportunity-edit-page,
        .opportunity-edit-page * {
          box-sizing: border-box;
        }

        .opportunity-editor-actions {
          gap: 10px;
        }

        .opportunity-editor-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .opportunity-editor-hero-actions .primary-button,
        .opportunity-editor-hero-actions .secondary-button {
          min-width: 190px;
        }

        @media (max-width: 760px) {
          .opportunity-editor-actions {
            width: 100%;
            justify-content: stretch;
          }

          .opportunity-editor-actions > *,
          .opportunity-editor-actions a,
          .opportunity-editor-actions button {
            width: 100%;
          }

          .opportunity-editor-hero-actions {
            display: grid;
            width: 100%;
          }

          .opportunity-editor-hero-actions .primary-button,
          .opportunity-editor-hero-actions .secondary-button {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>
    </main>
  );
}
