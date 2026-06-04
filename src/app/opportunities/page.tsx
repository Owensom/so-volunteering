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

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

function countMatches(
  volunteerValues: string[] | null | undefined,
  opportunityValues: string[] | null | undefined
) {
  if (!Array.isArray(volunteerValues) || !Array.isArray(opportunityValues)) {
    return 0;
  }

  const volunteerSet = new Set(
    volunteerValues.map((value) => value.trim().toLowerCase())
  );

  return opportunityValues.filter((value) =>
    volunteerSet.has(value.trim().toLowerCase())
  ).length;
}

function OpportunityMatchBadges({
  volunteerProfile,
  opportunity
}: {
  volunteerProfile: VolunteerProfile | null;
  opportunity: Opportunity;
}) {
  const interestMatches = countMatches(
    volunteerProfile?.interests,
    opportunity.interests
  );

  const skillMatches = countMatches(volunteerProfile?.skills, opportunity.skills);

  const hasSupportInfo =
    Array.isArray(opportunity.support_offered) &&
    opportunity.support_offered.length > 0;

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

      {hasSupportInfo ? (
        <span className="profile-chip">💛 Support listed</span>
      ) : null}

      {interestMatches === 0 && skillMatches === 0 && !hasSupportInfo ? (
        <span className="profile-chip">🌈 Explore this role</span>
      ) : null}
    </div>
  );
}

export default async function OpportunitiesPage() {
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

  const { data: volunteerProfile } = await supabase
    .from("volunteer_profiles")
    .select("interests,skills,support_needs,availability_notes")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id,title,summary,location_type,location,time_commitment,interests,skills,support_offered,contact_name,status,created_at"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const rows = (opportunities as Opportunity[] | null) ?? [];

  const listenText =
    "This is the opportunities page. It shows published volunteering roles. Each card tells you the role title, short description, location type, time commitment and support information. Some cards may show interest or skill match labels based on your profile. Select a role card to read more.";

  return (
    <main className="dashboard-bg">
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
            <InclusiveAudioButton text={listenText} />

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
              <span aria-hidden="true">🔎</span>
              <span>Volunteering roles</span>
            </h1>

            <p className="dashboard-lead">
              Browse published opportunities from organisations. Start by
              reading what the role involves, what support is available, and
              whether it feels right for you.
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
                ✨
              </span>
              <div>
                <h2>Available now</h2>
                <p>
                  {rows.length} published role{rows.length === 1 ? "" : "s"}.
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              More matching and application tools will be added after browsing
              is stable.
            </p>
          </aside>
        </section>

        {rows.length === 0 ? (
          <section className="dashboard-grid" aria-label="No opportunities yet">
            <article className="info-card dashboard-pathway-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                🌱
              </div>

              <div className="dashboard-card-copy">
                <p className="dashboard-card-label">Nothing published yet</p>
                <h2>No opportunities available</h2>
                <p>
                  Organisations have not published any volunteering roles yet.
                  Check back soon.
                </p>
                <p className="card-action">
                  <Link href="/dashboard" className="text-link">
                    Back to dashboard
                  </Link>
                </p>
              </div>
            </article>
          </section>
        ) : (
          <section className="dashboard-grid" aria-label="Published opportunities">
            {rows.map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                className="info-card dashboard-pathway-card"
              >
                <div className="dashboard-card-icon" aria-hidden="true">
                  📣
                </div>

                <div className="dashboard-card-copy">
                  <p className="dashboard-card-label">
                    {formatLocationType(opportunity.location_type)}
                  </p>

                  <h2>{opportunity.title}</h2>

                  <p>{opportunity.summary}</p>

                  <OpportunityMatchBadges
                    volunteerProfile={volunteerProfile}
                    opportunity={opportunity}
                  />

                  <p className="dashboard-muted-action">
                    {opportunity.location ? `${opportunity.location} · ` : ""}
                    {opportunity.time_commitment || "Time commitment not listed"}
                  </p>

                  <p className="card-action text-link">Read more</p>
                </div>
              </Link>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
