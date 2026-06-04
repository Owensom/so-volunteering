import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { expressInterest } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type VolunteerProfile = {
  interests: string[] | null;
  skills: string[] | null;
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
  contact_email: string | null;
  safety_notes: string | null;
  status: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote / online";
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

function ChipList({
  values,
  emptyText
}: {
  values: string[] | null | undefined;
  emptyText: string;
}) {
  if (!Array.isArray(values) || values.length === 0) {
    return <p className="dashboard-muted-action">{emptyText}</p>;
  }

  return (
    <div className="opportunity-chip-list">
      {values.map((value) => (
        <span key={value} className="opportunity-chip">
          {value}
        </span>
      ))}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  title,
  children
}: {
  icon: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="info-card dashboard-pathway-card opportunity-detail-card">
      <div className="dashboard-card-icon opportunity-detail-icon" aria-hidden="true">
        {icon}
      </div>

      <div className="dashboard-card-copy opportunity-detail-copy">
        <div>
          <p className="dashboard-card-label">{label}</p>
          <h2>{title}</h2>
        </div>

        <div className="opportunity-detail-body">{children}</div>
      </div>
    </article>
  );
}

export default async function OpportunityDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const opportunityId = resolvedParams.id;

  const errorMessage = resolvedSearchParams.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : "";

  const successMessage = resolvedSearchParams.message
    ? decodeURIComponent(resolvedSearchParams.message)
    : "";

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
    .select("interests,skills")
    .eq("user_id", user.id)
    .maybeSingle<VolunteerProfile>();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id,title,summary,location_type,location,time_commitment,interests,skills,support_offered,contact_name,contact_email,safety_notes,status"
    )
    .eq("id", opportunityId)
    .eq("status", "published")
    .maybeSingle<Opportunity>();

  if (!opportunity) {
    redirect("/opportunities");
  }

  const { data: existingInterest } = await supabase
    .from("opportunity_interests")
    .select("id")
    .eq("opportunity_id", opportunity.id)
    .eq("volunteer_user_id", user.id)
    .maybeSingle<{ id: string }>();

  const hasAlreadyExpressedInterest = Boolean(existingInterest);

  const interestMatches = countMatches(
    volunteerProfile?.interests,
    opportunity.interests
  );

  const skillMatches = countMatches(volunteerProfile?.skills, opportunity.skills);

  const listenText =
    "This is an opportunity detail page. It explains the volunteering role, location, time commitment, interests, skills, support available, safety notes and contact information. The Express interest section lets you tell the organisation you are interested. You can add an optional message, or leave it blank.";

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
              href="/opportunities"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Opportunities</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="opportunity-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Opportunity details</p>

            <h1 id="opportunity-title" className="dashboard-title">
              <span aria-hidden="true">📣</span>
              <span>{opportunity.title}</span>
            </h1>

            <p className="dashboard-lead">{opportunity.summary}</p>

            <div className="dashboard-primary-actions">
              <a
                href="#express-interest"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🌱</span>
                  <span>Express interest</span>
                </span>
              </a>

              <Link
                href="/opportunities"
                className="secondary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🔎</span>
                  <span>Back to roles</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Match summary">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>May suit you</h2>
                <p>
                  {interestMatches + skillMatches > 0
                    ? "This role has some profile matches."
                    : "Read the details and decide if it feels right."}
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Interest matches: <strong>{interestMatches}</strong>
            </p>
            <p className="dashboard-progress-note">
              Skill matches: <strong>{skillMatches}</strong>
            </p>
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <section
          className="dashboard-grid opportunity-detail-grid"
          aria-label="Opportunity information"
        >
          <DetailCard icon="📍" label="Location" title="Where it happens">
            <p>
              Type:{" "}
              <strong>{formatLocationType(opportunity.location_type)}</strong>
            </p>
            <p>
              Area:{" "}
              <strong>
                {opportunity.location || "No specific location listed"}
              </strong>
            </p>
          </DetailCard>

          <DetailCard icon="🕒" label="Time" title="Time commitment">
            <p>
              <strong>
                {opportunity.time_commitment || "Time commitment not listed"}
              </strong>
            </p>
          </DetailCard>

          <DetailCard icon="💚" label="Interests" title="This role may suit">
            <ChipList
              values={opportunity.interests}
              emptyText="No interests listed for this role."
            />
          </DetailCard>

          <DetailCard icon="⭐" label="Skills" title="Helpful skills">
            <ChipList
              values={opportunity.skills}
              emptyText="No skills listed for this role."
            />
          </DetailCard>

          <DetailCard icon="💛" label="Support" title="Support available">
            <ChipList
              values={opportunity.support_offered}
              emptyText="No support information listed yet."
            />
          </DetailCard>

          <DetailCard icon="🛡️" label="Safety" title="Safety and supervision">
            {opportunity.safety_notes ? (
              <p>{opportunity.safety_notes}</p>
            ) : (
              <p className="dashboard-muted-action">
                No safety notes listed yet.
              </p>
            )}
          </DetailCard>

          <DetailCard icon="👤" label="Contact" title="Who to contact">
            <p>
              Name:{" "}
              <strong>
                {opportunity.contact_name || "Contact name not listed"}
              </strong>
            </p>
            <p>
              Email:{" "}
              <strong>
                {opportunity.contact_email || "Contact email not listed"}
              </strong>
            </p>
          </DetailCard>

          <article
            id="express-interest"
            className="info-card dashboard-pathway-card opportunity-detail-card"
          >
            <div
              className="dashboard-card-icon opportunity-detail-icon"
              aria-hidden="true"
            >
              🌱
            </div>

            <div className="dashboard-card-copy opportunity-detail-copy">
              <div>
                <p className="dashboard-card-label">Applications</p>
                <h2>
                  {hasAlreadyExpressedInterest
                    ? "Interest already sent"
                    : "Express interest"}
                </h2>
              </div>

              <div className="opportunity-detail-body">
                {hasAlreadyExpressedInterest ? (
                  <>
                    <p>
                      You have already told this organisation you are interested
                      in this role.
                    </p>
                    <p className="dashboard-muted-action">
                      The organisation can see your interest.
                    </p>
                  </>
                ) : (
                  <form action={expressInterest} className="form-stack">
                    <input
                      type="hidden"
                      name="opportunity_id"
                      value={opportunity.id}
                    />

                    <label className="field-label">
                      <span className="field-label-row">
                        <span className="field-label-icon" aria-hidden="true">
                          💬
                        </span>
                        <span>Optional message</span>
                      </span>
                      <textarea
                        name="message"
                        rows={4}
                        placeholder="Optional. Example: I am interested in this role and would like to know more."
                      />
                    </label>

                    <button type="submit" className="primary-button">
                      <span className="button-balanced-inner">
                        <span aria-hidden="true">🌱</span>
                        <span>I’m interested</span>
                      </span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </article>
        </section>
      </section>

      <style>{`
        .opportunity-detail-grid {
          align-items: stretch;
        }

        .opportunity-detail-card {
          min-height: 210px;
          height: 100%;
          align-items: stretch;
        }

        .opportunity-detail-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          gap: 18px;
        }

        .opportunity-detail-body {
          display: grid;
          gap: 10px;
          color: #5d6677;
          line-height: 1.55;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .opportunity-detail-body p {
          margin: 0;
        }

        .opportunity-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-start;
        }

        .opportunity-chip {
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
          .opportunity-detail-card {
            min-height: 0;
          }

          .opportunity-detail-copy {
            gap: 14px;
          }

          .opportunity-chip-list {
            gap: 8px;
          }

          .opportunity-chip {
            border-radius: 18px;
            font-size: 0.86rem;
          }
        }
      `}</style>
    </main>
  );
}
