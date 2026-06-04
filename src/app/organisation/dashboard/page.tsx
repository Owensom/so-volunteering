import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
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
  profile_completed: boolean | null;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

export default async function OrganisationDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user }
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
    .select("organisation_name,contact_email,profile_completed")
    .eq("user_id", user.id)
    .maybeSingle<OrganisationProfile>();

  const displayName =
    organisationProfile?.organisation_name?.trim() ||
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "there";

  const emailAddress =
    organisationProfile?.contact_email?.trim() ||
    profile?.email?.trim() ||
    user.email ||
    "";

  const profileCompleted = organisationProfile?.profile_completed === true;

  const listenText =
    "This is the organisation workspace for SO Volunteering. This page helps organisations set up their profile, prepare inclusive volunteering roles, add support and safety information, and later review volunteer interest. The main button opens the organisation profile. The opportunity tools are planned next.";

  return (
    <main className="dashboard-bg">
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/organisation/dashboard"
            className="dashboard-brand"
            aria-label="SO Volunteering organisation dashboard"
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

            <form action={signOut}>
              <button
                type="submit"
                className="secondary-button dashboard-signout-button"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🚪</span>
                  <span>Sign out</span>
                </span>
              </button>
            </form>
          </div>
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="organisation-dashboard-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Organisation workspace</p>

            <h1 id="organisation-dashboard-title" className="dashboard-title">
              <span aria-hidden="true">🏢</span>
              <span>Build inclusive opportunities</span>
            </h1>

            <p className="dashboard-lead">
              Hi {displayName}. Start by completing your organisation profile.
              Then you will be able to create clear, accessible volunteering
              roles with support built in from the beginning.
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/organisation/profile"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🏢</span>
                  <span>
                    {profileCompleted
                      ? "Edit organisation profile"
                      : "Set up organisation"}
                  </span>
                </span>
              </Link>

              <a
                href="#organisation-build-plan"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📣</span>
                  <span>Opportunity plan</span>
                </span>
              </a>
            </div>
          </div>

          <aside
            className="dashboard-progress-card"
            aria-label="Organisation profile status"
          >
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>

              <div>
                <h2>Profile status</h2>
                <p>
                  Status:{" "}
                  <strong>{profileCompleted ? "Complete" : "Needs setup"}</strong>
                </p>
              </div>
            </div>

            {emailAddress ? (
              <p className="dashboard-progress-note">{emailAddress}</p>
            ) : (
              <p className="dashboard-progress-note">Email not available.</p>
            )}

            <p className="dashboard-progress-note">
              Complete your profile before publishing opportunities.
            </p>
          </aside>
        </section>

        <section
          id="organisation-setup"
          className="dashboard-grid"
          aria-label="Organisation setup priorities"
        >
          <Link
            href="/organisation/profile"
            className="info-card dashboard-pathway-card"
          >
            <div className="dashboard-card-icon" aria-hidden="true">
              🏢
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Priority 1</p>
              <h2>Organisation profile</h2>
              <p>
                Add your name, purpose, location and contact details so
                volunteers know who you are.
              </p>
              <p className="card-action text-link">
                {profileCompleted ? "Review profile" : "Start profile"}
              </p>
            </div>
          </Link>

          <Link
            href="/organisation/profile"
            className="info-card dashboard-pathway-card"
          >
            <div className="dashboard-card-icon" aria-hidden="true">
              💛
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Priority 2</p>
              <h2>Inclusion and support</h2>
              <p>
                Describe the support volunteers can expect before, during and
                after their role.
              </p>
              <p className="card-action text-link">Review support</p>
            </div>
          </Link>

          <Link
            href="/organisation/profile"
            className="info-card dashboard-pathway-card"
          >
            <div className="dashboard-card-icon" aria-hidden="true">
              🛡️
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Priority 3</p>
              <h2>Safety basics</h2>
              <p>
                Add simple supervision and safeguarding notes so volunteers know
                who can help.
              </p>
              <p className="card-action text-link">Review safety</p>
            </div>
          </Link>
        </section>

        <section
          id="organisation-build-plan"
          className="dashboard-grid"
          aria-label="Organisation opportunity build plan"
        >
          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              📣
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Opportunities</p>
              <h2>Create a role</h2>
              <p>
                Build plain-language roles with tasks, timings, skills and
                support notes.
              </p>
              <p className="dashboard-muted-action">Next major feature</p>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              ✅
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Readiness</p>
              <h2>Opportunity checklist</h2>
              <p>
                Check each role has a clear title, simple tasks, time commitment
                and contact details.
              </p>
              <p className="dashboard-muted-action">Planned workflow</p>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🤝
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Matching</p>
              <h2>Volunteer matches</h2>
              <p>
                Match roles with volunteer interests, skills, availability and
                support preferences.
              </p>
              <p className="dashboard-muted-action">Later phase</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
