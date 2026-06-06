import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import {
  getOpportunityMatch,
  getOpportunityMatchCardIcon,
  getOpportunityMatchToneClass,
  type OpportunityMatchResult,
} from "@/lib/opportunity-matching";

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
  status: string;
  created_at: string;
};

type MatchedOpportunity = {
  opportunity: Opportunity;
  match: OpportunityMatchResult;
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
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

function formatPublicLocation(opportunity: Opportunity) {
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

function formatLocationPrivacyNote(opportunity: Opportunity) {
  if (opportunity.location_type === "remote") {
    return "";
  }

  if (opportunity.hide_exact_location === true) {
    return "Exact venue shared later";
  }

  if (opportunity.location_venue?.trim()) {
    return "Venue listed on details page";
  }

  return "";
}

function getCreatedAtTime(value: string | null | undefined) {
  if (!value) return 0;

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

function getMatchedOpportunities(
  opportunities: Opportunity[],
  volunteerProfile: VolunteerProfile | null,
): MatchedOpportunity[] {
  return opportunities
    .map((opportunity) => ({
      opportunity,
      match: getOpportunityMatch(volunteerProfile, opportunity),
    }))
    .sort((a, b) => {
      if (b.match.score !== a.match.score) {
        return b.match.score - a.match.score;
      }

      return (
        getCreatedAtTime(b.opportunity.created_at) -
        getCreatedAtTime(a.opportunity.created_at)
      );
    });
}

function OpportunityMatchPanel({
  match,
  simpleView,
}: {
  match: OpportunityMatchResult;
  simpleView: boolean;
}) {
  const toneClass = getOpportunityMatchToneClass(match.tone);
  const icon = getOpportunityMatchCardIcon(match.tone);
  const visibleReasons = simpleView ? match.reasons.slice(0, 1) : match.reasons;

  return (
    <div className={`opportunity-match-panel ${toneClass}`}>
      <div className="opportunity-match-header">
        <span className="opportunity-match-icon" aria-hidden="true">
          {icon}
        </span>

        <div>
          <p className="opportunity-match-label">
            {simpleView ? match.shortLabel : match.label}
          </p>
          {!simpleView ? <p>{match.summary}</p> : null}
        </div>
      </div>

      {visibleReasons.length > 0 ? (
        <div className="opportunity-match-reasons">
          {visibleReasons.map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default async function OpportunitiesPage() {
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

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id,title,summary,location_type,location,location_town_city,location_area,location_venue,location_postcode,travel_notes,accessibility_notes,hide_exact_location,time_commitment,interests,skills,support_offered,contact_name,status,created_at",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const rows = (opportunities as Opportunity[] | null) ?? [];

  const viewMode = normaliseViewMode(preferences?.view_mode);
  const colourTheme = normaliseColourTheme(preferences?.colour_theme);
  const textSize = normaliseTextSize(preferences?.text_size);
  const avatarIcon = normaliseAvatarIcon(preferences?.avatar_icon);
  const listenMode = normaliseListenMode(preferences?.listen_mode);

  const simpleView = viewMode === "simple";
  const detailedView = viewMode === "detailed";

  const matchedRows = getMatchedOpportunities(rows, volunteerProfile ?? null);

  const strongMatchCount = matchedRows.filter(
    (row) => row.match.tone === "strong",
  ).length;

  const goodMatchCount = matchedRows.filter(
    (row) => row.match.tone === "good",
  ).length;

  const exploreMatchCount = matchedRows.filter(
    (row) => row.match.tone === "explore",
  ).length;

  const listenText = simpleView
    ? "You are on the Find opportunities page. This page shows volunteering roles. Best matches are shown first. Each card shows a safe location summary and a match label. Choose Read more when a role sounds right. Use Dashboard to go back."
    : "You are on the Find opportunities page. This page shows published volunteering roles. Roles are shown with the strongest profile matches first. Each card includes a safe location summary, time commitment and gentle match information based on your profile. Match labels are only a guide, and you can explore any role that interests you. Exact venues or postcodes may be hidden until the organisation has contacted or accepted a volunteer. Select Read more to open the full opportunity details page.";

  const shellClassName = [
    "dashboard-bg",
    "opportunities-page",
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
          aria-labelledby="opportunities-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Find opportunities</p>

            <h1 id="opportunities-title" className="dashboard-title">
              <span aria-hidden="true">{avatarIcon}</span>
              <span>{simpleView ? "Find roles" : "Best roles for you"}</span>
            </h1>

            <p className="dashboard-lead">
              {simpleView
                ? "Look through available roles and open any that feel right."
                : "Browse published opportunities from organisations. Best matches are shown first, but every role is open to explore."}
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/profile"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">👤</span>
                  <span>View my profile</span>
                </span>
              </Link>

              <Link
                href="/pathway"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🧭</span>
                  <span>See my pathway</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Opportunity count">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                {avatarIcon}
              </span>
              <div>
                <h2>Available now</h2>
                <p>
                  {rows.length} published role{rows.length === 1 ? "" : "s"}.
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Strong matches: <strong>{strongMatchCount}</strong>
            </p>

            <p className="dashboard-progress-note">
              Good matches: <strong>{goodMatchCount}</strong>
            </p>

            {!simpleView ? (
              <p className="dashboard-progress-note">
                Explore roles: <strong>{exploreMatchCount}</strong>
              </p>
            ) : null}

            <p className="dashboard-progress-note">
              {simpleView
                ? "Open a role to read more."
                : "Location summaries are shown safely. Exact venue details may be shared later by the organisation."}
            </p>

            {detailedView ? (
              <p className="dashboard-progress-note">
                App view: <strong>{getViewLabel(viewMode)}</strong> · Theme:{" "}
                <strong>{getThemeLabel(colourTheme)}</strong>
              </p>
            ) : null}
          </aside>
        </section>

        {rows.length === 0 ? (
          <section className="dashboard-grid" aria-label="No opportunities yet">
            <article className="info-card dashboard-pathway-card opportunities-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                🌱
              </div>

              <div className="dashboard-card-copy">
                <div className="dashboard-card-main">
                  <p className="dashboard-card-label">Nothing published yet</p>
                  <h2>No opportunities available</h2>
                  <p>
                    Organisations have not published any volunteering roles yet.
                    Check back soon.
                  </p>
                </div>

                <Link href="/dashboard" className="dashboard-card-action-pill">
                  Back to dashboard
                </Link>
              </div>
            </article>
          </section>
        ) : (
          <section className="dashboard-grid" aria-label="Published opportunities">
            {matchedRows.map(({ opportunity, match }) => {
              const privacyNote = formatLocationPrivacyNote(opportunity);

              return (
                <Link
                  key={opportunity.id}
                  href={`/opportunities/${opportunity.id}`}
                  className="info-card dashboard-pathway-card opportunities-card"
                >
                  <div className="dashboard-card-icon" aria-hidden="true">
                    📣
                  </div>

                  <div className="dashboard-card-copy">
                    <div className="dashboard-card-main">
                      <p className="dashboard-card-label">
                        {formatLocationType(opportunity.location_type)}
                      </p>

                      <h2>{opportunity.title}</h2>

                      <p>{opportunity.summary}</p>

                      <div className="safe-location-strip">
                        <span aria-hidden="true">📍</span>
                        <span>{formatPublicLocation(opportunity)}</span>
                      </div>

                      {privacyNote ? (
                        <p className="location-privacy-note">{privacyNote}</p>
                      ) : null}

                      <OpportunityMatchPanel
                        match={match}
                        simpleView={simpleView}
                      />

                      <p className="dashboard-muted-action">
                        {opportunity.time_commitment ||
                          "Time commitment not listed"}
                      </p>
                    </div>

                    <span className="dashboard-card-action-pill">Read more</span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </section>

      <style>{`
        .opportunities-page,
        .opportunities-page * {
          box-sizing: border-box;
        }

        .opportunities-page .dashboard-grid {
          align-items: stretch;
        }

        .opportunities-page .dashboard-pathway-card {
          height: 100%;
          align-items: stretch;
        }

        .opportunities-page .dashboard-card-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .opportunities-page .dashboard-card-main {
          display: grid;
          gap: 10px;
        }

        .opportunities-page .dashboard-card-main h2 {
          margin-bottom: 0;
          overflow-wrap: anywhere;
        }

        .opportunities-page .dashboard-card-main p {
          margin: 0;
          overflow-wrap: anywhere;
        }

        .safe-location-strip {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px;
          align-items: center;
          width: fit-content;
          max-width: 100%;
          padding: 9px 12px;
          border: 1px solid rgba(83, 111, 99, 0.16);
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.86);
          color: #315f48;
          font-size: 0.9rem;
          font-weight: 900;
          line-height: 1.2;
        }

        .location-privacy-note {
          color: #60706a;
          font-size: 0.86rem;
          font-weight: 850;
        }

        .opportunity-match-panel {
          display: grid;
          gap: 10px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.76);
        }

        .opportunity-match-header {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
        }

        .opportunity-match-icon {
          display: inline-flex;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(143, 178, 158, 0.14);
          font-size: 1.28rem;
        }

        .opportunity-match-label {
          margin: 0 0 3px !important;
          color: #315f48;
          font-weight: 950;
        }

        .opportunity-match-header p:not(.opportunity-match-label) {
          color: #60706a;
          font-size: 0.92rem;
          font-weight: 750;
          line-height: 1.35;
        }

        .opportunity-match-reasons {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .opportunity-match-reasons span {
          display: inline-flex;
          min-height: 30px;
          align-items: center;
          justify-content: center;
          padding: 6px 9px;
          border: 1px solid rgba(83, 111, 99, 0.16);
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.86);
          color: #536f63;
          font-size: 0.78rem;
          font-weight: 900;
          line-height: 1.15;
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

        .opportunities-page .dashboard-card-action-pill {
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

        .opportunities-page .dashboard-pathway-card:hover .dashboard-card-action-pill {
          border-color: rgba(83, 111, 99, 0.34);
          background: rgba(244, 255, 249, 0.96);
        }

        .preference-text-large {
          font-size: 1.06rem;
        }

        .preference-text-large .dashboard-lead,
        .preference-text-large .dashboard-card-copy p,
        .preference-text-large .dashboard-progress-note,
        .preference-text-large .opportunity-match-header p {
          font-size: 1.04em;
        }

        .preference-text-large .dashboard-title {
          letter-spacing: -0.035em;
        }

        .preference-view-simple .dashboard-grid {
          gap: 18px;
        }

        .preference-view-simple .dashboard-pathway-card {
          min-height: 190px;
        }

        .preference-view-simple .dashboard-card-icon {
          font-size: 2rem;
        }

        .preference-view-simple .opportunity-match-panel {
          gap: 8px;
        }

        .preference-view-simple .opportunity-match-header {
          align-items: center;
        }

        .preference-view-detailed .dashboard-pathway-card {
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
        .preference-theme-calm_green .opportunity-match-panel {
          border-color: rgba(83, 111, 99, 0.2);
        }

        .preference-theme-calm_green .dashboard-card-icon,
        .preference-theme-calm_green .dashboard-progress-icon,
        .preference-theme-calm_green .opportunity-match-icon {
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
        .preference-theme-soft_blue .opportunity-match-panel {
          border-color: rgba(74, 112, 160, 0.2);
        }

        .preference-theme-soft_blue .dashboard-card-icon,
        .preference-theme-soft_blue .dashboard-progress-icon,
        .preference-theme-soft_blue .opportunity-match-icon {
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
        .preference-theme-warm_peach .opportunity-match-panel {
          border-color: rgba(190, 118, 76, 0.2);
        }

        .preference-theme-warm_peach .dashboard-card-icon,
        .preference-theme-warm_peach .dashboard-progress-icon,
        .preference-theme-warm_peach .opportunity-match-icon {
          background: rgba(255, 239, 226, 0.92);
        }

        .preference-theme-high_contrast {
          background: #f8fafc;
        }

        .preference-theme-high_contrast .dashboard-welcome-card,
        .preference-theme-high_contrast .info-card,
        .preference-theme-high_contrast .dashboard-progress-card,
        .preference-theme-high_contrast .opportunity-match-panel,
        .preference-theme-high_contrast .opportunity-match-reasons span,
        .preference-theme-high_contrast .safe-location-strip {
          border: 2px solid #1f2937;
          background: rgba(255, 255, 255, 0.98);
        }

        .preference-theme-high_contrast .dashboard-title,
        .preference-theme-high_contrast .dashboard-card-copy h2,
        .preference-theme-high_contrast .dashboard-progress-card h2,
        .preference-theme-high_contrast .opportunity-match-label {
          color: #111827;
        }

        .preference-theme-high_contrast .dashboard-lead,
        .preference-theme-high_contrast .dashboard-card-copy p,
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .dashboard-muted-action,
        .preference-theme-high_contrast .opportunity-match-header p,
        .preference-theme-high_contrast .opportunity-match-reasons span,
        .preference-theme-high_contrast .safe-location-strip,
        .preference-theme-high_contrast .location-privacy-note {
          color: #1f2937;
        }

        .preference-theme-high_contrast .dashboard-card-icon,
        .preference-theme-high_contrast .dashboard-progress-icon,
        .preference-theme-high_contrast .opportunity-match-icon {
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
        .preference-theme-neon_arcade .opportunity-match-panel {
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
        .preference-theme-neon_arcade .opportunity-match-label {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-card-label,
        .preference-theme-neon_arcade .dashboard-card-copy p,
        .preference-theme-neon_arcade .dashboard-progress-note,
        .preference-theme-neon_arcade .dashboard-muted-action,
        .preference-theme-neon_arcade .opportunity-match-header p,
        .preference-theme-neon_arcade .location-privacy-note {
          color: #dbeafe;
        }

        .preference-theme-neon_arcade .dashboard-card-icon,
        .preference-theme-neon_arcade .dashboard-progress-icon,
        .preference-theme-neon_arcade .opportunity-match-icon {
          border: 1px solid rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow: inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .opportunity-match-reasons span,
        .preference-theme-neon_arcade .dashboard-card-action-pill,
        .preference-theme-neon_arcade .safe-location-strip {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(34, 211, 238, 0.12);
          color: #a7f3d0;
          box-shadow:
            0 10px 24px rgba(0, 0, 0, 0.24),
            inset 0 0 0 1px rgba(217, 70, 239, 0.14);
        }

        .preference-theme-neon_arcade .dashboard-pathway-card:hover .dashboard-card-action-pill {
          border-color: rgba(167, 243, 208, 0.58);
          background: rgba(30, 41, 59, 0.92);
        }

        @media (max-width: 640px) {
          .preference-text-large {
            font-size: 1.03rem;
          }

          .preference-view-simple .dashboard-pathway-card,
          .preference-view-detailed .dashboard-pathway-card {
            min-height: 0;
          }

          .opportunities-page .dashboard-card-copy {
            gap: 14px;
          }

          .opportunities-page .dashboard-card-action-pill,
          .safe-location-strip {
            width: 100%;
          }

          .opportunity-match-panel {
            border-radius: 16px;
          }

          .opportunity-match-reasons span {
            width: 100%;
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
