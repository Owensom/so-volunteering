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

  const listenText =
    "This is the organisation profile setup page. Add your organisation name, logo, contact email, location, purpose, volunteering types, support available, and safety notes. The logo helps volunteers recognise your organisation. SO Volunteering and organisations using this platform will never ask volunteers for money, bank details, passwords, or a full home address. Required fields are organisation name, contact email, location, purpose, at least one volunteering type, and at least one support option. The final button says Save organisation profile.";

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
                  Tell volunteers about your organisation
                </h1>
                <p className="onboarding-lead">
                  Keep this clear, welcoming and practical. Volunteers should
                  understand who you are, what you do, and what support they can
                  expect before they apply.
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
              Adding a logo helps volunteers recognise your organisation and
              feel safer when reviewing roles.
            </p>
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
              ask volunteers for money, bank details, passwords, or their full
              home address. If anyone asks for these, volunteers should stop and
              use Help using the app to report it.
            </p>
          </div>
        </section>

        <form action={saveOrganisationProfile} className="form-stack">
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

          <label className="field-label">
            <span className="field-label-row">
              <span className="field-label-icon" aria-hidden="true">
                🖼️
              </span>
              <span>Organisation logo URL optional</span>
            </span>
            <input
              name="logo_url"
              type="url"
              defaultValue={currentLogoUrl}
              placeholder="https://example.org/logo.png"
            />
            <span className="field-helper">
              Use a public image URL beginning with https://. This will later
              appear on volunteer-facing role pages to help volunteers recognise
              your organisation.
            </span>
          </label>

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

          <button
            type="submit"
            className="primary-button onboarding-submit-button"
          >
            <span className="button-balanced-inner">
              <span aria-hidden="true">✅</span>
              <span>Save organisation profile</span>
            </span>
          </button>
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

        .field-helper {
          display: block;
          margin-top: 8px;
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 750;
          line-height: 1.38;
        }

        @media (max-width: 760px) {
          .organisation-safety-card {
            grid-template-columns: 1fr;
            padding: 18px;
            border-radius: 24px;
          }

          .organisation-safety-icon {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .organisation-logo-preview {
            min-height: 104px;
          }
        }
      `}</style>
    </main>
  );
}
