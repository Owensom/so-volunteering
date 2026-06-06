import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { removeInterest } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type VolunteerPreferences = {
  view_mode: string | null;
  colour_theme: string | null;
  text_size: string | null;
  avatar_icon: string | null;
  listen_mode: string | null;
};

type InterestRow = {
  id: string;
  opportunity_id: string;
  organisation_user_id: string;
  message: string | null;
  status: string;
  created_at: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  summary: string;
  location_type: string;
  location: string | null;
  location_town_city: string | null;
  location_area: string | null;
  location_venue: string | null;
  location_postcode: string | null;
  hide_exact_location: boolean | null;
  time_commitment: string | null;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
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

  if (status === "review" || status === "reviewed") {
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

function formatStatus(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "Accepted";
  if (normalisedStatus === "contacted") return "Contacted";
  if (normalisedStatus === "closed") return "Closed";
  return "New interest";
}

function statusIcon(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "✅";
  if (normalisedStatus === "contacted") return "📬";
  if (normalisedStatus === "closed") return "🌙";
  return "🌱";
}

function statusHelp(status: string | null | undefined, simpleView: boolean) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") {
    return simpleView
      ? "The organisation would like to move forward."
      : "Good news. The organisation has marked your interest as accepted and would like to move forward with you.";
  }

  if (normalisedStatus === "contacted") {
    return simpleView
      ? "The organisation has contacted you."
      : "The organisation has marked this as contacted. Check your email or any contact method you shared.";
  }

  if (normalisedStatus === "closed") {
    return simpleView
      ? "This role is not progressing."
      : "This role is not progressing at the moment. This does not mean you did anything wrong. You can keep looking for another role that feels right.";
  }

  return simpleView
    ? "Waiting for the organisation."
    : "Your interest has been sent to the organisation. They can review it, contact you, accept it, or close it.";
}

function statusToneClass(status: string | null | undefined) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "status-panel-accepted";
  if (normalisedStatus === "contacted") return "status-panel-contacted";
  if (normalisedStatus === "closed") return "status-panel-closed";
  return "status-panel-new";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

