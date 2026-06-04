import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  full_name: string | null;
  email: string | null;
  user_type: string | null;
};

type VolunteerProfile = {
  city: string | null;
  goals: string[] | null;
  interests: string[] | null;
  skills: string[] | null;
  bio: string | null;
  support_needs: string | null;
  share_accessibility_needs: boolean | null;
  wants_wellbeing_support: boolean | null;
  availability_notes: string | null;
  preferred_contact_method: string | null;
  onboarding_completed: boolean | null;
};

function SummaryList({
  values,
  emptyText
}: {
  values: string[] | null;
  emptyText: string;
}) {
  if (!Array.isArray(values) || values.length === 0) {
    return <p className="dashboard-muted-action">{emptyText}</p>;
  }

  return (
    <div className="profile-summary-chip-list">
      {values.map((value) => (
        <span key={value} className="profile-summary-chip">
          {value}
        </span>
      ))}
    </div>
  );
}

function TextSummary({
  value,
  emptyText
}: {
  value: string | null;
  emptyText: string;
}) {
  if (!value || !value.trim()) {
    return <p className="dashboard-muted-action">{emptyText}</p>;
  }

  return <p className="profile-summary-text">{value}</p>;
}

function ProfileSection({
  icon,
  label,
  title,
  href,
  children
}: {
  icon: string;
  label: string;
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <article className="info-card dashboard-pathway-card profile-summary-card">
      <div className="dashboard-card-icon profile-summary-icon" aria-hidden="true">
        {icon}
      </div>

      <div className="dashboard-card-copy profile-summary-copy">
        <div className="profile-summary-main">
          <p className="dashboard-card-label">{label}</p>
          <h2>{title}</h2>

          <div className="profile-section-body">{children}</div>
        </div>

        <p className="card-action profile-summary-action">
          <Link href={href} className="text-link">
            Edit this section
          </Link>
        </p>
      </div>
    </article>
  );
}

