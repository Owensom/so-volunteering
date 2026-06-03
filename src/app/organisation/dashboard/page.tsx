import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

type Profile = {
  full_name: string | null;
  email: string | null;
  user_type: string | null;
};

function AccessMessage({
  userType
}: {
  userType: string;
}) {
  return (
    <main className="dashboard-bg">
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/dashboard"
            className="dashboard-brand"
            aria-label="SO Volunteering dashboard"
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
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="organisation-access-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Organisation access</p>

            <h1 id="organisation-access-title" className="dashboard-title">
              <span aria-hidden="true">🏢</span>
              <span>Organisation dashboard</span>
            </h1>

            <p className="dashboard-lead">
              This page is for organisation accounts. This account is currently
              marked as <strong>{userType || "volunteer"}</strong>.
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/dashboard"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">←</span>
                  <span>Back to dashboard</span>
                </span>
              </Link>

              <Link
                href="/login"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🔐</span>
                  <span>Sign in again</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Account type">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ℹ️
              </span>
              <div>
                <h2>Account type</h2>
                <p>
                  Current type: <strong>{userType || "volunteer"}</strong>
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              If this should be an organisation account, update the
              <strong> user_type</strong> value in Supabase profiles to
              <strong> organisation</strong>.
            </p>
          </aside>
        </section>
      </section>
    </main>
  );
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

  const userType = profile?.user_type || metadataUserType || "volunteer";

  if (userType !== "organisation") {
    return <AccessMessage userType={userType} />;
  }

  const displayName =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "there";

  const emailAddress = profile?.email?.trim() || user.email || "";

  const listenText =
    "This is the organisation workspace for SO Volunteering. It is different from the volunteer dashboard. This page helps organisations prepare their profile, create accessible volunteering opportunities, describe support available, and later review suitable volunteer matches. The first button moves to setup priorities. The second button moves to the opportunity plan. There is also a sign out button at the top.";

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
              Hi {displayName}. This is your organisation area. The next stages
              will help you set up your organisation profile, create clear
              volunteering opportunities, and support volunteers before they
              apply.
            </p>

            <div className="dashboard-primary-actions">
              <a
                href="#organisation-setup"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🧭</span>
                  <span>Setup priorities</span>
                </span>
              </a>

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
            aria-label="Organisation account"
          >
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>

              <div>
                <h2>Organisation account</h2>
                <p>
                  Status: <strong>Foundation setup</strong>
                </p>
              </div>
            </div>

            {emailAddress ? (
              <p className="dashboard-progress-note">{emailAddress}</p>
            ) : (
              <p className="dashboard-progress-note">Email not available.</p>
            )}

            <p className="dashboard-progress-note">
              Organisation tools are being added carefully so opportunity
              creation, inclusion and safeguarding stay clear from the start.
            </p>
          </aside>
        </section>

        <section
          id="organisation-setup"
          className="dashboard-grid"
          aria-label="Organisation setup priorities"
        >
          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🏢
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Priority 1</p>
              <h2>Organisation profile</h2>
              <p>
                Add your organisation name, purpose, location, contact email,
                website and the type of volunteering you offer.
              </p>
              <p className="dashboard-muted-action">Build next</p>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              💛
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Priority 2</p>
              <h2>Inclusion and support</h2>
              <p>
                Describe what support is available, such as clear instructions,
                named contacts, flexible timings, quiet spaces or buddy support.
              </p>
              <p className="dashboard-muted-action">Support-first setup</p>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🛡️
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Priority 3</p>
              <h2>Safety basics</h2>
              <p>
                Add simple safeguarding, supervision and contact guidance so
                volunteers know who will support them and what to expect.
              </p>
              <p className="dashboard-muted-action">
                Coming with profile setup
              </p>
            </div>
          </article>
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
                Create volunteering opportunities with plain language, large
                clear task choices, skills, interests, availability and support
                notes.
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
                Each opportunity should show whether it has a clear title,
                simple tasks, time commitment, support notes and contact
                details.
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
                Later, the platform will suggest suitable volunteers using their
                interests, skills, availability and support preferences.
              </p>
              <p className="dashboard-muted-action">Later phase</p>
            </div>
          </article>
        </section>

        <section className="dashboard-grid" aria-label="Organisation quick view">
          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🔎
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Live opportunities</p>
              <h2>0 published</h2>
              <p>
                Published opportunities will appear here once the opportunity
                system is live.
              </p>
              <p className="dashboard-muted-action">No action needed yet</p>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              📝
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Drafts</p>
              <h2>0 drafts</h2>
              <p>
                Draft opportunities will help organisations prepare roles before
                publishing them to volunteers.
              </p>
              <p className="dashboard-muted-action">Coming soon</p>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              📬
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Volunteer interest</p>
              <h2>0 enquiries</h2>
              <p>
                When volunteers can express interest, enquiries and applications
                will be shown here.
              </p>
              <p className="dashboard-muted-action">Later phase</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
