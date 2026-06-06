import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { expressInterest, removeInterestFromOpportunity } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type VolunteerProfile = {
  interests: string[] | null;
  skills: string[] | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
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

type ExistingInterest = {
  id: string;
  status: string;
  message: string | null;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseViewMode(value: string | null | undefined) {
  if (value === "simple" || value === "detailed") return value;
  return "standard";
}

function normaliseColourTheme(value: string | null | undefined) {
  if (
    value === "calm_green" ||
    value === "soft_blue" ||
    value === "warm_peach" ||
    value === "high_contrast" ||
    value === "neon_arcade"
  ) {
    return value;
  }

  return "default";
}

function normaliseTextSize(value: string | null | undefined) {
  return value === "large" ? "large" : "standard";
}

function normaliseAvatarIcon(value: string | null | undefined) {
  return value && value.trim() ? value : "🌱";
}

function normaliseListenMode(value: string | null | undefined) {
  return value === "context" ? "context" : "always";
}

function normaliseInterestStatus(status: string | null | undefined) {
  if (
    status === "new" ||
    status === "contacted" ||
    status === "accepted" ||
    status === "closed"
  ) {
    return status;
  }

  if (status === "reviewed") {
    return "contacted";
  }

  return "new";
}

function getThemeClass(colourTheme: string) {
  return `preference-theme-${colourTheme}`;
}

function getTextClass(textSize: string) {
  return textSize === "large"
    ? "preference-text-large"
    : "preference-text-standard";
}

function getViewClass(viewMode: string) {
  return `preference-view-${viewMode}`;
}

function getViewLabel(viewMode: string) {
  if (viewMode === "simple") return "Simple view";
  if (viewMode === "detailed") return "Detailed view";
  return "Standard view";
}

function getThemeLabel(colourTheme: string) {
  if (colourTheme === "calm_green") return "Calm green";
  if (colourTheme === "soft_blue") return "Soft blue";
  if (colourTheme === "warm_peach") return "Warm peach";
  if (colourTheme === "high_contrast") return "High contrast";
  if (colourTheme === "neon_arcade") return "Neon arcade";
  return "SO default";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote / online";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

function formatInterestStatus(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "Accepted";
  if (normalisedStatus === "contacted") return "Contacted";
  if (normalisedStatus === "closed") return "Closed";
  return "Sent";
}

function getInterestHelpText(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") {
    return "The organisation would like to move forward with you.";
  }

  if (normalisedStatus === "contacted") {
    return "The organisation has marked this as contacted.";
  }

  if (normalisedStatus === "closed") {
    return "This role is not progressing at the moment.";
  }

  return "Your interest has been sent to the organisation.";
}

function countMatches(
  volunteerValues: string[] | null | undefined,
  opportunityValues: string[] | null | undefined,
) {
  if (!Array.isArray(volunteerValues) || !Array.isArray(opportunityValues)) {
    return 0;
  }

  const volunteerSet = new Set(
    volunteerValues.map((value) => value.trim().toLowerCase()),
  );

  return opportunityValues.filter((value) =>
    volunteerSet.has(value.trim().toLowerCase()),
  ).length;
}

function ChipList({
  values,
  emptyText,
}: {
  values: string[] | null | undefined;
  emptyText: string;
}) {
  if (!Array.isArray(values) || values.length === 0) {
    return <p className="dashboard-muted-action">{emptyText}</p>;
  }

  return (
    <div className="opportunity-chip-list">
      {values.map((value) => (
        <span key={value} className="opportunity-chip">
          {value}
        </span>
      ))}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  title,
  children,
}: {
  icon: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="info-card dashboard-pathway-card opportunity-detail-card">
      <div
        className="dashboard-card-icon opportunity-detail-icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="dashboard-card-copy opportunity-detail-copy">
        <div>
          <p className="dashboard-card-label">{label}</p>
          <h2>{title}</h2>
        </div>

        <div className="opportunity-detail-body">{children}</div>
      </div>
    </article>
  );
}

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const opportunityId = resolvedParams.id;

  const errorMessage = resolvedSearchParams.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : "";

  const successMessage = resolvedSearchParams.message
    ? decodeURIComponent(resolvedSearchParams.message)
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
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  const { data: volunteerProfile } = await supabase
    .from("volunteer_profiles")
    .select("interests,skills")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const { data: preferences } = await supabase
    .from("volunteer_preferences")
    .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerPreferences>();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id,title,summary,location_type,location,time_commitment,interests,skills,support_offered,contact_name,contact_email,safety_notes,status",
    )
    .eq("id", opportunityId)
    .eq("status", "published")
    .maybeSingle<Opportunity>();

  if (!opportunity) {
    redirect("/opportunities");
  }

  const { data: existingInterest } = await supabase
    .from("opportunity_interests")
    .select("id,status,message")
    .eq("opportunity_id", opportunity.id)
    .eq("volunteer_user_id", user.id)
    .maybeSingle<ExistingInterest>();

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";
  const hasAlreadyExpressedInterest = Boolean(existingInterest);

  const interestMatches = countMatches(
    volunteerProfile?.interests,
    opportunity.interests,
  );

  const skillMatches = countMatches(volunteerProfile?.skills, opportunity.skills);

  const listenText = simpleView
    ? "You are on an opportunity details page. Read the role. If it feels right, go to the Interest section and press I’m interested. If you have already expressed interest, you can remove it."
    : "You are on an opportunity details page. First, read the role title and short description at the top. Use the Back to roles button if you want to return to the opportunity list. The cards below explain where the role happens, the time commitment, interests, helpful skills, support available, safety notes and contact details. If the role feels right for you, go to the Interest section. If you have not expressed interest yet, you can press I’m interested. You can leave the supporting statement blank, write a short message, or write a fuller statement. If you have already expressed interest, this page will show Interest expressed and you can remove your interest if you no longer want the organisation to see it. The What happens next card explains what the organisation can see and what you can do later.";

  const shellClassName = [
    "dashboard-bg",
    "opportunity-detail-page",
    getThemeClass(colourTheme),
    getTextClass(textSize),
    getViewClass(viewMode),
  ].join(" ");

  return (
    <main className={shellClassName}>
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/dashboard"
            className="dashboard-brand"
            aria-label="Back to SO Volunteering dashboard"
          >
            <img
              src="/brand/so-volunteering-logo-mark.png"
              alt=""
              className="dashboard-brand-mark"
              aria-hidden="true"
            />
            <span className="dashboard-brand-text">
              <span className="dashboard-brand-name">SO Volunteering</span>
              <span className="dashboard-brand-tagline">
                Belong • Grow • Thrive
              </span>
            </span>
          </Link>

          <div className="dashboard-topbar-actions">
            {listenMode === "always" || listenMode === "context" ? (
              <InclusiveAudioButton text={listenText} />
            ) : null}

            <Link
              href="/opportunities"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Opportunities</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="opportunity-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Opportunity details</p>

            <h1 id="opportunity-title" className="dashboard-title">
              <span aria-hidden="true">{avatarIcon}</span>
              <span>{opportunity.title}</span>
            </h1>

            <p className="dashboard-lead">{opportunity.summary}</p>

            <div className="dashboard-primary-actions">
              <a
                href="#express-interest"
                className={
                  hasAlreadyExpressedInterest
                    ? "secondary-button dashboard-main-action"
                    : "primary-button dashboard-main-action"
                }
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">
                    {hasAlreadyExpressedInterest ? "✅" : "🌱"}
                  </span>
                  <span>
                    {hasAlreadyExpressedInterest
                      ? "Interest expressed"
                      : "Express interest"}
                  </span>
                </span>
              </a>

              <Link
                href="/opportunities"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🔎</span>
                  <span>Back to roles</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Match summary">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {avatarIcon}
              </span>
              <div>
                <h2>May suit you</h2>
                <p>
                  {interestMatches + skillMatches > 0
                    ? simpleView
                      ? "This role has matches."
                      : "This role has some profile matches."
                    : "Read the details and decide if it feels right."}
                </p>
              </div>
            </div>

            {!simpleView ? (
              <>
                <p className="dashboard-progress-note">
                  Interest matches: <strong>{interestMatches}</strong>
                </p>
                <p className="dashboard-progress-note">
                  Skill matches: <strong>{skillMatches}</strong>
                </p>
              </>
            ) : null}

            {existingInterest ? (
              <>
                <p className="dashboard-progress-note">
                  Your status:{" "}
                  <strong>{formatInterestStatus(existingInterest.status)}</strong>
                </p>
                {!simpleView ? (
                  <p className="dashboard-progress-note">
                    {getInterestHelpText(existingInterest.status)}
                  </p>
                ) : null}
              </>
            ) : null}

            {detailedView ? (
              <p className="dashboard-progress-note">
                App view: <strong>{getViewLabel(viewMode)}</strong> · Theme:{" "}
                <strong>{getThemeLabel(colourTheme)}</strong>
              </p>
            ) : null}
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <section
          className="dashboard-grid opportunity-detail-grid"
          aria-label="Opportunity information"
        >
          <DetailCard icon="📍" label="Location" title="Where it happens">
            <p>
              Type:{" "}
              <strong>{formatLocationType(opportunity.location_type)}</strong>
            </p>
            <p>
              Area:{" "}
              <strong>
                {opportunity.location || "No specific location listed"}
              </strong>
            </p>
          </DetailCard>

          <DetailCard icon="🕒" label="Time" title="Time commitment">
            <p>
              <strong>
                {opportunity.time_commitment || "Time commitment not listed"}
              </strong>
            </p>
          </DetailCard>

          <DetailCard icon="💚" label="Interests" title="This role may suit">
            <ChipList
              values={opportunity.interests}
              emptyText="No interests listed for this role."
            />
          </DetailCard>

          <DetailCard icon="⭐" label="Skills" title="Helpful skills">
            <ChipList
              values={opportunity.skills}
              emptyText="No skills listed for this role."
            />
          </DetailCard>

          <DetailCard icon="💛" label="Support" title="Support available">
            <ChipList
              values={opportunity.support_offered}
              emptyText="No support information listed yet."
            />
          </DetailCard>

          {!simpleView ? (
            <DetailCard icon="🛡️" label="Safety" title="Safety and supervision">
              {opportunity.safety_notes ? (
                <p>{opportunity.safety_notes}</p>
              ) : (
                <p className="dashboard-muted-action">
                  No safety notes listed yet.
                </p>
              )}
            </DetailCard>
          ) : null}

          {!simpleView ? (
            <DetailCard icon="👤" label="Contact" title="Who to contact">
              <p>
                Name:{" "}
                <strong>
                  {opportunity.contact_name || "Contact name not listed"}
                </strong>
              </p>
              <p>
                Email:{" "}
                <strong>
                  {opportunity.contact_email || "Contact email not listed"}
                </strong>
              </p>
            </DetailCard>
          ) : null}

          <DetailCard icon="🧭" label="Next steps" title="What happens next?">
            <p>
              If you express interest, the organisation can see your interest in
              their inbox.
            </p>
            {!simpleView ? (
              <>
                <p>
                  They can review your profile summary, your skills and your
                  supporting statement if you write one.
                </p>
                <p>
                  They may contact you outside the platform for now, using the
                  email saved on your profile.
                </p>
              </>
            ) : null}
            <p>
              You can remove your interest later if the role no longer feels
              right.
            </p>
          </DetailCard>

          <article
            id="express-interest"
            className="info-card dashboard-pathway-card opportunity-detail-card"
          >
            <div
              className="dashboard-card-icon opportunity-detail-icon"
              aria-hidden="true"
            >
              {hasAlreadyExpressedInterest ? "✅" : "🌱"}
            </div>

            <div className="dashboard-card-copy opportunity-detail-copy">
              <div>
                <p className="dashboard-card-label">Interest</p>
                <h2>
                  {hasAlreadyExpressedInterest
                    ? "Interest expressed"
                    : "Express interest"}
                </h2>
              </div>

              <div className="opportunity-detail-body">
                {hasAlreadyExpressedInterest && existingInterest ? (
                  <>
                    <p>
                      You have already told this organisation you are interested
                      in this role.
                    </p>

                    <p>
                      Current status:{" "}
                      <strong>
                        {formatInterestStatus(existingInterest.status)}
                      </strong>
                    </p>

                    {!simpleView ? (
                      <p>{getInterestHelpText(existingInterest.status)}</p>
                    ) : null}

                    {existingInterest.message ? (
                      <div className="supporting-statement-box">
                        <p className="dashboard-card-label">
                          Your supporting statement
                        </p>
                        <p>{existingInterest.message}</p>
                      </div>
                    ) : null}

                    <div className="interest-management-actions">
                      <Link href="/my-interests" className="text-link">
                        View roles I am interested in
                      </Link>

                      <form action={removeInterestFromOpportunity}>
                        <input
                          type="hidden"
                          name="interest_id"
                          value={existingInterest.id}
                        />
                        <input
                          type="hidden"
                          name="opportunity_id"
                          value={opportunity.id}
                        />
                        <button type="submit" className="remove-interest-button">
                          Remove interest
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <form action={expressInterest} className="form-stack">
                    <input
                      type="hidden"
                      name="opportunity_id"
                      value={opportunity.id}
                    />

                    <label className="field-label">
                      <span className="field-label-row">
                        <span className="field-label-icon" aria-hidden="true">
                          💬
                        </span>
                        <span>
                          {simpleView
                            ? "Optional message"
                            : "Optional supporting statement"}
                        </span>
                      </span>
                      <textarea
                        name="message"
                        rows={simpleView ? 3 : 4}
                        placeholder={
                          simpleView
                            ? "Optional. You can leave this blank."
                            : "Optional. You can leave this blank, write a short message, or add a fuller supporting statement explaining why you are interested."
                        }
                      />
                    </label>

                    <button type="submit" className="primary-button">
                      <span className="button-balanced-inner">
                        <span aria-hidden="true">🌱</span>
                        <span>I’m interested</span>
                      </span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </article>
        </section>
      </section>

      <style>{`
        .opportunity-detail-page,
        .opportunity-detail-page * {
          box-sizing: border-box;
        }

        .opportunity-detail-page .dashboard-grid {
          align-items: stretch;
        }

        .opportunity-detail-page .dashboard-pathway-card {
          height: 100%;
          align-items: stretch;
        }

        .opportunity-detail-grid {
          align-items: stretch;
        }

        .opportunity-detail-card {
          min-height: 210px;
          height: 100%;
          align-items: stretch;
        }

        .opportunity-detail-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          gap: 18px;
        }

        .opportunity-detail-copy h2 {
          overflow-wrap: anywhere;
        }

        .opportunity-detail-body {
          display: grid;
          gap: 10px;
          color: #5d6677;
          line-height: 1.55;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .opportunity-detail-body p {
          margin: 0;
        }

        .opportunity-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-start;
        }

        .opportunity-chip {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          max-width: 100%;
          padding: 9px 12px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #536f63;
          font-size: 0.88rem;
          font-weight: 800;
          line-height: 1.2;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .supporting-statement-box {
          display: grid;
          gap: 6px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
        }

        .interest-management-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          padding-top: 6px;
        }

        .remove-interest-button {
          appearance: none;
          border: 1px solid rgba(190, 80, 80, 0.28);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          color: #9b3d3d;
          cursor: pointer;
          font: inherit;
          font-size: 0.9rem;
          font-weight: 850;
          min-height: 44px;
          padding: 10px 16px;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
        }

        .remove-interest-button:hover {
          background: rgba(255, 245, 245, 0.98);
          border-color: rgba(190, 80, 80, 0.42);
        }

        .remove-interest-button:focus-visible {
          outline: 4px solid rgba(190, 80, 80, 0.22);
          outline-offset: 3px;
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .opportunity-detail-body,
        .preference-text-large .dashboard-progress-note {
          font-size: 1.04em;
        }

        .preference-text-large .dashboard-title {
          letter-spacing: -0.035em;
        }

        .preference-view-simple .dashboard-grid {
          gap: 18px;
        }

        .preference-view-simple .opportunity-detail-card {
          min-height: 190px;
        }

        .preference-view-simple .dashboard-card-icon {
          font-size: 2rem;
        }

        .preference-view-detailed .opportunity-detail-card {
          min-height: 230px;
        }

        .preference-theme-calm_green {
          background:
            radial-gradient(circle at top left, rgba(200, 243, 221, 0.58), transparent 34%),
            linear-gradient(135deg, #f3fff8 0%, #f7fbf5 46%, #fffaf2 100%);
        }

        .preference-theme-calm_green .dashboard-welcome-card,
        .preference-theme-calm_green .info-card,
        .preference-theme-calm_green .dashboard-progress-card {
          border-color: rgba(83, 111, 99, 0.2);
        }

        .preference-theme-calm_green .dashboard-card-icon,
        .preference-theme-calm_green .dashboard-progress-icon {
          background: rgba(226, 255, 239, 0.86);
        }

        .preference-theme-soft_blue {
          background:
            radial-gradient(circle at top left, rgba(197, 226, 255, 0.62), transparent 34%),
            linear-gradient(135deg, #f3f9ff 0%, #f8fbff 48%, #fffaf2 100%);
        }

        .preference-theme-soft_blue .dashboard-welcome-card,
        .preference-theme-soft_blue .info-card,
        .preference-theme-soft_blue .dashboard-progress-card {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .preference-theme-soft_blue .dashboard-card-icon,
        .preference-theme-soft_blue .dashboard-progress-icon {
          background: rgba(231, 244, 255, 0.92);
        }

        .preference-theme-warm_peach {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.58), transparent 34%),
            linear-gradient(135deg, #fff8f1 0%, #fffaf6 48%, #f7fff8 100%);
        }

        .preference-theme-warm_peach .dashboard-welcome-card,
        .preference-theme-warm_peach .info-card,
        .preference-theme-warm_peach .dashboard-progress-card {
          border-color: rgba(190, 118, 76, 0.2);
        }

        .preference-theme-warm_peach .dashboard-card-icon,
        .preference-theme-warm_peach .dashboard-progress-icon {
          background: rgba(255, 239, 226, 0.92);
        }

        .preference-theme-high_contrast {
          background: #f8fafc;
        }

        .preference-theme-high_contrast .dashboard-welcome-card,
        .preference-theme-high_contrast .info-card,
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .opportunity-chip,
        .preference-theme-high_contrast .supporting-statement-box {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2 {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .opportunity-detail-body,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .dashboard-muted-action,
        .preference-theme-high_contrast .opportunity-chip {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-card-icon,
        .preference-theme-high_contrast .dashboard-progress-icon {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
        }

        .preference-theme-neon_arcade {
          background:
            radial-gradient(circle at top left, rgba(34, 211, 238, 0.28), transparent 34%),
            radial-gradient(circle at top right, rgba(217, 70, 239, 0.24), transparent 30%),
            linear-gradient(135deg, #101827 0%, #15132c 46%, #071827 100%);
        }

        .preference-theme-neon_arcade .dashboard-welcome-card,
        .preference-theme-neon_arcade .dashboard-progress-card,
        .preference-theme-neon_arcade .info-card,
        .preference-theme-neon_arcade .supporting-statement-box {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .dashboard-title,
        .preference-theme-neon_arcade .dashboard-card-copy h2,
        .preference-theme-neon_arcade .dashboard-progress-card h2,
        .preference-theme-neon_arcade .dashboard-progress-note strong,
        .preference-theme-neon_arcade .opportunity-detail-body strong {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-card-label,
        .preference-theme-neon_arcade .opportunity-detail-body,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .dashboard-muted-action {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-card-icon,
        .preference-theme-neon_arcade .dashboard-progress-icon {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .opportunity-chip,
        .preference-theme-neon_arcade .text-link {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
        }

        .preference-theme-neon_arcade .remove-interest-button {
          border-color: rgba(248, 113, 113, 0.5);
          background: rgba(127, 29, 29, 0.28);
          color: #fecaca;
        }

        @media (max-width: 640px) {
          .opportunity-detail-card {
            min-height: 0;
          }

          .opportunity-detail-copy {
            gap: 14px;
          }

          .opportunity-chip-list {
            gap: 8px;
          }

          .opportunity-chip {
            width: 100%;
            justify-content: center;
            border-radius: 18px;
            font-size: 0.86rem;
            text-align: center;
          }

          .interest-management-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .remove-interest-button {
            width: 100%;
          }

          .preference-text-large {
            font-size: 1.03rem;
          }

          .preference-view-simple .opportunity-detail-card,
          .preference-view-detailed .opportunity-detail-card {
            min-height: 0;
          }
        }
      `}</style>
    </main>
  );
}