function formatContactMethod(value: string | null) {
  if (!value) return "Not chosen yet";

  if (value === "text_message") return "Text message";
  if (value === "not_sure") return "I am not sure yet";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function ProfilePage() {
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
    .single<Profile>();

  const { data: volunteerProfile } = await supabase
    .from("volunteer_profiles")
    .select(
      "city,goals,interests,skills,bio,support_needs,share_accessibility_needs,wants_wellbeing_support,availability_notes,preferred_contact_method,onboarding_completed"
    )
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const displayName = profile?.full_name?.trim() || "there";
  const userType = profile?.user_type ?? "volunteer";
  const emailAddress = profile?.email?.trim() || user.email || "";

  const listenText =
    "This is your SO Volunteering profile summary. It shows the information you have added during setup. The first section shows your goals and nearest town or city. The next sections show your interests, skills, support preferences and availability. Each section has an edit link so you can change your answers.";

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
          aria-labelledby="profile-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Your profile summary</p>

            <h1 id="profile-title" className="dashboard-title">
              <span aria-hidden="true">👤</span>
              <span>{displayName}</span>
            </h1>

            <p className="dashboard-lead">
              This is the information you have added so far. You can review it,
              change it, and keep building your volunteering pathway over time.
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/onboarding/volunteer"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">✏️</span>
                  <span>Edit setup</span>
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🧭</span>
                  <span>Back to dashboard</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Account details">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Account</h2>
                <p>
                  Type: <strong>{userType}</strong>
                </p>
              </div>
            </div>

            {emailAddress ? (
              <p className="dashboard-progress-note">{emailAddress}</p>
            ) : (
              <p className="dashboard-progress-note">Email not available.</p>
            )}

            <p className="dashboard-progress-note">
              Setup status:{" "}
              <strong>
                {volunteerProfile?.onboarding_completed
                  ? "Complete"
                  : "In progress"}
              </strong>
            </p>
          </aside>
        </section>

        <section
          className="dashboard-grid profile-summary-grid"
          aria-label="Volunteer profile summary sections"
        >
          <ProfileSection
            icon="🌱"
            label="Goals"
            title="What you want to achieve"
            href="/onboarding/volunteer"
          >
            {volunteerProfile?.city ? (
              <p>
                Nearest town or city: <strong>{volunteerProfile.city}</strong>
              </p>
            ) : (
              <p className="dashboard-muted-action">
                Nearest town or city not added yet.
              </p>
            )}

            <SummaryList
              values={volunteerProfile?.goals ?? null}
              emptyText="No goals added yet."
            />
          </ProfileSection>

          <ProfileSection
            icon="💚"
            label="Interests"
            title="What you enjoy or might like to try"
            href="/onboarding/volunteer/interests"
          >
            <SummaryList
              values={volunteerProfile?.interests ?? null}
              emptyText="No interests added yet."
            />
          </ProfileSection>

          <ProfileSection
            icon="⭐"
            label="Skills"
            title="What you can do or want to build"
            href="/onboarding/volunteer/skills"
          >
            <SummaryList
              values={volunteerProfile?.skills ?? null}
              emptyText="No skills added yet."
            />

            {volunteerProfile?.bio ? (
              <div className="profile-note-block">
                <p className="dashboard-card-label">Your notes</p>
                <TextSummary
                  value={volunteerProfile.bio}
                  emptyText="No extra notes added."
                />
              </div>
            ) : null}
          </ProfileSection>

          <ProfileSection
            icon="💛"
            label="Support"
            title="What helps you feel comfortable"
            href="/onboarding/volunteer/accessibility"
          >
            <TextSummary
              value={volunteerProfile?.support_needs ?? null}
              emptyText="No support preferences added yet."
            />

            <div className="profile-summary-chip-list">
              <span className="profile-summary-chip">
                {volunteerProfile?.share_accessibility_needs
                  ? "Can share with organisations"
                  : "Private for now"}
              </span>

              <span className="profile-summary-chip">
                {volunteerProfile?.wants_wellbeing_support
                  ? "Wellbeing reminders wanted"
                  : "No wellbeing reminders"}
              </span>
            </div>
          </ProfileSection>

          <ProfileSection
            icon="📅"
            label="Availability"
            title="When volunteering might work"
            href="/onboarding/volunteer/availability"
          >
            <TextSummary
              value={volunteerProfile?.availability_notes ?? null}
              emptyText="No availability added yet."
            />

            <p>
              Preferred contact:{" "}
              <strong>
                {formatContactMethod(
                  volunteerProfile?.preferred_contact_method ?? null
                )}
              </strong>
            </p>
          </ProfileSection>

          <article className="info-card dashboard-pathway-card profile-summary-card">
            <div
              className="dashboard-card-icon profile-summary-icon"
              aria-hidden="true"
            >
              🔎
            </div>

            <div className="dashboard-card-copy profile-summary-copy">
              <div className="profile-summary-main">
                <p className="dashboard-card-label">Coming soon</p>
                <h2>Opportunity matching</h2>
                <div className="profile-section-body">
                  <p>
                    Your profile will help match you with inclusive volunteering
                    opportunities when the opportunity system is added.
                  </p>
                </div>
              </div>

              <p className="dashboard-muted-action profile-summary-action">
                Not live yet
              </p>
            </div>
          </article>
        </section>
      </section>

      <style>{`
        .profile-summary-grid {
          align-items: stretch;
        }

        .profile-summary-card {
          min-height: 244px;
          height: 100%;
          align-items: stretch;
        }

        .profile-summary-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .profile-summary-main {
          display: grid;
          gap: 10px;
        }

        .profile-summary-main h2 {
          margin-bottom: 0;
        }

        .profile-section-body {
          display: grid;
          gap: 10px;
          color: #5d6677;
          line-height: 1.5;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .profile-section-body p {
          margin: 0;
        }

        .profile-summary-action {
          margin-top: auto !important;
        }

        .profile-summary-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-start;
        }

        .profile-summary-chip {
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
        }

        @media (max-width: 640px) {
          .profile-summary-card {
            min-height: 0;
          }

          .profile-summary-copy {
            gap: 14px;
          }

          .profile-summary-chip-list {
            gap: 8px;
          }

          .profile-summary-chip {
            border-radius: 18px;
            font-size: 0.86rem;
          }
        }
      `}</style>
    </main>
  );
}
