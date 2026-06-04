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
    value === "high_contrast"
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
  return "SO default";
}

function formatStatus(status: string) {
  if (status === "reviewed") return "Reviewed";
  if (status === "contacted") return "Contacted";
  if (status === "closed") return "Closed";
  return "New";
}

function statusIcon(status: string) {
  if (status === "reviewed") return "👀";
  if (status === "contacted") return "📬";
  if (status === "closed") return "✅";
  return "🌱";
}

function statusHelp(status: string, simpleView: boolean) {
  if (status === "reviewed") {
    return simpleView
      ? "The organisation has reviewed this."
      : "The organisation has reviewed your interest.";
  }

  if (status === "contacted") {
    return simpleView
      ? "The organisation has marked this as contacted."
      : "The organisation has marked this as contacted.";
  }

  if (status === "closed") {
    return simpleView
      ? "This role interest is closed."
      : "This interest has been closed by the organisation.";
  }

  return simpleView
    ? "Waiting to be reviewed."
    : "Your interest has been sent and is waiting to be reviewed.";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

export default async function MyInterestsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";
  const successMessage = params.message ? decodeURIComponent(params.message) : "";

  const supabase = await createClient();

  const {
    data: { user }
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
    new Set(rows.map((row) => row.opportunity_id))
  );

  const { data: opportunities } = opportunityIds.length
    ? await supabase
        .from("opportunities")
        .select(
          "id,title,summary,location_type,location,time_commitment,status,contact_name,contact_email"
        )
        .in("id", opportunityIds)
    : { data: [] as OpportunityRow[] };

  const opportunityMap = new Map(
    ((opportunities as OpportunityRow[] | null) ?? []).map((opportunity) => [
      opportunity.id,
      opportunity
    ])
  );

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";

  const newCount = rows.filter((row) => row.status === "new").length;
  const reviewedCount = rows.filter((row) => row.status === "reviewed").length;
  const contactedCount = rows.filter((row) => row.status === "contacted").length;
  const closedCount = rows.filter((row) => row.status === "closed").length;

  const listenText = simpleView
    ? "You are on the Roles I am interested in page. This page shows roles you saved. Open a role to read it again, or remove interest if you no longer want the organisation to see it."
    : "You are on the Roles I am interested in page. This page tracks roles where you clicked I’m interested. First, check the Role status card on the right to see how many roles are new, reviewed, contacted or closed. Then read each role card below. Each card shows the role title, current status, what the status means, location details, your supporting statement if you wrote one, and the role contact if available. Use Open opportunity to return to the role details. Use Remove interest if you no longer want the organisation to see that you are interested.";

  const shellClassName = [
    "dashboard-bg",
    getThemeClass(colourTheme),
    getTextClass(textSize),
    getViewClass(viewMode)
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

          <aside className="dashboard-progress-card" aria-label="Role interest status">
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
              New: <strong>{newCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Reviewed: <strong>{reviewedCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Contacted: <strong>{contactedCount}</strong>
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

              return (
                <article
                  key={interest.id}
                  className="info-card dashboard-pathway-card my-interest-card"
                >
                  <div
                    className="dashboard-card-icon my-interest-icon"
                    aria-hidden="true"
                  >
                    {statusIcon(interest.status)}
                  </div>

                  <div className="dashboard-card-copy my-interest-copy">
                    <div className="my-interest-main">
                      <p className="dashboard-card-label">
                        {formatStatus(interest.status)}
                      </p>

                      <h2>{opportunity?.title || "Opportunity"}</h2>

                      {opportunity?.summary ? (
                        <p>{opportunity.summary}</p>
                      ) : (
                        <p className="dashboard-muted-action">
                          This opportunity could not be loaded.
                        </p>
                      )}

                      <div className="my-interest-status-panel">
                        <p>
                          <strong>{formatStatus(interest.status)}</strong>
                        </p>
                        <p>{statusHelp(interest.status, simpleView)}</p>
                      </div>

                      {opportunity ? (
                        <p className="dashboard-muted-action">
                          {formatLocationType(opportunity.location_type)}
                          {opportunity.location
                            ? ` · ${opportunity.location}`
                            : ""}
                          {opportunity.time_commitment
                            ? ` · ${opportunity.time_commitment}`
                            : ""}
                        </p>
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

        .my-interest-status-panel {
          display: grid;
          gap: 4px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
          color: #5d6677;
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
        .preference-theme-high_contrast .dashboard-progress-card {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2 {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-card-copy p,
        .preference-theme-high_contrast .dashboard-progress-note {
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

        @media (max-width: 640px) {
          .my-interest-card,
          .preference-view-simple .my-interest-card,
          .preference-view-detailed .my-interest-card {
            min-height: 0;
          }

          .my-interest-copy {
            gap: 14px;
          }

          .my-interest-status-panel {
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
