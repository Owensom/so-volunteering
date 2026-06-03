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

  const userType = profile?.user_type || metadataUserType;

  if (userType !== "organisation") {
    redirect("/dashboard");
  }

  const displayName =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "there";

  const emailAddress = profile?.email?.trim() || user.email || "";

  const listenText =
    "This is the organisation dashboard for SO Volunteering. It is the home base for organisations. You can prepare your organisation profile, create opportunities, and later review volunteer matches. Some features are coming soon.";

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
            <p className="dashboard-kicker">Organisation home base</p>

            <h1 id="organisation-dashboard-title" className="dashboard-title">
              <span aria-hidden="true">🏢</span>
              <span>Welcome, {displayName}</span>
            </h1>

            <p className="dashboard-lead">
              This is where organisations will create inclusive volunteering
              opportunities, describe support available, and connect with
              volunteers in a safe and accessible way.
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/organisation/opportunities"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🔎</span>
                  <span>Opportunities</span>
                </span>
              </Link>

              <Link
                href="/organisation/profile"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🏢</span>
                  <span>Organisation profile</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Organisation account">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Account</h2>
                <p>
                  Type: <strong>organisation</strong>
                </p>
              </div>
            </div>

            {emailAddress ? (
              <p className="dashboard-progress-note">{emailAddress}</p>
            ) : (
              <p className="dashboard-progress-note">Email not available.</p>
            )}

            <p className="dashboard-progress-note">
              Organisation tools are being set up in stages.
            </p>
          </aside>
        </section>

        <section className="dashboard-grid" aria-label="Organisation dashboard actions">
          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🏢
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Foundation</p>
              <h2>Organisation profile</h2>
              <p>
                Add your organisation name, location, contact details, purpose
                and inclusive support approach.
              </p>
              <p className="dashboard-muted-action">Coming next</p>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              📣
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Opportunities</p>
              <h2>Create opportunities</h2>
              <p>
                Create volunteering roles with clear tasks, skills, interests,
                accessibility notes and time commitment.
              </p>
              <p className="dashboard-muted-action">Coming soon</p>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              💛
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Inclusion</p>
              <h2>Support and safety</h2>
              <p>
                Describe what support you can offer so volunteers know what to
                expect before they apply.
              </p>
              <p className="dashboard-muted-action">Support-first design</p>
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
                Later, the platform will suggest suitable volunteers based on
                interests, skills, availability and support preferences.
              </p>
              <p className="dashboard-muted-action">Later phase</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
