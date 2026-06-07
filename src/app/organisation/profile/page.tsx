import Link from "next/link";
import { redirect } from "next/navigation";
import { saveOrganisationProfile } from "./actions";
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
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  location: string | null;
  purpose: string | null;
  volunteer_types: string[] | null;
  support_offered: string[] | null;
  safeguarding_notes: string | null;
  profile_completed: boolean | null;
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
  isComplete: boolean;
};

const volunteerTypeOptions: ChoiceOption[] = [
  {
    value: "One-off events",
    label: "One-off events",
    icon: "🎟️",
    helpText: "Short event-based roles or occasional help.",
  },
  {
    value: "Regular weekly roles",
    label: "Regular weekly roles",
    icon: "🔁",
    helpText: "Consistent volunteering with a regular routine.",
  },
  {
    value: "Practical hands-on tasks",
    label: "Practical hands-on tasks",
    icon: "🧰",
    helpText: "Set up, sorting, packing, tidying or active help.",
  },
  {
    value: "People-facing roles",
    label: "People-facing roles",
    icon: "🤝",
    helpText: "Welcoming, supporting visitors or helping groups.",
  },
  {
    value: "Admin or digital tasks",
    label: "Admin or digital tasks",
    icon: "💻",
    helpText: "Forms, emails, simple digital or organising work.",
  },
  {
    value: "Remote or flexible roles",
    label: "Remote or flexible roles",
    icon: "🏡",
    helpText: "Roles people can do online, from home or flexibly.",
  },
];