function formatSafeLocation(opportunity: OpportunityRow) {
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

function formatLocationPrivacy(opportunity: OpportunityRow) {
  if (opportunity.location_type === "remote") {
    return "";
  }

  if (opportunity.hide_exact_location === true) {
    return "Exact venue shared later by the organisation";
  }

  if (opportunity.location_venue?.trim()) {
    return `Venue: ${opportunity.location_venue.trim()}`;
  }

  return "";
}

export default async function MyInterestsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";
  const successMessage = params.message ? decodeURIComponent(params.message) : "";

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

  const { data: preferences } = await supabase
    .from("volunteer_preferences")
    .select("view_mode,colour_theme,text_size,avatar_icon,listen_mode")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerPreferences>();

  const { data: interests } = await supabase
    .from("opportunity_interests")
    .select("id,opportunity_id,organisation_user_id,message,status,created_at")
    .eq("volunteer_user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (interests as InterestRow[] | null) ?? [];
  const opportunityIds = Array.from(
    new Set(rows.map((row) => row.opportunity_id)),
  );

  const { data: opportunities } = opportunityIds.length
    ? await supabase
        .from("opportunities")
        .select(
          "id,title,summary,location_type,location,location_town_city,location_area,location_venue,location_postcode,hide_exact_location,time_commitment,status,contact_name,contact_email",
        )
        .in("id", opportunityIds)
    : { data: [] as OpportunityRow[] };

  const opportunityMap = new Map(
    ((opportunities as OpportunityRow[] | null) ?? []).map((opportunity) => [
      opportunity.id,
      opportunity,
    ]),
  );

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";

  const newCount = rows.filter(
    (row) => normaliseInterestStatus(row.status) === "new",
  ).length;

  const contactedCount = rows.filter(
    (row) => normaliseInterestStatus(row.status) === "contacted",
  ).length;

  const acceptedCount = rows.filter(
    (row) => normaliseInterestStatus(row.status) === "accepted",
  ).length;

  const closedCount = rows.filter(
    (row) => normaliseInterestStatus(row.status) === "closed",
  ).length;

  const listenText = simpleView
    ? "You are on the Roles I am interested in page. This page shows roles you saved. New interest means the organisation has not updated it yet. Contacted means the organisation has contacted you. Accepted means the organisation would like to move forward. Closed means the role is not progressing. Open a role to read it again, or remove interest if you no longer want the organisation to see it."
    : "You are on the Roles I am interested in page. This page tracks roles where you clicked I’m interested. First, check the Role status card on the right to see how many roles are new, contacted, accepted or closed. New interest means your interest has been sent and is waiting for the organisation to act. Contacted means the organisation has marked that they have contacted you. Accepted means the organisation would like to move forward with you. Closed means the role is not progressing at the moment. Each card shows the role title, current status, what the status means, safe location details, your supporting statement if you wrote one, and the role contact if available. Use Open opportunity to return to the role details. Use Remove interest if you no longer want the organisation to see that you are interested.";

  const shellClassName = [
    "dashboard-bg",
    "my-interests-page",
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
              href="/dashboard"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Dashboard</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="my-interests-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Your volunteering roles</p>

            <h1 id="my-interests-title" className="dashboard-title">
              <span aria-hidden="true">{avatarIcon}</span>
              <span>Roles I am interested in</span>
            </h1>

            <p className="dashboard-lead">
              {simpleView
                ? "Track roles you saved."
                : "Track the roles where you clicked “I’m interested”. You can remove an interest at any time if the role no longer feels right."}
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/opportunities"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🔎</span>
                  <span>Find opportunities</span>
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🏠</span>
                  <span>Dashboard</span>
                </span>
              </Link>
            </div>
          </div>

          <aside
            className="dashboard-progress-card"
            aria-label="Role interest status"
          >
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {avatarIcon}
              </span>
              <div>
                <h2>Role status</h2>
                <p>
                  {rows.length} role{rows.length === 1 ? "" : "s"} saved.
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              New interest: <strong>{newCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Contacted: <strong>{contactedCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Accepted: <strong>{acceptedCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Closed: <strong>{closedCount}</strong>
            </p>

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

        {rows.length === 0 ? (
          <section className="dashboard-grid" aria-label="No roles of interest">
            <article className="info-card dashboard-pathway-card my-interest-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                🌱
              </div>

              <div className="dashboard-card-copy my-interest-copy">
                <div className="my-interest-main">
                  <p className="dashboard-card-label">No roles yet</p>
                  <h2>No roles saved</h2>
                  <p>
                    {simpleView
                      ? "Roles you save will appear here."
                      : "When you click “I’m interested” on a volunteering role, it will appear here."}
                  </p>
                </div>

                <Link href="/opportunities" className="dashboard-card-action-pill">
                  Browse opportunities
                </Link>
              </div>
            </article>
          </section>
        ) : (
          <section
            className="dashboard-grid my-interests-grid"
            aria-label="Roles I am interested in"
          >
            {rows.map((interest) => {
              const opportunity = opportunityMap.get(interest.opportunity_id);
              const canOpenOpportunity = opportunity?.status === "published";
              const normalisedStatus = normaliseInterestStatus(interest.status);
              const privacyNote = opportunity
                ? formatLocationPrivacy(opportunity)
                : "";

              return (
                <article
                  key={interest.id}
                  className="info-card dashboard-pathway-card my-interest-card"
                >
                  <div
                    className="dashboard-card-icon my-interest-icon"
                    aria-hidden="true"
                  >
                    {statusIcon(normalisedStatus)}
                  </div>

                  <div className="dashboard-card-copy my-interest-copy">
                    <div className="my-interest-main">
                      <p className="dashboard-card-label">
                        {formatStatus(normalisedStatus)}
                      </p>

                      <h2>{opportunity?.title || "Opportunity"}</h2>

                      {opportunity?.summary ? (
                        <p>{opportunity.summary}</p>
                      ) : (
                        <p className="dashboard-muted-action">
                          This opportunity could not be loaded.
                        </p>
                      )}

                      <div
                        className={`my-interest-status-panel ${statusToneClass(
                          normalisedStatus,
                        )}`}
                      >
                        <p>
                          <strong>{formatStatus(normalisedStatus)}</strong>
                        </p>
                        <p>{statusHelp(normalisedStatus, simpleView)}</p>
                      </div>

                      {opportunity ? (
                        <div className="my-interest-location">
                          <p>
                            <strong>
                              {formatLocationType(opportunity.location_type)}
                            </strong>
                            {" · "}
                            {formatSafeLocation(opportunity)}
                            {opportunity.time_commitment
                              ? ` · ${opportunity.time_commitment}`
                              : ""}
                          </p>

                          {privacyNote && !simpleView ? (
                            <p>{privacyNote}</p>
                          ) : null}
                        </div>
                      ) : null}

                      {!simpleView && interest.message ? (
                        <div className="my-interest-message">
                          <p className="dashboard-card-label">
                            Your supporting statement
                          </p>
                          <p>{interest.message}</p>
                        </div>
                      ) : null}

                      {detailedView &&
                      (opportunity?.contact_name || opportunity?.contact_email) ? (
                        <div className="my-interest-message">
                          <p className="dashboard-card-label">Role contact</p>
                          {opportunity.contact_name ? (
                            <p>{opportunity.contact_name}</p>
                          ) : null}
                          {opportunity.contact_email ? (
                            <p>{opportunity.contact_email}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="my-interest-actions">
                      {canOpenOpportunity ? (
                        <Link
                          href={`/opportunities/${interest.opportunity_id}`}
                          className="dashboard-card-action-pill"
                        >
                          Open opportunity
                        </Link>
                      ) : (
                        <span className="dashboard-muted-action">
                          Opportunity not currently public
                        </span>
                      )}

                      <form action={removeInterest}>
                        <input
                          type="hidden"
                          name="interest_id"
                          value={interest.id}
                        />
                        <button
                          type="submit"
                          className="remove-interest-button"
                          aria-label={`Remove interest in ${
                            opportunity?.title || "this opportunity"
                          }`}
                        >
                          Remove interest
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>

      <style>{`
        .my-interests-page,
        .my-interests-page * {
          box-sizing: border-box;
        }

        .dashboard-grid,
        .my-interests-grid {
          align-items: stretch;
        }

        .dashboard-pathway-card,
        .my-interest-card {
          height: 100%;
          align-items: stretch;
        }

        .my-interest-card {
          min-height: 280px;
        }

        .dashboard-card-copy,
        .my-interest-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .my-interest-main {
          display: grid;
          gap: 10px;
        }

        .my-interest-main h2 {
          margin-bottom: 0;
        }

        .my-interest-main p {
          margin: 0;
        }

        .my-interest-status-panel,
        .my-interest-location {
          display: grid;
          gap: 4px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
          color: #5d6677;
        }

        .my-interest-status-panel strong,
        .my-interest-location strong {
          color: #315f48;
        }

        .status-panel-new {
          border-color: rgba(108, 92, 160, 0.16);
          background: rgba(248, 245, 255, 0.82);
        }

        .status-panel-contacted {
          border-color: rgba(74, 112, 160, 0.22);
          background: rgba(243, 249, 255, 0.86);
        }

        .status-panel-accepted {
          border-color: rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.92);
        }

        .status-panel-closed {
          border-color: rgba(100, 100, 110, 0.16);
          background: rgba(248, 248, 252, 0.86);
        }

        .my-interest-message {
          display: grid;
          gap: 6px;
          color: #5d6677;
        }

        .my-interest-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 10px;
        }

        .dashboard-card-action-pill {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          margin-top: auto;
          padding: 10px 16px;
          border: 1px solid rgba(83, 111, 99, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.88);
          color: #536f63;
          font-size: 0.94rem;
          font-weight: 900;
          line-height: 1.15;
          text-decoration: none;
          box-shadow: 0 10px 24px rgba(33, 56, 48, 0.07);
        }

        .dashboard-card-action-pill:hover {
          border-color: rgba(83, 111, 99, 0.34);
          background: rgba(244, 255, 249, 0.96);
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
        .preference-text-large .dashboard-card-copy p,
        .preference-text-large .dashboard-progress-note {
          font-size: 1.04em;
        }

        .preference-text-large .dashboard-title {
          letter-spacing: -0.035em;
        }

        .preference-view-simple .dashboard-grid {
          gap: 18px;
        }

        .preference-view-simple .my-interest-card {
          min-height: 210px;
        }

        .preference-view-simple .dashboard-card-icon {
          font-size: 2rem;
        }

        .preference-view-detailed .my-interest-card {
          min-height: 310px;
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
        .preference-theme-high_contrast .my-interest-status-panel,
        .preference-theme-high_contrast .my-interest-location {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .my-interest-status-panel strong,
        .preference-theme-high_contrast .my-interest-location strong {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-card-copy p,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .my-interest-status-panel,
        .preference-theme-high_contrast .my-interest-location {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-card-icon,
        .preference-theme-high_contrast .dashboard-progress-icon {
          border: 2px solid #1f2937;
          background: #ffffff;
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-card-action-pill {
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
        .preference-theme-neon_arcade .my-interest-status-panel,
        .preference-theme-neon_arcade .my-interest-location {
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
        .preference-theme-neon_arcade .my-interest-status-panel strong,
        .preference-theme-neon_arcade .my-interest-location strong {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-card-label,
        .preference-theme-neon_arcade .dashboard-card-copy p,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .dashboard-muted-action,
        .preference-theme-neon_arcade .my-interest-message,
        .preference-theme-neon_arcade .my-interest-status-panel,
        .preference-theme-neon_arcade .my-interest-location {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-card-icon,
        .preference-theme-neon_arcade .dashboard-progress-icon {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .dashboard-card-action-pill {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow:
            0 10px 24px rgba(0, 0, 0, 0.24),
            inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .remove-interest-button {
          border-color: rgba(248, 113, 113, 0.5);
          background: rgba(127, 29, 29, 0.28);
          color: #fecaca;
        }

        .preference-theme-neon_arcade .status-panel-accepted {
          border-color: rgba(167, 243, 208, 0.5);
          background: rgba(20, 83, 45, 0.24);
        }

        .preference-theme-neon_arcade .status-panel-contacted {
          border-color: rgba(34, 211, 238, 0.46);
          background: rgba(8, 47, 73, 0.32);
        }

        .preference-theme-neon_arcade .status-panel-new {
          border-color: rgba(217, 70, 239, 0.34);
          background: rgba(49, 46, 129, 0.32);
        }

        .preference-theme-neon_arcade .status-panel-closed {
          border-color: rgba(148, 163, 184, 0.34);
          background: rgba(30, 41, 59, 0.62);
        }

        @media (max-width: 640px) {
          .my-interest-card,
          .preference-view-simple .my-interest-card,
          .preference-view-detailed .my-interest-card {
            min-height: 0;
          }

          .my-interest-copy {
            gap: 14px;
          }

          .my-interest-status-panel,
          .my-interest-location {
            border-radius: 16px;
          }

          .my-interest-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .dashboard-card-action-pill,
          .remove-interest-button {
            width: 100%;
          }

          .preference-text-large {
            font-size: 1.03rem;
          }
        }
      `}</style>
    </main>
  );
}
