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
  organisation_type: string | null;
  safeguarding_region: string | null;
  works_with_children_or_pupils: boolean | null;
};

type ChoiceOption = {
  value: string;
  label: string;
  icon: string;
  helpText: string;
};

type GuideStep = {
  icon: string;
  title: string;
  text: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function getSafeguardingRegionLabel(value: string | null | undefined) {
  if (value === "england_wales") return "England / Wales - DBS";
  if (value === "northern_ireland") return "Northern Ireland - AccessNI";
  if (value === "other") return "Other / country-specific guidance";

  return "Scotland - PVG";
}

function getOrganisationTypeLabel(value: string | null | undefined) {
  if (value === "school_college") return "School / college";
  if (value === "local_authority_employability") {
    return "Local authority / employability partner";
  }
  if (value === "other") return "Other organisation";

  return "Charity / community organisation";
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
    helpText: "Refreshments, cafe support, kitchen help or hosting.",
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

const guideSteps: GuideStep[] = [
  {
    icon: "💬",
    title: "Add role title and summary",
    text: "Say what the volunteer will do using short, plain language.",
  },
  {
    icon: "📍",
    title: "Add location and travel",
    text: "Choose in-person, remote or hybrid, then add safe location details.",
  },
  {
    icon: "🕒",
    title: "Choose time commitment",
    text: "Help volunteers decide whether the role fits their week.",
  },
  {
    icon: "⭐",
    title: "Choose interests and skills",
    text: "These choices help matching work and show what volunteers can build.",
  },
  {
    icon: "💛",
    title: "Choose support offered",
    text: "Tell volunteers what help, adjustments or reassurance is available.",
  },
  {
    icon: "👤",
    title: "Add contact person",
    text: "Use an email that your organisation checks regularly.",
  },
  {
    icon: "🛡️",
    title: "Add safety notes",
    text: "Explain welcome, supervision, first visit support or location privacy.",
  },
  {
    icon: "⚖️",
    title: "Legal and safeguarding",
    text: "Add pupil suitability, supervision, consent and safeguarding review details.",
  },
  {
    icon: "✅",
    title: "Save or publish",
    text: "Save as draft or publish when the role is ready for volunteers.",
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

function StepSection({
  stepNumber,
  icon,
  title,
  description,
  children,
}: {
  stepNumber: number;
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="role-step-section" data-role-step={stepNumber}>
      <div className="role-step-heading">
        <span className="role-step-icon" aria-hidden="true">
          {icon}
        </span>

        <div className="role-step-copy">
          <p className="role-step-kicker">
            Step {stepNumber}
            <span data-role-step-status={stepNumber}>
              <span aria-hidden="true">○</span>
              To do
            </span>
          </p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="role-step-body">{children}</div>
    </section>
  );
}

function SafetyCheckbox({
  name,
  icon,
  title,
  text,
  defaultChecked = false,
}: {
  name: string;
  icon: string;
  title: string;
  text: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="safeguarding-check-card">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
      <span className="safeguarding-check-icon" aria-hidden="true">
        {icon}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </label>
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
    .select(
      "organisation_name,contact_email,support_offered,profile_completed,organisation_type,safeguarding_region,works_with_children_or_pupils",
    )
    .eq("user_id", user.id)
    .maybeSingle<OrganisationProfile>();

  const profileCompleted = organisationProfile?.profile_completed === true;
  const organisationTypeLabel = getOrganisationTypeLabel(
    organisationProfile?.organisation_type,
  );
  const safeguardingRegionLabel = getSafeguardingRegionLabel(
    organisationProfile?.safeguarding_region,
  );

  const listenText =
    `This is the create opportunity page. The form is split into nine steps. Step 1 is role title and summary. Step 2 is location and travel. Step 3 is time commitment. Step 4 is interests and skills. Step 5 is support offered. Step 6 is contact person. Step 7 is safety notes. Step 8 is legal and safeguarding. Step 9 is save or publish. The guide turns green and shows a tick as each section is completed. The organisation type is currently ${organisationTypeLabel}. The safeguarding region is currently ${safeguardingRegionLabel}. Scotland uses PVG wording. England and Wales use DBS wording. Northern Ireland uses AccessNI wording. This phase records role-level legal and safeguarding readiness only. It does not change what pupils or volunteers can see yet. You can save as draft or publish if your organisation profile is complete.`;

  return (
    <main className="onboarding-shell role-create-page">
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
                  Work through the steps to create a clear, supportive and
                  realistic role. Volunteers should understand what they will do,
                  where it happens, when it happens, what support is available,
                  and what safeguarding checks are needed before they apply.
                </p>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card role-progress-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Role setup</h2>
                <p>
                  {profileCompleted
                    ? "You can save drafts or publish roles."
                    : "Complete organisation profile before publishing."}
                </p>
              </div>
            </div>

            <div className="role-progress-summary">
              <div className="role-progress-label">
                <span>Setup progress</span>
                <strong>
                  <span data-role-complete-count>0</span>/9 steps
                </strong>
              </div>
              <div className="role-progress-meter" aria-hidden="true">
                <span data-role-progress-meter style={{ width: "0%" }} />
              </div>
            </div>
          </div>
        </div>

        <section
          className="role-form-guide"
          aria-labelledby="role-form-guide-title"
        >
          <div className="role-form-guide-heading">
            <span aria-hidden="true">🧭</span>

            <div>
              <p className="brand-eyebrow">Step-by-step guide</p>
              <h2 id="role-form-guide-title">How to create this role</h2>
              <p>
                Complete the sections in order. Each guide card turns green and
                shows a tick as the matching section is filled in.
              </p>
            </div>
          </div>

          <div className="role-form-guide-grid">
            {guideSteps.map((step, index) => (
              <article
                key={step.title}
                className="role-guide-step"
                data-role-guide-step={index + 1}
              >
                <span className="role-guide-step-number">{index + 1}</span>

                <div className="role-guide-step-icon" aria-hidden="true">
                  {step.icon}
                </div>

                <div className="role-guide-step-copy">
                  <p className="role-guide-step-kicker">
                    Step {index + 1}
                    <span data-role-guide-status={index + 1}>To do</span>
                  </p>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="role-readiness-panel"
          aria-labelledby="role-readiness-title"
        >
          <div className="role-readiness-heading">
            <span className="role-readiness-icon" aria-hidden="true">
              ✅
            </span>

            <div>
              <p className="brand-eyebrow">Before publishing</p>
              <h2 id="role-readiness-title">Make the role safe and clear</h2>
              <p>
                Use plain language, realistic location information, clear time
                commitment, support choices, safety notes and legal/safeguarding
                readiness. Save as draft if anything still needs checking.
              </p>
            </div>
          </div>
        </section>

        <section
          className="role-safeguarding-context"
          aria-labelledby="role-safeguarding-context-title"
        >
          <div className="role-safeguarding-context-icon" aria-hidden="true">
            ⚖️
          </div>

          <div>
            <p className="brand-eyebrow">School safety layer phase 1B</p>
            <h2 id="role-safeguarding-context-title">
              Role-level legal and safeguarding readiness
            </h2>
            <p>
              This phase records role-level readiness only. It does not yet
              change public visibility or pupil filtering. Use it to flag pupil
              suitability, supervision, consent, PVG/DBS/AccessNI review, and
              restrictions such as no lone working or no home visits.
            </p>

            <div className="role-safeguarding-context-grid">
              <span>
                <strong>Organisation type:</strong> {organisationTypeLabel}
              </span>
              <span>
                <strong>Region wording:</strong> {safeguardingRegionLabel}
              </span>
              <span>
                <strong>Children / pupils:</strong>{" "}
                {organisationProfile?.works_with_children_or_pupils
                  ? "May be involved"
                  : "Not marked at organisation level"}
              </span>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={createOpportunity} className="form-stack" data-role-create-form>
          <StepSection
            stepNumber={1}
            icon="💬"
            title="Role title and summary"
            description="This is what volunteers see first. Keep it short, clear and welcoming."
          >
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
                placeholder="Example: Community cafe welcome volunteer"
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
                placeholder="Example: Help welcome visitors, offer tea and coffee, and keep the cafe area calm and friendly."
              />
            </label>
          </StepSection>

          <StepSection
            stepNumber={2}
            icon="📍"
            title="Location and travel"
            description="Add enough location information to help people decide if the role is realistic."
          >
            <div className="location-details-panel">
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
            </div>
          </StepSection>

          <StepSection
            stepNumber={3}
            icon="🕒"
            title="Time commitment"
            description="Choose a simple pattern so volunteers know what to expect."
          >
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
                <option value="Short shifts to start">
                  Short shifts to start
                </option>
              </select>
            </label>
          </StepSection>

          <StepSection
            stepNumber={4}
            icon="⭐"
            title="Interests and skills"
            description="These choices help volunteers find roles that fit them."
          >
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
          </StepSection>

          <StepSection
            stepNumber={5}
            icon="💛"
            title="Support offered"
            description="Tell volunteers what support or reassurance is available."
          >
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
          </StepSection>

          <StepSection
            stepNumber={6}
            icon="👤"
            title="Contact person"
            description="Add the person or inbox volunteers should hear from."
          >
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
          </StepSection>

          <StepSection
            stepNumber={7}
            icon="🛡️"
            title="Safety and first visit notes"
            description="Add supervision, welcome, accessibility or location privacy information."
          >
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
          </StepSection>

          <StepSection
            stepNumber={8}
            icon="⚖️"
            title="Legal and safeguarding readiness"
            description="Record pupil suitability, consent, supervision and safeguarding checks before publishing."
          >
            <section
              className="role-legal-panel"
              aria-labelledby="role-legal-title"
            >
              <div className="role-legal-heading">
                <span className="role-legal-icon" aria-hidden="true">
                  ⚖️
                </span>

                <div>
                  <p className="brand-eyebrow">Role-level readiness</p>
                  <h2 id="role-legal-title">
                    Legal and safeguarding questions
                  </h2>
                  <p>
                    These fields help your organisation review pupil suitability,
                    supervision, consent and safeguarding checks. They are saved
                    for readiness only in this phase.
                  </p>
                </div>
              </div>

              <div className="dashboard-grid">
                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      👥
                    </span>
                    <span>Minimum age / stage</span>
                  </span>
                  <select name="minimum_age_stage" defaultValue="not_set">
                    <option value="not_set">Not set yet</option>
                    <option value="adults_only">Adults only</option>
                    <option value="sixteen_plus">16+</option>
                    <option value="fourteen_plus">14+</option>
                    <option value="school_pupils_with_approval">
                      School pupils with school approval
                    </option>
                    <option value="school_pupils_with_parent_carer_consent">
                      School pupils with parent/carer consent
                    </option>
                  </select>
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      🛡️
                    </span>
                    <span>Safeguarding check wording</span>
                  </span>
                  <select
                    name="safeguarding_check_region"
                    defaultValue="organisation_default"
                  >
                    <option value="organisation_default">
                      Use organisation default
                    </option>
                    <option value="scotland_pvg">Scotland - PVG</option>
                    <option value="england_wales_dbs">
                      England / Wales - DBS
                    </option>
                    <option value="northern_ireland_accessni">
                      Northern Ireland - AccessNI
                    </option>
                    <option value="not_expected">Not expected for this role</option>
                    <option value="not_sure">Not sure - needs review</option>
                  </select>
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      🔁
                    </span>
                    <span>Frequency pattern</span>
                  </span>
                  <select name="role_frequency_pattern" defaultValue="not_set">
                    <option value="not_set">Not set yet</option>
                    <option value="one_off">One-off</option>
                    <option value="occasional">Occasional</option>
                    <option value="weekly_or_regular">Weekly or regular</option>
                    <option value="more_than_three_days_in_thirty">
                      More than 3 days in 30 days
                    </option>
                    <option value="overnight">
                      Overnight or late-night activity
                    </option>
                    <option value="not_sure">Not sure - needs review</option>
                  </select>
                </label>
              </div>

              <div className="safeguarding-warning-card">
                <span aria-hidden="true">⚠️</span>
                <div>
                  <strong>This is not legal advice.</strong>
                  <p>
                    Do not rely on a simple number of hours. Safeguarding checks
                    depend on the role activity, supervision, setting, frequency
                    and region. Roles involving children, pupils, care,
                    supervision, teaching, coaching, mentoring, transport or
                    overnight activity should be reviewed before publishing.
                  </p>
                </div>
              </div>

              <div className="safeguarding-check-grid">
                <SafetyCheckbox
                  name="suitable_for_pupils"
                  icon="🏫"
                  title="Potentially suitable for pupils"
                  text="Mark only if this role could later be shown in a school-approved pupil pathway."
                />

                <SafetyCheckbox
                  name="parent_carer_consent_required"
                  icon="👪"
                  title="Parent/carer consent required"
                  text="Useful where pupils or younger volunteers may be involved."
                />

                <SafetyCheckbox
                  name="school_approval_required"
                  icon="✅"
                  title="School approval required"
                  text="Role should be approved by the school before school-linked pupils see it later."
                />

                <SafetyCheckbox
                  name="safeguarding_review_required"
                  icon="⚖️"
                  title="Safeguarding review required"
                  text="Use when the role needs a safeguarding lead or coordinator to review it."
                />

                <SafetyCheckbox
                  name="supervision_required"
                  icon="👀"
                  title="Supervision required"
                  text="A named adult or approved staff member should supervise this role."
                  defaultChecked
                />

                <SafetyCheckbox
                  name="no_lone_working"
                  icon="🚫"
                  title="No lone working"
                  text="Volunteer should not be left alone with a child, pupil or vulnerable person."
                />

                <SafetyCheckbox
                  name="no_home_visits"
                  icon="🏠"
                  title="No home visits"
                  text="Role does not involve visiting someone's home."
                />

                <SafetyCheckbox
                  name="no_money_handling"
                  icon="💷"
                  title="No money handling"
                  text="Role does not involve handling money, payments or financial details."
                />

                <SafetyCheckbox
                  name="no_personal_care"
                  icon="🤲"
                  title="No personal care"
                  text="Role does not involve personal care tasks."
                />

                <SafetyCheckbox
                  name="no_private_messaging"
                  icon="📵"
                  title="No private messaging outside approved route"
                  text="Communication should stay through approved organisation contact routes."
                  defaultChecked
                />

                <SafetyCheckbox
                  name="risk_assessment_completed"
                  icon="📋"
                  title="Risk assessment completed"
                  text="Mark when your organisation has completed or checked the risk assessment."
                />
              </div>

              <div className="dashboard-grid">
                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      👤
                    </span>
                    <span>Named safeguarding contact optional</span>
                  </span>
                  <input
                    name="named_safeguarding_contact"
                    type="text"
                    placeholder="Example: Safeguarding lead, volunteer coordinator, school contact"
                  />
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      📝
                    </span>
                    <span>Legal or safeguarding notes optional</span>
                  </span>
                  <textarea
                    name="legal_safeguarding_notes"
                    rows={4}
                    placeholder="Optional. Example: School approval required before pupils can access this role. PVG/DBS/AccessNI requirements to be checked before activity starts."
                  />
                </label>
              </div>
            </section>
          </StepSection>

          <StepSection
            stepNumber={9}
            icon="✅"
            title="Save or publish"
            description="Save as draft while checking, or publish when the role is ready."
          >
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
          </StepSection>
        </form>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              function textValue(form, name) {
                var field = form.querySelector('[name="' + name + '"]');
                return field && typeof field.value === 'string' ? field.value.trim() : '';
              }

              function selectValue(form, name) {
                var field = form.querySelector('[name="' + name + '"]');
                return field && typeof field.value === 'string' ? field.value.trim() : '';
              }

              function checkedCount(form, name) {
                return form.querySelectorAll('[name="' + name + '"]:checked').length;
              }

              function isChecked(form, name) {
                var field = form.querySelector('[name="' + name + '"]');
                return !!(field && field.checked);
              }

              function setComplete(stepNumber, complete) {
                var guide = document.querySelector('[data-role-guide-step="' + stepNumber + '"]');
                var guideStatus = document.querySelector('[data-role-guide-status="' + stepNumber + '"]');
                var guideNumber = guide ? guide.querySelector('.role-guide-step-number') : null;
                var section = document.querySelector('[data-role-step="' + stepNumber + '"]');
                var sectionStatus = document.querySelector('[data-role-step-status="' + stepNumber + '"]');

                if (guide) {
                  guide.classList.toggle('role-guide-step-complete', complete);
                }

                if (guideStatus) {
                  guideStatus.textContent = complete ? 'Complete' : 'To do';
                }

                if (guideNumber) {
                  guideNumber.textContent = complete ? '✓' : String(stepNumber);
                }

                if (section) {
                  section.classList.toggle('role-step-complete', complete);
                }

                if (sectionStatus) {
                  sectionStatus.innerHTML = complete
                    ? '<span aria-hidden="true">✅</span>Complete'
                    : '<span aria-hidden="true">○</span>To do';
                }
              }

              function updateRoleProgress() {
                var form = document.querySelector('[data-role-create-form]');
                if (!form) return;

                var locationType = selectValue(form, 'location_type');
                var hasSafeLocation =
                  locationType === 'remote' ||
                  textValue(form, 'location_town_city') ||
                  textValue(form, 'location_area') ||
                  textValue(form, 'location') ||
                  textValue(form, 'location_venue');

                var hasLegalReadiness =
                  selectValue(form, 'minimum_age_stage') !== 'not_set' ||
                  selectValue(form, 'safeguarding_check_region') !== 'organisation_default' ||
                  selectValue(form, 'role_frequency_pattern') !== 'not_set' ||
                  isChecked(form, 'suitable_for_pupils') ||
                  isChecked(form, 'parent_carer_consent_required') ||
                  isChecked(form, 'school_approval_required') ||
                  isChecked(form, 'safeguarding_review_required') ||
                  isChecked(form, 'supervision_required') ||
                  isChecked(form, 'no_lone_working') ||
                  isChecked(form, 'no_home_visits') ||
                  isChecked(form, 'no_money_handling') ||
                  isChecked(form, 'no_personal_care') ||
                  isChecked(form, 'no_private_messaging') ||
                  isChecked(form, 'risk_assessment_completed') ||
                  textValue(form, 'named_safeguarding_contact') ||
                  textValue(form, 'legal_safeguarding_notes');

                var steps = [
                  Boolean(textValue(form, 'title') && textValue(form, 'summary')),
                  Boolean(hasSafeLocation),
                  Boolean(selectValue(form, 'time_commitment')),
                  Boolean(checkedCount(form, 'interests') > 0 && checkedCount(form, 'skills') > 0),
                  Boolean(checkedCount(form, 'support_offered') > 0),
                  Boolean(textValue(form, 'contact_email')),
                  Boolean(
                    textValue(form, 'safety_notes') ||
                    textValue(form, 'travel_notes') ||
                    textValue(form, 'accessibility_notes') ||
                    isChecked(form, 'hide_exact_location')
                  ),
                  Boolean(hasLegalReadiness),
                  Boolean(selectValue(form, 'status'))
                ];

                var completeCount = 0;

                steps.forEach(function (complete, index) {
                  if (complete) completeCount += 1;
                  setComplete(index + 1, complete);
                });

                var completeCountNode = document.querySelector('[data-role-complete-count]');
                var meterNode = document.querySelector('[data-role-progress-meter]');
                var percent = Math.round((completeCount / steps.length) * 100);

                if (completeCountNode) {
                  completeCountNode.textContent = String(completeCount);
                }

                if (meterNode) {
                  meterNode.style.width = percent + '%';
                }
              }

              document.addEventListener('input', updateRoleProgress);
              document.addEventListener('change', updateRoleProgress);
              document.addEventListener('DOMContentLoaded', updateRoleProgress);
              updateRoleProgress();
            })();
          `,
        }}
      />

      <style>{`
        .role-create-page,
        .role-create-page * {
          box-sizing: border-box;
        }

        .role-progress-card {
          display: grid;
          gap: 16px;
        }

        .role-progress-summary {
          display: grid;
          gap: 8px;
        }

        .role-progress-label {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          color: #60706a;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .role-progress-label strong {
          color: #315f48;
        }

        .role-progress-meter {
          width: 100%;
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
        }

        .role-progress-meter span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8fb29e, #4f8d68);
        }

        .role-form-guide,
        .role-safeguarding-context {
          display: grid;
          gap: 18px;
          margin: 22px 0;
          padding: 20px;
          border-radius: 28px;
          box-shadow: 0 18px 42px rgba(33, 56, 48, 0.07);
        }

        .role-form-guide {
          border: 1px solid rgba(108, 92, 160, 0.16);
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.92), rgba(255, 255, 255, 0.9));
        }

        .role-safeguarding-context {
          grid-template-columns: auto 1fr;
          border: 1px solid rgba(108, 92, 160, 0.18);
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.32), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.94), rgba(255, 255, 255, 0.9));
        }

        .role-safeguarding-context-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(108, 92, 160, 0.12);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.14);
          font-size: 1.85rem;
        }

        .role-safeguarding-context h2 {
          margin: 0 0 8px;
          color: #4f4b82;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .role-safeguarding-context p {
          margin: 0;
          color: #5f6072;
          font-weight: 760;
          line-height: 1.5;
        }

        .role-safeguarding-context-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .role-safeguarding-context-grid span {
          display: block;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.76);
          color: #5f6072;
          font-size: 0.88rem;
          font-weight: 800;
          line-height: 1.28;
          overflow-wrap: anywhere;
        }

        .role-safeguarding-context-grid strong {
          color: #4f4b82;
        }

        .role-form-guide-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .role-form-guide-heading > span {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(108, 92, 160, 0.12);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.14);
          font-size: 1.85rem;
        }

        .role-form-guide-heading h2 {
          margin: 0 0 8px;
          color: #4f4b82;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .role-form-guide-heading p {
          margin: 0;
          color: #5f6072;
          font-weight: 760;
          line-height: 1.5;
        }

        .role-form-guide-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .role-guide-step {
          position: relative;
          display: grid;
          gap: 10px;
          min-height: 190px;
          padding: 15px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 12px 28px rgba(33, 56, 48, 0.05);
        }

        .role-guide-step-complete {
          border-color: rgba(34, 124, 78, 0.26);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.28), transparent 34%),
            rgba(244, 255, 249, 0.92);
          box-shadow: 0 14px 30px rgba(33, 96, 61, 0.08);
        }

        .role-guide-step-number {
          position: absolute;
          top: 12px;
          right: 12px;
          display: inline-flex;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
          color: #4f4b82;
          font-size: 0.82rem;
          font-weight: 950;
          line-height: 1;
        }

        .role-guide-step-complete .role-guide-step-number {
          background: rgba(34, 124, 78, 0.14);
          color: #145c38;
        }

        .role-guide-step-icon {
          display: inline-flex;
          width: 52px;
          height: 52px;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: rgba(248, 248, 252, 0.96);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.08);
          font-size: 1.55rem;
        }

        .role-guide-step-complete .role-guide-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .role-guide-step-copy {
          display: grid;
          gap: 6px;
        }

        .role-guide-step-kicker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin: 0;
          padding-right: 34px;
          color: #6c5ca0;
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .role-guide-step-kicker span {
          display: inline-flex;
          min-height: 24px;
          align-items: center;
          justify-content: center;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.1);
          color: #6c5ca0;
          font-size: 0.68rem;
          letter-spacing: 0;
          text-transform: none;
        }

        .role-guide-step-complete .role-guide-step-kicker,
        .role-guide-step-complete .role-guide-step-kicker span {
          color: #145c38;
        }

        .role-guide-step-complete .role-guide-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .role-guide-step-copy h3 {
          margin: 0;
          padding-right: 32px;
          color: #315f48;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.14;
        }

        .role-guide-step-copy p {
          margin: 0;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 740;
          line-height: 1.42;
        }

        .role-readiness-panel,
        .role-legal-panel {
          display: grid;
          gap: 18px;
          padding: clamp(18px, 4vw, 24px);
          border-radius: 28px;
          box-shadow: 0 18px 48px rgba(33, 56, 48, 0.07);
        }

        .role-readiness-panel {
          border: 1px solid rgba(83, 111, 99, 0.18);
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.82), rgba(255, 255, 255, 0.88)),
            rgba(255, 255, 255, 0.84);
        }

        .role-legal-panel {
          border: 1px solid rgba(108, 92, 160, 0.18);
          background:
            linear-gradient(135deg, rgba(248, 245, 255, 0.88), rgba(255, 255, 255, 0.92)),
            rgba(255, 255, 255, 0.84);
        }

        .role-readiness-heading,
        .role-legal-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .role-readiness-icon,
        .role-legal-icon {
          display: inline-flex;
          width: 58px;
          height: 58px;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          font-size: 1.8rem;
        }

        .role-readiness-icon {
          background: rgba(143, 178, 158, 0.16);
        }

        .role-legal-icon {
          background: rgba(108, 92, 160, 0.12);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.14);
        }

        .role-readiness-heading h2,
        .role-legal-heading h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.25rem, 3vw, 1.65rem);
          letter-spacing: -0.035em;
          line-height: 1.12;
        }

        .role-legal-heading h2 {
          color: #4f4b82;
        }

        .role-readiness-heading p,
        .role-legal-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.5;
        }

        .safeguarding-warning-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          padding: 16px;
          border: 1px solid rgba(191, 146, 72, 0.24);
          border-radius: 22px;
          background: rgba(255, 250, 241, 0.92);
        }

        .safeguarding-warning-card > span {
          display: inline-flex;
          width: 46px;
          height: 46px;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.78);
          font-size: 1.35rem;
        }

        .safeguarding-warning-card strong {
          display: block;
          margin-bottom: 5px;
          color: #8a6630;
          font-weight: 950;
          line-height: 1.2;
        }

        .safeguarding-warning-card p {
          margin: 0;
          color: #715529;
          font-weight: 760;
          line-height: 1.45;
        }

        .safeguarding-check-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .safeguarding-check-card {
          display: grid;
          grid-template-columns: auto auto 1fr;
          gap: 12px;
          align-items: start;
          padding: 15px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.76);
          color: #315f48;
          cursor: pointer;
        }

        .safeguarding-check-card input {
          width: 22px;
          height: 22px;
          margin-top: 2px;
          accent-color: #4f8d68;
        }

        .safeguarding-check-icon {
          font-size: 1.35rem;
          line-height: 1;
        }

        .safeguarding-check-card strong,
        .safeguarding-check-card small {
          display: block;
        }

        .safeguarding-check-card strong {
          margin-bottom: 5px;
          font-weight: 950;
          line-height: 1.2;
        }

        .safeguarding-check-card small {
          color: #60706a;
          font-weight: 740;
          line-height: 1.35;
        }

        .role-step-section {
          display: grid;
          gap: 18px;
          padding: 20px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.68);
          box-shadow: 0 14px 34px rgba(33, 56, 48, 0.05);
        }

        .role-step-complete {
          border-color: rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.22), transparent 34%),
            rgba(244, 255, 249, 0.86);
        }

        .role-step-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .role-step-icon {
          display: inline-flex;
          width: 58px;
          height: 58px;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: rgba(143, 178, 158, 0.14);
          box-shadow: inset 0 0 0 1px rgba(83, 111, 99, 0.08);
          font-size: 1.75rem;
        }

        .role-step-complete .role-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .role-step-copy {
          display: grid;
          gap: 7px;
          min-width: 0;
        }

        .role-step-kicker {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin: 0;
          color: #6c5ca0;
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .role-step-kicker span {
          display: inline-flex;
          min-height: 26px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 5px 9px;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.1);
          color: #6c5ca0;
          font-size: 0.72rem;
          letter-spacing: 0;
          text-transform: none;
        }

        .role-step-complete .role-step-kicker,
        .role-step-complete .role-step-kicker span {
          color: #145c38;
        }

        .role-step-complete .role-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .role-step-copy h2 {
          margin: 0;
          color: #315f48;
          font-size: clamp(1.22rem, 3vw, 1.55rem);
          font-weight: 950;
          letter-spacing: -0.03em;
          line-height: 1.12;
        }

        .role-step-copy p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.45;
        }

        .role-step-body {
          display: grid;
          gap: 16px;
        }

        .location-details-panel {
          display: grid;
          gap: 18px;
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
          .role-form-guide-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .role-safeguarding-context-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .role-form-guide-heading,
          .role-readiness-heading,
          .role-legal-heading,
          .role-step-heading,
          .role-safeguarding-context {
            grid-template-columns: 1fr;
          }

          .role-form-guide,
          .role-readiness-panel,
          .role-legal-panel,
          .role-step-section,
          .role-safeguarding-context {
            padding: 18px;
            border-radius: 24px;
          }

          .role-form-guide-heading > span,
          .role-readiness-icon,
          .role-legal-icon,
          .role-step-icon,
          .role-safeguarding-context-icon {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .role-form-guide-grid,
          .safeguarding-check-grid {
            grid-template-columns: 1fr;
          }

          .role-guide-step {
            min-height: 0;
          }

          .privacy-check-row,
          .safeguarding-warning-card,
          .safeguarding-check-card {
            grid-template-columns: 1fr;
          }

          .safeguarding-check-icon {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
