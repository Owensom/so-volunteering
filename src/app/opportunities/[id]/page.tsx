import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import {
  getOpportunityMatch,
  getOpportunityMatchCardIcon,
  getOpportunityMatchToneClass,
} from "@/lib/opportunity-matching";
import { expressInterest, removeInterestFromOpportunity } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type VolunteerProfile = {
  goals: string[] | null;
  interests: string[] | null;
  skills: string[] | null;
  support_needs: string | null;
  availability_notes: string | null;
  volunteering_preference: string | null;
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

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function formatSafeLocation(opportunity: Opportunity) {
  if (opportunity.location_type === "remote") {
    return "Remote / online";
  }

  const safeParts = [
    opportunity.location_town_city,
    opportunity.location_area,
  ].filter((value): value is string => Boolean(value && value.trim()));

  if (safeParts.length > 0) {
    return safeParts.join(" · ");
  }

  if (opportunity.location?.trim()) {
    return opportunity.location.trim();
  }

  if (opportunity.location_type === "hybrid") {
    return "Hybrid location to be confirmed";
  }

  return "Location to be confirmed";
}

function getVenueDisplay(opportunity: Opportunity) {
  if (opportunity.location_type === "remote") {
    return "No venue needed for remote roles.";
  }

  if (opportunity.hide_exact_location === true) {
    return "Exact venue shared after the organisation contacts or accepts you.";
  }

  if (opportunity.location_venue?.trim()) {
    return opportunity.location_venue.trim();
  }

  return "Venue not listed yet.";
}

function getPostcodeDisplay(opportunity: Opportunity) {
  if (opportunity.location_type === "remote") {
    return "";
  }

  if (opportunity.hide_exact_location === true) {
    return "Postcode shared later if needed.";
  }

  if (opportunity.location_postcode?.trim()) {
    return opportunity.location_postcode.trim();
  }

  return "";
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
    .select(
      "goals,interests,skills,support_needs,availability_notes,volunteering_preference",
    )
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
      "id,title,summary,location_type,location,location_town_city,location_area,location_venue,location_postcode,travel_notes,accessibility_notes,hide_exact_location,time_commitment,interests,skills,support_offered,contact_name,contact_email,safety_notes,status",
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

  const match = getOpportunityMatch(volunteerProfile, opportunity);
  const matchToneClass = getOpportunityMatchToneClass(match.tone);
  const matchIcon = getOpportunityMatchCardIcon(match.tone);
  const visibleReasons = simpleView ? match.reasons.slice(0, 2) : match.reasons;

  const postcodeDisplay = getPostcodeDisplay(opportunity);

  const listenText = simpleView
    ? "You are on an opportunity details page. Read the role. The location card shows safe location information. The match card explains why it may suit you. If it feels right, go to the Interest section and press I’m interested."
    : "You are on an opportunity details page. First, read the role title and short description at the top. The location section shows safe location information, travel notes and accessibility notes where the organisation has provided them. Exact venue or postcode details may be hidden until the organisation has contacted or accepted a volunteer. The Why this may suit you card explains the match using your interests, skills, volunteering preference and support information. If the role feels right for you, go to the Interest section and press I’m interested.";

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
                {matchIcon}
              </span>
              <div>
                <h2>{simpleView ? match.shortLabel : match.label}</h2>
                <p>{match.summary}</p>
              </div>
            </div>

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
          className="match-detail-panel"
          aria-labelledby="match-detail-title"
        >
          <div className={`match-detail-card ${matchToneClass}`}>
            <div className="match-detail-heading">
              <span className="match-detail-icon" aria-hidden="true">
                {matchIcon}
              </span>

              <div>
                <p className="dashboard-kicker">Role match</p>
                <h2 id="match-detail-title">Why this may suit you</h2>
                <p>{match.summary}</p>
              </div>
            </div>

            <div className="match-reason-list" aria-label="Match reasons">
              {visibleReasons.map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>

            {!simpleView ? (
              <p className="match-helper-note">
                This is a guide only. You can still choose any role that feels
                interesting, safe and realistic for you.
              </p>
            ) : null}
          </div>
        </section>

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
              Area: <strong>{formatSafeLocation(opportunity)}</strong>
            </p>
            <p>
              Venue: <strong>{getVenueDisplay(opportunity)}</strong>
            </p>
            {postcodeDisplay ? (
              <p>
                Postcode: <strong>{postcodeDisplay}</strong>
              </p>
            ) : null}
            {opportunity.hide_exact_location === true ? (
              <p className="safe-location-note">
                🔒 Exact location details are protected until the organisation
                contacts or accepts a volunteer.
              </p>
            ) : null}
          </DetailCard>

          <DetailCard icon="🕒" label="Time" title="Time commitment">
            <p>
              <strong>
                {opportunity.time_commitment || "Time commitment not listed"}
              </strong>
            </p>
          </DetailCard>

          {!simpleView && (hasText(opportunity.travel_notes) || hasText(opportunity.accessibility_notes)) ? (
            <DetailCard
              icon="🚌"
              label="Travel and access"
              title="Planning your first visit"
            >
              {opportunity.travel_notes ? (
                <p>
                  <strong>Travel:</strong> {opportunity.travel_notes}
                </p>
              ) : null}
              {opportunity.accessibility_notes ? (
                <p>
                  <strong>Accessibility:</strong>{" "}
                  {opportunity.accessibility_notes}
                </p>
              ) : null}
            </DetailCard>
          ) : null}

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

        .match-detail-panel {
          display: grid;
        }

        .match-detail-card {
          display: grid;
          gap: 16px;
          padding: clamp(18px, 4vw, 24px);
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 18px 56px rgba(38, 50, 56, 0.07);
        }

        .match-detail-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .match-detail-icon {
          display: inline-flex;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.9rem;
        }

        .match-detail-heading h2 {
          margin: 2px 0 8px;
          color: #315f48;
          font-size: clamp(1.35rem, 3vw, 1.85rem);
          letter-spacing: -0.035em;
        }

        .match-detail-heading p {
          margin: 0;
          color: #60706a;
          line-height: 1.52;
          font-weight: 750;
        }

        .match-reason-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .match-reason-list span {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          padding: 7px 11px;
          border: 1px solid rgba(83, 111, 99, 0.16);
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.86);
          color: #536f63;
          font-size: 0.84rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .match-helper-note {
          margin: 0;
          color: #60706a;
          font-weight: 750;
          line-height: 1.45;
        }

        .match-tone-strong {
          border-color: rgba(83, 111, 99, 0.28);
          background: rgba(244, 255, 249, 0.96);
        }

        .match-tone-good {
          border-color: rgba(74, 112, 160, 0.22);
          background: rgba(243, 249, 255, 0.9);
        }

        .match-tone-explore {
          border-color: rgba(108, 92, 160, 0.16);
          background: rgba(248, 245, 255, 0.82);
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

        .safe-location-note {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          padding: 10px 12px;
          border: 1px solid rgba(83, 111, 99, 0.16);
          border-radius: 16px;
          background: rgba(244, 255, 249, 0.82);
          color: #536f63;
          font-weight: 850;
          line-height: 1.35;
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
        .preference-text-large .dashboard-progress-note,
        .preference-text-large .match-detail-heading p,
        .preference-text-large .match-helper-note {
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
        .preference-theme-calm_green .dashboard-progress-card,
        .preference-theme-calm_green .match-detail-card {
          border-color: rgba(83, 111, 99, 0.2);
        }

        .preference-theme-calm_green .dashboard-card-icon,
        .preference-theme-calm_green .dashboard-progress-icon,
        .preference-theme-calm_green .match-detail-icon {
          background: rgba(226, 255, 239, 0.86);
        }

        .preference-theme-soft_blue {
          background:
            radial-gradient(circle at top left, rgba(197, 226, 255, 0.62), transparent 34%),
            linear-gradient(135deg, #f3f9ff 0%, #f8fbff 48%, #fffaf2 100%);
        }

        .preference-theme-soft_blue .dashboard-welcome-card,
        .preference-theme-soft_blue .info-card,
        .preference-theme-soft_blue .dashboard-progress-card,
        .preference-theme-soft_blue .match-detail-card {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .preference-theme-soft_blue .dashboard-card-icon,
        .preference-theme-soft_blue .dashboard-progress-icon,
        .preference-theme-soft_blue .match-detail-icon {
          background: rgba(231, 244, 255, 0.92);
        }

        .preference-theme-warm_peach {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 184, 0.58), transparent 34%),
            linear-gradient(135deg, #fff8f1 0%, #fffaf6 48%, #f7fff8 100%);
        }

        .preference-theme-warm_peach .dashboard-welcome-card,
        .preference-theme-warm_peach .info-card,
        .preference-theme-warm_peach .dashboard-progress-card,
        .preference-theme-warm_peach .match-detail-card {
          border-color: rgba(190, 118, 76, 0.2);
        }

        .preference-theme-warm_peach .dashboard-card-icon,
        .preference-theme-warm_peach .dashboard-progress-icon,
        .preference-theme-warm_peach .match-detail-icon {
          background: rgba(255, 239, 226, 0.92);
        }

        .preference-theme-high_contrast {
          background: #f8fafc;
        }

        .preference-theme-high_contrast .dashboard-welcome-card,
        .preference-theme-high_contrast .info-card,
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .opportunity-chip,
        .preference-theme-high_contrast .supporting-statement-box,
        .preference-theme-high_contrast .match-detail-card,
        .preference-theme-high_contrast .match-reason-list span,
        .preference-theme-high_contrast .safe-location-note {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .match-detail-heading h2 {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .opportunity-detail-body,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .dashboard-muted-action,
        .preference-theme-high_contrast .opportunity-chip,
        .preference-theme-high_contrast .match-detail-heading p,
        .preference-theme-high_contrast .match-helper-note,
        .preference-theme-high_contrast .match-reason-list span,
        .preference-theme-high_contrast .safe-location-note {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-card-icon,
        .preference-theme-high_contrast .dashboard-progress-icon,
        .preference-theme-high_contrast .match-detail-icon {
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
        .preference-theme-neon_arcade .supporting-statement-box,
        .preference-theme-neon_arcade .match-detail-card {
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
        .preference-theme-neon_arcade .opportunity-detail-body strong,
        .preference-theme-neon_arcade .match-detail-heading h2 {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-card-label,
        .preference-theme-neon_arcade .opportunity-detail-body,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .dashboard-muted-action,
        .preference-theme-neon_arcade .match-detail-heading p,
        .preference-theme-neon_arcade .match-helper-note {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-card-icon,
        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .match-detail-icon {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .opportunity-chip,
        .preference-theme-neon_arcade .text-link,
        .preference-theme-neon_arcade .match-reason-list span,
        .preference-theme-neon_arcade .safe-location-note {
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
          .match-detail-heading {
            grid-template-columns: 1fr;
          }

          .match-detail-card {
            border-radius: 24px;
          }

          .match-detail-icon {
            width: 58px;
            height: 58px;
          }

          .match-reason-list span {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .opportunity-detail-card {
            min-height: 0;
          }

          .opportunity-detail-copy {
            gap: 14px;
          }

          .opportunity-chip-list {
            gap: 8px;
          }

          .opportunity-chip,
          .safe-location-note {
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
