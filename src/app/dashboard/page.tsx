import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export default async function DashboardPage() {
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
    .single();

  const userType = profile?.user_type ?? "volunteer";
  const displayName = profile?.full_name?.trim() || "there";
  const isVolunteer = userType === "volunteer";

  const listenText =
    "This is your SO Volunteering dashboard. At the top is the SO Volunteering logo, the Listen support, and a Sign out button. The main welcome panel tells you your next step. Below it are pathway cards. The first card is Your profile. It shows your account type and email. The second card is Opportunities. This will help you find inclusive volunteering opportunities. The third card is Wellbeing. This explains that support and safety features are part of the platform.";

  return (
    <main className="dashboard-bg">
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link href="/dashboard" className="dashboard-brand" aria-label="SO Volunteering dashboard">
            <img
              src="/brand/so-volunteering-logo-mark.png"
              alt=""
              className="dashboard-brand-mark"
              aria-hidden="true"
            />
            <span className="dashboard-brand-text">
              <span className="dashboard-brand-name">SO Volunteering</span>
              <span className="dashboard-brand-tagline">Belong • Grow • Thrive</span>
            </span>
          </Link>

          <div className="dashboard-topbar-actions">
            <InclusiveAudioButton text={listenText} />

            <form action={signOut}>
              <button type="submit" className="secondary-button dashboard-signout-button">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🚪</span>
                  <span>Sign out</span>
                </span>
              </button>
            </form>
          </div>
        </header>

        <section className="dashboard-welcome-card" aria-labelledby="dashboard-title">
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Your inclusive pathway</p>

            <h1 id="dashboard-title" className="dashboard-title">
              <span aria-hidden="true">👋</span>
              <span>Welcome, {displayName}</span>
            </h1>

            <p className="dashboard-lead">
              Your volunteering journey is ready. Keep building your profile,
              tell us what support helps you, and move towards opportunities
              that feel right for you.
            </p>

            {isVolunteer ? (
              <div className="dashboard-primary-actions">
                <Link href="/onboarding/volunteer" className="primary-button dashboard-main-action">
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">🌱</span>
                    <span>Continue setup</span>
                  </span>
                </Link>

                <a href="#pathway-cards" className="secondary-button dashboard-main-action">
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">🧭</span>
                    <span>See my pathway</span>
                  </span>
                </a>
              </div>
            ) : (
              <div className="dashboard-primary-actions">
                <a href="#pathway-cards" className="primary-button dashboard-main-action">
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">🏢</span>
                    <span>View dashboard</span>
                  </span>
                </a>
              </div>
            )}
          </div>

          <aside className="dashboard-progress-card" aria-label="Profile progress">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Profile progress</h2>
                <p>Keep going one step at a time.</p>
              </div>
            </div>

            <div className="progress-wrap dashboard-progress-wrap">
              <div className="progress-meta">
                <span>Started</span>
                <span>40%</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span className="progress-fill dashboard-progress-fill" />
              </div>
            </div>

            <p className="dashboard-progress-note">
              Next step: add more about your goals, support needs, skills and
              availability.
            </p>
          </aside>
        </section>

        <section id="pathway-cards" className="dashboard-grid" aria-label="Dashboard pathway cards">
          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              👤
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Step 1</p>
              <h2>Your profile</h2>
              <p>
                Account type: <strong>{userType}</strong>
              </p>
              {profile?.email ? <p>{profile.email}</p> : null}

              {isVolunteer ? (
                <p className="card-action">
                  <Link href="/onboarding/volunteer" className="text-link">
                    Continue volunteer setup
                  </Link>
                </p>
              ) : null}
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              🔎
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Step 2</p>
              <h2>Opportunities</h2>
              <p>
                Browse inclusive volunteering opportunities and start building
                verified experience.
              </p>
              <p className="dashboard-muted-action">Coming soon</p>
            </div>
          </article>

          <article className="info-card dashboard-pathway-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              💛
            </div>

            <div className="dashboard-card-copy">
              <p className="dashboard-card-label">Always available</p>
              <h2>Wellbeing</h2>
              <p>
                Support and safety features are built into the platform from the
                start.
              </p>
              <p className="dashboard-muted-action">Support-first design</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