const supportOptions: ChoiceOption[] = [
  {
    value: "Clear written instructions",
    label: "Clear written instructions",
    icon: "📝",
    helpText: "Volunteers know what to expect before they start.",
  },
  {
    value: "Named contact person",
    label: "Named contact person",
    icon: "👋",
    helpText: "A clear person volunteers can ask for help.",
  },
  {
    value: "Shorter starter shifts",
    label: "Shorter starter shifts",
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
    label: "Quiet or calmer option",
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

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function hasValue(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function hasChoices(values: string[] | null | undefined) {
  return Array.isArray(values) && values.length > 0;
}

function isChecked(savedValues: string[] | null | undefined, value: string) {
  return Array.isArray(savedValues) && savedValues.includes(value);
}

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

function StepSection({
  stepNumber,
  icon,
  title,
  description,
  isComplete,
  children,
}: {
  stepNumber: number;
  icon: string;
  title: string;
  description: string;
  isComplete: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        isComplete
          ? "organisation-step-section organisation-step-complete"
          : "organisation-step-section"
      }
    >
      <div className="organisation-step-heading">
        <span className="organisation-step-icon" aria-hidden="true">
          {icon}
        </span>

        <div className="organisation-step-copy">
          <p className="organisation-step-kicker">
            Step {stepNumber}
            <span>
              <span aria-hidden="true">{isComplete ? "✅" : "○"}</span>
              {isComplete ? "Complete" : "To do"}
            </span>
          </p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="organisation-step-body">{children}</div>
    </section>
  );
}

export default async function OrganisationProfilePage({
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
      "organisation_name,contact_email,phone,website,logo_url,location,purpose,volunteer_types,support_offered,safeguarding_notes,profile_completed",
    )
    .eq("user_id", user.id)
    .maybeSingle<OrganisationProfile>();

  const fallbackName = profile?.full_name?.trim() || "";
  const fallbackEmail = profile?.email?.trim() || user.email || "";
  const currentLogoUrl = organisationProfile?.logo_url?.trim() || "";

  const step1Complete =
    hasValue(organisationProfile?.organisation_name) && hasValue(currentLogoUrl);
  const step2Complete = hasValue(organisationProfile?.contact_email);
  const step3Complete = hasValue(organisationProfile?.location);
  const step4Complete = hasValue(organisationProfile?.purpose);
  const step5Complete = hasChoices(organisationProfile?.volunteer_types);
  const step6Complete = hasChoices(organisationProfile?.support_offered);
  const step7Complete = hasValue(organisationProfile?.safeguarding_notes);
  const step8Complete = organisationProfile?.profile_completed === true;

  const guideSteps: GuideStep[] = [
    {
      icon: "🏢",
      title: "Add your name and logo",
      text: "Use the organisation name and official logo volunteers will recognise.",
      isComplete: step1Complete,
    },
    {
      icon: "✉️",
      title: "Add contact details",
      text: "Use an email or phone number your organisation checks regularly.",
      isComplete: step2Complete,
    },
    {
      icon: "📍",
      title: "Say where you are based",
      text: "Add the town, city or area you support. Do not add private addresses here.",
      isComplete: step3Complete,
    },
    {
      icon: "💬",
      title: "Explain what you do",
      text: "Use plain language. One or two short sentences is enough.",
      isComplete: step4Complete,
    },
    {
      icon: "📣",
      title: "Choose role types",
      text: "Pick the kinds of volunteering your organisation usually offers.",
      isComplete: step5Complete,
    },
    {
      icon: "💛",
      title: "Choose support options",
      text: "Tell volunteers what help or adjustments they can expect.",
      isComplete: step6Complete,
    },
    {
      icon: "🛡️",
      title: "Add safety notes",
      text: "Optional, but useful for trust, supervision and first-visit expectations.",
      isComplete: step7Complete,
    },
    {
      icon: "✅",
      title: "Save your profile",
      text: "Once saved, these details can appear on volunteer-facing role pages.",
      isComplete: step8Complete,
    },
  ];

  const completedSteps = guideSteps.filter((step) => step.isComplete).length;
  const completionPercent = Math.round((completedSteps / guideSteps.length) * 100);

  const listenText =
    "This is the organisation profile setup page. Add your organisation name and official logo, then add contact details, location, a plain language description, volunteering types, support available, and optional safety notes. Each section is labelled Step 1, Step 2, Step 3 and so on. The step by step guide turns green and shows a tick when each section has been completed and saved. The logo helps volunteers recognise your organisation. SO Volunteering and organisations using this platform will never ask volunteers for money, bank details, passwords, or financial information. An organisation may need to confirm practical details, such as where a volunteer should go for an in-person volunteering role, but they should not ask for a volunteer’s full home address through the app. Required fields are organisation name, contact email, location, purpose, at least one volunteering type, and at least one support option. The final button says Save organisation profile.";

  return (
    <main className="onboarding-shell organisation-profile-page">
      <section className="onboarding-panel">
        <div className="onboarding-top-row">
          <div>
            <p className="brand-eyebrow">Organisation setup</p>
          </div>

          <div className="dashboard-topbar-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href="/organisation/dashboard"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
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
                🏢
              </span>

              <div>
                <h1 className="onboarding-title">
                  Set up your organisation profile
                </h1>
                <p className="onboarding-lead">
                  Add the details volunteers will see when they review your
                  roles. Keep this clear, welcoming and practical so volunteers
                  know who you are, what you do, and what support they can
                  expect.
                </p>
              </div>
            </div>
          </div>

          <div className="onboarding-progress-card organisation-logo-preview-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Profile status</h2>
                <p>
                  {organisationProfile?.profile_completed
                    ? "Ready for opportunities."
                    : "Complete this before creating opportunities."}
                </p>
              </div>
            </div>

            <div className="organisation-logo-preview">
              {currentLogoUrl ? (
                <img src={currentLogoUrl} alt="" />
              ) : (
                <span aria-hidden="true">🏢</span>
              )}
            </div>

            <p className="organisation-logo-helper">
              Uploading a logo helps volunteers recognise your organisation and
              feel safer when reviewing roles.
            </p>

            <div className="organisation-profile-progress">
              <div className="organisation-profile-progress-label">
                <span>Setup progress</span>
                <strong>{completedSteps}/8 steps</strong>
              </div>
              <div className="organisation-profile-progress-meter" aria-hidden="true">
                <span style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <section className="organisation-safety-card" aria-labelledby="safety-title">
          <div className="organisation-safety-icon" aria-hidden="true">
            🛡️
          </div>

          <div className="organisation-safety-copy">
            <p className="brand-eyebrow">Volunteer safety statement</p>
            <h2 id="safety-title">Stay safe</h2>
            <p>
              SO Volunteering and organisations using this platform will never
              ask volunteers for money, bank details, passwords, or financial
              information. An organisation may need to confirm practical
              details, such as where a volunteer should go for an in-person
              volunteering role, but they should not ask for a volunteer’s full
              home address through the app. If anything feels wrong, volunteers
              should stop and use Help using the app to report it.
            </p>
          </div>
        </section>

        <section
          className="organisation-form-guide"
          aria-labelledby="organisation-form-guide-title"
        >
          <div className="organisation-form-guide-heading">
            <span aria-hidden="true">🧭</span>

            <div>
              <p className="brand-eyebrow">Step-by-step guide</p>
              <h2 id="organisation-form-guide-title">
                How to complete this form
              </h2>
              <p>
                Work through the sections in order. Completed saved steps turn
                green and show a tick. You can come back and update these
                details later.
              </p>
            </div>
          </div>

          <div className="organisation-form-guide-grid">
            {guideSteps.map((step, index) => (
              <article
                key={step.title}
                className={
                  step.isComplete
                    ? "organisation-guide-step organisation-guide-step-complete"
                    : "organisation-guide-step"
                }
              >
                <span className="organisation-guide-step-number">
                  {step.isComplete ? "✓" : index + 1}
                </span>

                <div className="organisation-guide-step-icon" aria-hidden="true">
                  {step.icon}
                </div>

                <div className="organisation-guide-step-copy">
                  <p className="organisation-guide-step-kicker">
                    Step {index + 1}
                    <span>{step.isComplete ? "Complete" : "To do"}</span>
                  </p>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <form
          action={saveOrganisationProfile}
          className="form-stack"
          encType="multipart/form-data"
        >
          <StepSection
            stepNumber={1}
            icon="🏢"
            title="Organisation name and logo"
            description="Use the name and official logo volunteers will recognise."
            isComplete={step1Complete}
          >
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  🏢
                </span>
                <span>Organisation name</span>
              </span>
              <input
                name="organisation_name"
                type="text"
                required
                defaultValue={organisationProfile?.organisation_name || fallbackName}
                placeholder="Example: Aberdeen Community Hub"
              />
            </label>

            <section className="organisation-logo-upload-section">
              <div className="organisation-logo-upload-heading">
                <span aria-hidden="true">🖼️</span>
                <div>
                  <h2>Organisation logo</h2>
                  <p>
                    Upload your official logo so volunteers can recognise your
                    organisation when they view your roles. PNG, JPG, WEBP or
                    SVG. Maximum 3MB.
                  </p>
                </div>
              </div>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    📤
                  </span>
                  <span>Upload logo optional</span>
                </span>
                <input
                  name="logo_file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                />
                <span className="field-helper">
                  Uploading a new file will replace the saved logo URL for this
                  profile.
                </span>
              </label>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🔗
                  </span>
                  <span>Or paste logo URL optional</span>
                </span>
                <input
                  name="logo_url"
                  type="url"
                  defaultValue={currentLogoUrl}
                  placeholder="https://example.org/logo.png"
                />
                <span className="field-helper">
                  Keep this if you already use a hosted logo. Uploading a file
                  above will take priority.
                </span>
              </label>
            </section>
          </StepSection>

          <StepSection
            stepNumber={2}
            icon="✉️"
            title="Contact details"
            description="Use contact details your organisation checks regularly."
            isComplete={step2Complete}
          >
            <div className="dashboard-grid">
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
                  defaultValue={organisationProfile?.contact_email || fallbackEmail}
                  placeholder="volunteering@example.org"
                />
              </label>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    📞
                  </span>
                  <span>Phone number optional</span>
                </span>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={organisationProfile?.phone || ""}
                  placeholder="Optional"
                />
              </label>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🌐
                  </span>
                  <span>Website optional</span>
                </span>
                <input
                  name="website"
                  type="text"
                  defaultValue={organisationProfile?.website || ""}
                  placeholder="example.org"
                />
              </label>
            </div>
          </StepSection>

          <StepSection
            stepNumber={3}
            icon="📍"
            title="Town, city or area"
            description="Say where you are based or what area you support."
            isComplete={step3Complete}
          >
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  📍
                </span>
                <span>Town, city or area</span>
              </span>
              <input
                name="location"
                type="text"
                required
                defaultValue={organisationProfile?.location || ""}
                placeholder="Example: Aberdeen"
              />
            </label>
          </StepSection>

          <StepSection
            stepNumber={4}
            icon="💬"
            title="What your organisation does"
            description="Explain your organisation in plain language."
            isComplete={step4Complete}
          >
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  💬
                </span>
                <span>What does your organisation do?</span>
              </span>
              <textarea
                name="purpose"
                rows={5}
                required
                defaultValue={organisationProfile?.purpose || ""}
                placeholder="Use plain language. Example: We support local families with food, activities and community events."
              />
            </label>
          </StepSection>

          <StepSection
            stepNumber={5}
            icon="📣"
            title="Volunteering you offer"
            description="Choose the kinds of roles your organisation usually offers."
            isComplete={step5Complete}
          >
            <fieldset className="choice-group">
              <legend>
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    📣
                  </span>
                  <span>What volunteering do you offer?</span>
                </span>
              </legend>

              <ChoiceGrid
                name="volunteer_types"
                options={volunteerTypeOptions}
                savedValues={organisationProfile?.volunteer_types}
              />
            </fieldset>
          </StepSection>

          <StepSection
            stepNumber={6}
            icon="💛"
            title="Support volunteers can expect"
            description="Choose the support, adjustments or reassurance you can offer."
            isComplete={step6Complete}
          >
            <fieldset className="choice-group">
              <legend>
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    💛
                  </span>
                  <span>What support can volunteers expect?</span>
                </span>
              </legend>

              <ChoiceGrid
                name="support_offered"
                options={supportOptions}
                savedValues={organisationProfile?.support_offered}
              />
            </fieldset>
          </StepSection>

          <StepSection
            stepNumber={7}
            icon="🛡️"
            title="Safety, supervision or safeguarding notes"
            description="Optional, but useful for explaining first-visit support and supervision."
            isComplete={step7Complete}
          >
            <label className="field-label">
              <span className="field-label-row">
                <span className="field-label-icon" aria-hidden="true">
                  🛡️
                </span>
                <span>Safety, supervision or safeguarding notes optional</span>
              </span>
              <textarea
                name="safeguarding_notes"
                rows={5}
                defaultValue={organisationProfile?.safeguarding_notes || ""}
                placeholder="Optional. Example: Volunteers are welcomed by a named contact, shown the space, and told who to speak to if they need help."
              />
            </label>
          </StepSection>

          <StepSection
            stepNumber={8}
            icon="✅"
            title="Save your organisation profile"
            description="Save the form so your details can appear on volunteer-facing role pages."
            isComplete={step8Complete}
          >
            <button
              type="submit"
              className="primary-button onboarding-submit-button"
            >
              <span className="button-balanced-inner">
                <span aria-hidden="true">✅</span>
                <span>Save organisation profile</span>
              </span>
            </button>
          </StepSection>
        </form>
      </section>

      <style>{`
        .organisation-profile-page,
        .organisation-profile-page * {
          box-sizing: border-box;
        }

        .organisation-logo-preview-card {
          display: grid;
          gap: 14px;
        }

        .organisation-logo-preview {
          display: flex;
          width: 100%;
          min-height: 118px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(143, 178, 158, 0.22);
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.86), rgba(255, 255, 255, 0.94)),
            rgba(255, 255, 255, 0.84);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.54);
        }

        .organisation-logo-preview img {
          display: block;
          max-width: min(220px, 86%);
          max-height: 96px;
          object-fit: contain;
        }

        .organisation-logo-preview span {
          display: inline-flex;
          width: 68px;
          height: 68px;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          background: rgba(143, 178, 158, 0.16);
          font-size: 2rem;
        }

        .organisation-logo-helper {
          margin: 0;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 750;
          line-height: 1.42;
        }

        .organisation-profile-progress {
          display: grid;
          gap: 8px;
        }

        .organisation-profile-progress-label {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          color: #60706a;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .organisation-profile-progress-label strong {
          color: #315f48;
        }

        .organisation-profile-progress-meter {
          width: 100%;
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
        }

        .organisation-profile-progress-meter span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8fb29e, #4f8d68);
        }

        .organisation-safety-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
          margin: 22px 0;
          padding: 20px;
          border: 1px solid rgba(34, 124, 78, 0.24);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.4), transparent 32%),
            linear-gradient(135deg, rgba(244, 255, 249, 0.94), rgba(255, 255, 255, 0.9));
          box-shadow: 0 18px 42px rgba(33, 96, 61, 0.1);
        }

        .organisation-safety-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.16);
          font-size: 1.9rem;
        }

        .organisation-safety-copy {
          display: grid;
          gap: 8px;
          min-width: 0;
        }

        .organisation-safety-copy h2 {
          margin: 0;
          color: #145c38;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .organisation-safety-copy p {
          margin: 0;
          color: #275f45;
          font-weight: 780;
          line-height: 1.5;
        }

        .organisation-form-guide {
          display: grid;
          gap: 18px;
          margin: 22px 0;
          padding: 20px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.34), transparent 34%),
            linear-gradient(135deg, rgba(248, 245, 255, 0.92), rgba(255, 255, 255, 0.9));
          box-shadow: 0 18px 42px rgba(33, 56, 48, 0.07);
        }

        .organisation-form-guide-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .organisation-form-guide-heading > span {
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

        .organisation-form-guide-heading h2 {
          margin: 0 0 8px;
          color: #4f4b82;
          font-size: clamp(1.3rem, 3vw, 1.75rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .organisation-form-guide-heading p {
          margin: 0;
          color: #5f6072;
          font-weight: 760;
          line-height: 1.5;
        }

        .organisation-form-guide-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .organisation-guide-step {
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

        .organisation-guide-step-complete {
          border-color: rgba(34, 124, 78, 0.26);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.28), transparent 34%),
            rgba(244, 255, 249, 0.92);
          box-shadow: 0 14px 30px rgba(33, 96, 61, 0.08);
        }

        .organisation-guide-step-number {
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

        .organisation-guide-step-complete .organisation-guide-step-number {
          background: rgba(34, 124, 78, 0.14);
          color: #145c38;
        }

        .organisation-guide-step-icon {
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

        .organisation-guide-step-complete .organisation-guide-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .organisation-guide-step-copy {
          display: grid;
          gap: 6px;
        }

        .organisation-guide-step-kicker {
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

        .organisation-guide-step-kicker span {
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

        .organisation-guide-step-complete .organisation-guide-step-kicker,
        .organisation-guide-step-complete .organisation-guide-step-kicker span {
          color: #145c38;
        }

        .organisation-guide-step-complete .organisation-guide-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .organisation-guide-step-copy h3 {
          margin: 0;
          padding-right: 32px;
          color: #315f48;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.14;
        }

        .organisation-guide-step-copy p {
          margin: 0;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 740;
          line-height: 1.42;
        }

        .organisation-step-section {
          display: grid;
          gap: 18px;
          padding: 20px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.68);
          box-shadow: 0 14px 34px rgba(33, 56, 48, 0.05);
        }

        .organisation-step-complete {
          border-color: rgba(34, 124, 78, 0.24);
          background:
            radial-gradient(circle at top left, rgba(155, 232, 190, 0.22), transparent 34%),
            rgba(244, 255, 249, 0.86);
        }

        .organisation-step-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .organisation-step-icon {
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

        .organisation-step-complete .organisation-step-icon {
          background: rgba(34, 124, 78, 0.12);
          box-shadow: inset 0 0 0 1px rgba(34, 124, 78, 0.14);
        }

        .organisation-step-copy {
          display: grid;
          gap: 7px;
          min-width: 0;
        }

        .organisation-step-kicker {
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

        .organisation-step-kicker span {
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

        .organisation-step-complete .organisation-step-kicker,
        .organisation-step-complete .organisation-step-kicker span {
          color: #145c38;
        }

        .organisation-step-complete .organisation-step-kicker span {
          background: rgba(34, 124, 78, 0.12);
        }

        .organisation-step-copy h2 {
          margin: 0;
          color: #315f48;
          font-size: clamp(1.22rem, 3vw, 1.55rem);
          font-weight: 950;
          letter-spacing: -0.03em;
          line-height: 1.12;
        }

        .organisation-step-copy p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.45;
        }

        .organisation-step-body {
          display: grid;
          gap: 16px;
        }

        .organisation-logo-upload-section {
          display: grid;
          gap: 16px;
          padding: 18px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 14px 34px rgba(33, 56, 48, 0.06);
        }

        .organisation-logo-upload-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
        }

        .organisation-logo-upload-heading > span {
          display: inline-flex;
          width: 52px;
          height: 52px;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.55rem;
        }

        .organisation-logo-upload-heading h2 {
          margin: 0 0 6px;
          color: #315f48;
          font-size: 1.2rem;
          font-weight: 950;
          letter-spacing: -0.025em;
          line-height: 1.1;
        }

        .organisation-logo-upload-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.42;
        }

        .field-helper {
          display: block;
          margin-top: 8px;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 750;
          line-height: 1.38;
        }

        .organisation-profile-page input[type="file"] {
          width: 100%;
          min-height: 52px;
          padding: 12px;
          border: 1px dashed rgba(83, 111, 99, 0.34);
          border-radius: 18px;
          background: rgba(244, 255, 249, 0.64);
          color: #35453f;
          font: inherit;
          font-weight: 750;
        }

        .organisation-profile-page input[type="file"]::file-selector-button {
          min-height: 38px;
          margin-right: 12px;
          padding: 8px 13px;
          border: 1px solid rgba(83, 111, 99, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          color: #536f63;
          cursor: pointer;
          font: inherit;
          font-weight: 900;
        }

        @media (max-width: 1180px) {
          .organisation-form-guide-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .organisation-safety-card,
          .organisation-logo-upload-heading,
          .organisation-form-guide-heading,
          .organisation-step-heading {
            grid-template-columns: 1fr;
          }

          .organisation-safety-card,
          .organisation-form-guide,
          .organisation-step-section {
            padding: 18px;
            border-radius: 24px;
          }

          .organisation-safety-icon,
          .organisation-form-guide-heading > span,
          .organisation-step-icon {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .organisation-logo-preview {
            min-height: 104px;
          }

          .organisation-form-guide-grid {
            grid-template-columns: 1fr;
          }

          .organisation-guide-step {
            min-height: 0;
          }

          .organisation-logo-upload-section {
            padding: 16px;
            border-radius: 22px;
          }

          .organisation-profile-page input[type="file"]::file-selector-button {
            display: block;
            width: 100%;
            margin: 0 0 10px;
          }
        }
      `}</style>
    </main>
  );
}
