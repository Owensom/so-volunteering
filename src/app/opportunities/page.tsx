import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type VolunteerProfile = {
  interests: string[] | null;
  skills: string[] | null;
  support_needs: string | null;
  availability_notes: string | null;
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
  status: string;
  created_at: string;
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

function OpportunityMatchBadges({
  volunteerProfile,
  opportunity,
  simpleView,
}: {
  volunteerProfile: VolunteerProfile | null;
  opportunity: Opportunity;
  simpleView: boolean;
}) {
  const interestMatches = countMatches(
    volunteerProfile?.interests,
    opportunity.interests,
  );

  const skillMatches = countMatches(volunteerProfile?.skills, opportunity.skills);

  const hasSupportInfo =
    Array.isArray(opportunity.support_offered) &&
    opportunity.support_offered.length > 0;

  if (simpleView) {
    if (interestMatches > 0 || skillMatches > 0) {
      return (
        <div className="profile-chip-list" aria-label="Opportunity match details">
          <span className="profile-chip">✨ May suit you</span>
        </div>
      );
    }

    if (hasSupportInfo) {
      return (
        <div className="profile-chip-list" aria-label="Opportunity match details">
          <span className="profile-chip">💛 Support listed</span>
        </div>
      );
    }

    return (
      <div className="profile-chip-list" aria-label="Opportunity match details">
        <span className="profile-chip">🌈 Explore this role</span>
      </div>
    );
  }

  return (
    <div className="profile-chip-list" aria-label="Opportunity match details">
      {interestMatches > 0 ? (
        <span className="profile-chip">
          💚 {interestMatches} interest match
          {interestMatches === 1 ? "" : "es"}
        </span>
      ) : null}

      {skillMatches > 0 ? (
        <span className="profile-chip">
          ⭐ {skillMatches} skill match{skillMatches === 1 ? "" : "es"}
        </span>
      ) : null}

      {hasSupportInfo ? <span className="profile-chip">💛 Support listed</span> : null}

      {interestMatches === 0 && skillMatches === 0 && !hasSupportInfo ? (
        <span className="profile-chip">🌈 Explore this role</span>
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
    .select("interests,skills,support_needs,availability_notes")
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
      "id,title,summary,location_type,location,time_commitment,interests,skills,support_offered,contact_name,status,created_at",
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

  const listenText = simpleView
    ? "You are on the Find opportunities page. This page shows volunteering roles. Read each card. Choose Read more when a role sounds right. Use Dashboard to go back."
    : "You are on the Find opportunities page. This page shows published volunteering roles. First, look at the Available now card on the right to see how many roles are open. Then move through the role cards below. Each card shows the role title, short description, location type, time commitment and support labels. If a role sounds right, select the card or the Read more link to open the full opportunity details page. Use the View my profile button to check your saved interests and skills. Use the See my pathway button to go back to your setup progress.";

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
              <span>{simpleView ? "Find roles" : "Volunteering roles"}</span>
            </h1>

            <p className="dashboard-lead">
              {simpleView
                ? "Look through available roles and open any that feel right."
                : "Browse published opportunities from organisations. Start by reading what the role involves, what support is available, and whether it feels right for you."}
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
              {simpleView
                ? "Open a role to read more."
                : "Open a role card to read the full details and decide if it feels right."}
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
            {rows.map((opportunity) => (
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

                    <OpportunityMatchBadges
                      volunteerProfile={volunteerProfile}
                      opportunity={opportunity}
                      simpleView={simpleView}
                    />

                    <p className="dashboard-muted-action">
                      {opportunity.location ? `${opportunity.location} · ` : ""}
                      {opportunity.time_commitment ||
                        "Time commitment not listed"}
                    </p>
                  </div>

                  <span className="dashboard-card-action-pill">Read more</span>
                </div>
              </Link>
            ))}
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
          gap: 8px;
        }

        .opportunities-page .dashboard-card-main h2 {
          margin-bottom: 0;
          overflow-wrap: anywhere;
        }

        .opportunities-page .dashboard-card-main p {
          margin: 0;
          overflow-wrap: anywhere;
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

        .opportunities-page .profile-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .opportunities-page .profile-chip {
          max-width: 100%;
          overflow-wrap: anywhere;
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

        .preference-view-simple .dashboard-pathway-card {
          min-height: 190px;
        }

        .preference-view-simple .dashboard-card-icon {
          font-size: 2rem;
        }

        .preference-view-simple .profile-chip-list .profile-chip:not(:first-child) {
          display: none;
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
        .preference-theme-high_contrast .profile-chip {
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
        .preference-theme-high_contrast .dashboard-progress-note,
        .preference-theme-high_contrast .dashboard-muted-action,
        .preference-theme-high_contrast .profile-chip {
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
        .preference-theme-neon_arcade .info-card {
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(15, 23, 42, 0.86);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(217, 70, 239, 0.12);
        }

        .preference-theme-neon_arcade .dashboard-title,
        .preference-theme-neon_arcade .dashboard-card-copy h2,
        .preference-theme-neon_arcade .dashboard-progress-card h2,
        .preference-theme-neon_arcade .dashboard-progress-note strong {
          color: #e0f2fe;
        }

        .preference-theme-neon_arcade .dashboard-kicker,
        .preference-theme-neon_arcade .dashboard-lead,
        .preference-theme-neon_arcade .dashboard-card-label,
        .preference-theme-neon_arcade .dashboard-card-copy p,
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

        .preference-theme-neon_arcade .profile-chip,
        .preference-theme-neon_arcade .dashboard-card-action-pill {
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

          .opportunities-page .dashboard-card-action-pill {
            width: 100%;
          }

          .opportunities-page .profile-chip-list {
            width: 100%;
          }

          .opportunities-page .profile-chip {
            width: 100%;
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
