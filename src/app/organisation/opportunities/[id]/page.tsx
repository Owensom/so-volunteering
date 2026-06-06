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
  location_town_city: string | null;
  location_area: string | null;
  location_venue: string | null;
  location_postcode: string | null;
  travel_notes: string | null;
  accessibility_notes: string | null;
  hide_exact_location: boolean | null;
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

type ReadinessItem = {
  icon: string;
  title: string;
  text: string;
  status: "ready" | "attention" | "optional";
  label: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function isChecked(savedValues: string[] | null | undefined, value: string) {
  return Array.isArray(savedValues) && savedValues.includes(value);
}

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function hasLongEnoughText(value: string | null | undefined, minimum = 40) {
  return Boolean(value && value.trim().length >= minimum);
}

function hasAny(values: string[] | null | undefined) {
  return Array.isArray(values) && values.length > 0;
}

function getReadinessItems(opportunity: Opportunity): ReadinessItem[] {
  const hasUsefulLocation =
    opportunity.location_type === "remote" ||
    hasText(opportunity.location_town_city) ||
    hasText(opportunity.location_area) ||
    hasText(opportunity.location);

  const hasTravelOrAccess =
    hasText(opportunity.travel_notes) || hasText(opportunity.accessibility_notes);

  const exactLocationConsidered =
    opportunity.hide_exact_location === true ||
    hasText(opportunity.location_venue) ||
    hasText(opportunity.location_postcode) ||
    opportunity.location_type === "remote";

  return [
    {
      icon: "💬",
      title: "Plain-language summary",
      text: hasLongEnoughText(opportunity.summary)
        ? "The role has a useful plain-language summary."
        : "Add a little more detail so volunteers understand what they will do.",
      status: hasLongEnoughText(opportunity.summary) ? "ready" : "attention",
      label: hasLongEnoughText(opportunity.summary) ? "Ready" : "Needs detail",
    },
    {
      icon: "📍",
      title: "Location is realistic",
      text: hasUsefulLocation
        ? "The role has enough location information for volunteers to start deciding."
        : "Add town/city, area or remote details so people can judge if this is realistic.",
      status: hasUsefulLocation ? "ready" : "attention",
      label: hasUsefulLocation ? "Ready" : "Needs detail",
    },
    {
      icon: "🚌",
      title: "Travel and access notes",
      text: hasTravelOrAccess
        ? "Travel or accessibility notes have been added."
        : "Travel and accessibility notes are optional, but very helpful for inclusive roles.",
      status: hasTravelOrAccess ? "ready" : "optional",
      label: hasTravelOrAccess ? "Ready" : "Helpful",
    },
    {
      icon: "🕒",
      title: "Time commitment",
      text: hasText(opportunity.time_commitment)
        ? "The role has a clear time commitment."
        : "Choose a time commitment so volunteers know what to expect.",
      status: hasText(opportunity.time_commitment) ? "ready" : "attention",
      label: hasText(opportunity.time_commitment) ? "Ready" : "Needs detail",
    },
    {
      icon: "💛",
      title: "Support available",
      text: hasAny(opportunity.support_offered)
        ? "Support options are listed for this role."
        : "Select support options such as clear instructions, named contact or check-ins.",
      status: hasAny(opportunity.support_offered) ? "ready" : "attention",
      label: hasAny(opportunity.support_offered) ? "Ready" : "Needs detail",
    },
    {
      icon: "⭐",
      title: "Skills and interests",
      text:
        hasAny(opportunity.interests) && hasAny(opportunity.skills)
          ? "The role has interests and skills for matching."
          : "Add interests and helpful skills so volunteers can understand why it may suit them.",
      status:
        hasAny(opportunity.interests) && hasAny(opportunity.skills)
          ? "ready"
          : "attention",
      label:
        hasAny(opportunity.interests) && hasAny(opportunity.skills)
          ? "Ready"
          : "Needs detail",
    },
    {
      icon: "🛡️",
      title: "Safety and supervision",
      text: hasText(opportunity.safety_notes)
        ? "Safety or supervision notes have been added."
        : "Add who welcomes volunteers, who supervises, and who they can ask for help.",
      status: hasText(opportunity.safety_notes) ? "ready" : "attention",
      label: hasText(opportunity.safety_notes) ? "Ready" : "Needs detail",
    },
    {
      icon: "🔒",
      title: "Exact location privacy",
      text: exactLocationConsidered
        ? "Location privacy has been considered for this role."
        : "Consider whether exact venue or postcode should be hidden until after contact.",
      status: exactLocationConsidered ? "ready" : "optional",
      label: exactLocationConsidered ? "Ready" : "Helpful",
    },
  ];
}

function getReadinessSummary(items: ReadinessItem[]) {
  const attentionCount = items.filter((item) => item.status === "attention").length;
  const readyCount = items.filter((item) => item.status === "ready").length;

  if (attentionCount === 0) {
    return {
      icon: "✅",
      title: "Role display looks ready",
      text: "This role has the key information volunteers need before they decide.",
      readyCount,
      attentionCount,
    };
  }

  return {
    icon: "🌱",
    title: "Role display needs a little more detail",
    text: `${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention before this role will feel fully clear and inclusive.`,
    readyCount,
    attentionCount,
  };
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
      "id,title,summary,location_type,location,location_town_city,location_area,location_venue,location_postcode,travel_notes,accessibility_notes,hide_exact_location,time_commitment,interests,skills,support_offered,contact_name,contact_email,safety_notes,status",
    )
    .eq("id", opportunityId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<Opportunity>();

  if (!opportunity) {
    redirect("/organisation/opportunities");
  }

  const profileCompleted = organisationProfile?.profile_completed === true;
  const readinessItems = getReadinessItems(opportunity);
  const readinessSummary = getReadinessSummary(readinessItems);

  const listenText =
    "This is the edit opportunity page. The role display readiness checklist shows whether the saved role has clear language, useful location details, support, skills, safety and privacy information. You can update the title, description, detailed location information, time commitment, interests, skills, support, contact details, safety notes and status. You can choose to hide the exact venue or postcode from the public page until a volunteer has been contacted or accepted. Use Skills reviews to add positive skills feedback for volunteers who registered interest in this role. Save changes returns you to the opportunities list.";

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
                {readinessSummary.icon}
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

        <section
          className="role-readiness-panel"
          aria-labelledby="role-readiness-title"
        >
          <div className="role-readiness-heading">
            <span className="role-readiness-icon" aria-hidden="true">
              {readinessSummary.icon}
            </span>

            <div>
              <p className="brand-eyebrow">Role display readiness</p>
              <h2 id="role-readiness-title">{readinessSummary.title}</h2>
              <p>{readinessSummary.text}</p>
              <p className="role-readiness-count">
                Ready: <strong>{readinessSummary.readyCount}</strong> · Needs
                attention: <strong>{readinessSummary.attentionCount}</strong>
              </p>
            </div>
          </div>

          <div className="role-readiness-grid">
            {readinessItems.map((item) => (
              <article
                key={item.title}
                className={`role-readiness-card role-readiness-${item.status}`}
              >
                <span className="role-readiness-card-icon" aria-hidden="true">
                  {item.icon}
                </span>

                <div>
                  <p className="role-readiness-pill">{item.label}</p>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

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

          <section
            className="location-details-panel"
            aria-labelledby="location-details-title"
          >
            <div className="location-details-heading">
              <span className="location-details-icon" aria-hidden="true">
                📍
              </span>
              <div>
                <p className="brand-eyebrow">Location details</p>
                <h2 id="location-details-title">
                  Help volunteers decide if the role is realistic
                </h2>
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
                    🏙️
                  </span>
                  <span>Town or city</span>
                </span>
                <input
                  name="location_town_city"
                  type="text"
                  defaultValue={opportunity.location_town_city || ""}
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
                  defaultValue={opportunity.location_area || ""}
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
                  defaultValue={opportunity.location_venue || ""}
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
                  defaultValue={opportunity.location_postcode || ""}
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
                  defaultValue={opportunity.location || ""}
                  placeholder="Example: Aberdeen city centre"
                />
              </label>
            </div>

            <label className="field-label privacy-check-row">
              <input
                name="hide_exact_location"
                type="checkbox"
                defaultChecked={opportunity.hide_exact_location === true}
              />
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
                  defaultValue={opportunity.travel_notes || ""}
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
                  defaultValue={opportunity.accessibility_notes || ""}
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
            <select
              name="time_commitment"
              defaultValue={opportunity.time_commitment || ""}
            >
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

        .role-readiness-panel,
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

        .role-readiness-heading,
        .location-details-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .role-readiness-icon,
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

        .role-readiness-heading h2,
        .location-details-heading h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.25rem, 3vw, 1.65rem);
          letter-spacing: -0.035em;
          line-height: 1.12;
        }

        .role-readiness-heading p,
        .location-details-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.5;
        }

        .role-readiness-count {
          margin-top: 8px !important;
          color: #536f63 !important;
          font-size: 0.94rem;
          font-weight: 900 !important;
        }

        .role-readiness-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .role-readiness-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          min-height: 150px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
        }

        .role-readiness-ready {
          border-color: rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.88);
        }

        .role-readiness-attention {
          border-color: rgba(190, 118, 76, 0.28);
          background: rgba(255, 248, 241, 0.9);
        }

        .role-readiness-optional {
          border-color: rgba(108, 92, 160, 0.16);
          background: rgba(248, 248, 252, 0.9);
        }

        .role-readiness-card-icon {
          display: inline-flex;
          width: 44px;
          height: 44px;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.72);
          font-size: 1.35rem;
        }

        .role-readiness-pill {
          display: inline-flex;
          width: fit-content;
          margin: 0 0 8px !important;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.8);
          color: #536f63;
          font-size: 0.74rem;
          font-weight: 950 !important;
          line-height: 1.1;
        }

        .role-readiness-card h3 {
          margin: 0 0 5px;
          color: #315f48;
          font-size: 0.98rem;
          font-weight: 950;
          line-height: 1.18;
        }

        .role-readiness-card p {
          margin: 0;
          color: #60706a;
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.38;
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

        @media (max-width: 1180px) {
          .role-readiness-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
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

        @media (max-width: 640px) {
          .role-readiness-heading,
          .location-details-heading {
            grid-template-columns: 1fr;
          }

          .role-readiness-grid {
            grid-template-columns: 1fr;
          }

          .role-readiness-panel,
          .location-details-panel {
            border-radius: 24px;
          }

          .role-readiness-card {
            min-height: 0;
            grid-template-columns: 1fr;
          }

          .role-readiness-icon,
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
