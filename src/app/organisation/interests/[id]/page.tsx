import Link from "next/link";
import { redirect } from "next/navigation";
import { updateInterestStatus } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type InterestRow = {
  id: string;
  opportunity_id: string;
  volunteer_name: string | null;
  volunteer_email: string | null;
  volunteer_city: string | null;
  volunteer_goals: string[] | null;
  volunteer_interests: string[] | null;
  volunteer_skills: string[] | null;
  volunteer_support_shared: boolean | null;
  volunteer_support_needs: string | null;
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
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function formatStatus(status: string) {
  if (status === "reviewed") return "Reviewed";
  if (status === "contacted") return "Contacted";
  if (status === "closed") return "Closed";
  return "New";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
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
    <div className="interest-chip-list">
      {values.map((value) => (
        <span key={value} className="interest-chip">
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
    <article className="info-card dashboard-pathway-card interest-detail-card">
      <div
        className="dashboard-card-icon interest-detail-icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="dashboard-card-copy interest-detail-copy">
        <div>
          <p className="dashboard-card-label">{label}</p>
          <h2>{title}</h2>
        </div>

        <div className="interest-detail-body">{children}</div>
      </div>
    </article>
  );
}

export default async function OrganisationInterestDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const interestId = resolvedParams.id;

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

  if (userType !== "organisation") {
    redirect("/dashboard");
  }

  const { data: interest } = await supabase
    .from("opportunity_interests")
    .select(
      "id,opportunity_id,volunteer_name,volunteer_email,volunteer_city,volunteer_goals,volunteer_interests,volunteer_skills,volunteer_support_shared,volunteer_support_needs,message,status,created_at"
    )
    .eq("id", interestId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<InterestRow>();

  if (!interest) {
    redirect("/organisation/interests");
  }

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,summary,location_type,location,time_commitment,status")
    .eq("id", interest.opportunity_id)
    .eq("organisation_user_id", user.id)
    .maybeSingle<OpportunityRow>();

  const listenText =
    "You are on a volunteer interest detail page. First, read the volunteer name and current status at the top. Use the Back to inbox button if you want to return to the interest inbox. Use the Open role button to view the volunteering role this person is interested in. The cards below show the role, volunteer contact details, their supporting statement if they wrote one, their goals, interests, skills and shared support information. If support preferences were not shared, the support card will say that clearly. When you have reviewed the details, go to the Update status card. Choose New, Reviewed, Contacted or Closed. Use Reviewed when you have looked at the interest. Use Contacted when you have contacted the volunteer outside the platform. Use Closed when the interest no longer needs action. Press Save status to update the inbox and dashboard counts.";

  return (
    <main className="dashboard-bg">
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/organisation/dashboard"
            className="dashboard-brand"
            aria-label="Back to organisation dashboard"
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
              href="/organisation/interests"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Interest inbox</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card"
          aria-labelledby="interest-detail-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Volunteer interest</p>

            <h1 id="interest-detail-title" className="dashboard-title">
              <span aria-hidden="true">📬</span>
              <span>{interest.volunteer_name || "Volunteer"}</span>
            </h1>

            <p className="dashboard-lead">
              Review this volunteer’s interest before deciding the next step.
              Keep contact kind, clear and supportive.
            </p>

            <div className="dashboard-primary-actions">
              <Link
                href="/organisation/interests"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📬</span>
                  <span>Back to inbox</span>
                </span>
              </Link>

              {opportunity ? (
                <Link
                  href={`/organisation/opportunities/${opportunity.id}`}
                  className="secondary-button dashboard-main-action"
                >
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">📣</span>
                    <span>Open role</span>
                  </span>
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Interest status">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Status</h2>
                <p>
                  Current: <strong>{formatStatus(interest.status)}</strong>
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Update the status when this interest has been reviewed or handled.
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
          className="dashboard-grid interest-detail-grid"
          aria-label="Interest detail"
        >
          <DetailCard icon="📣" label="Role" title="Opportunity">
            {opportunity ? (
              <>
                <p>
                  Role: <strong>{opportunity.title}</strong>
                </p>
                <p>{opportunity.summary}</p>
                <p className="dashboard-muted-action">
                  {formatLocationType(opportunity.location_type)}
                  {opportunity.location ? ` · ${opportunity.location}` : ""}
                  {opportunity.time_commitment
                    ? ` · ${opportunity.time_commitment}`
                    : ""}
                </p>
              </>
            ) : (
              <p className="dashboard-muted-action">
                This opportunity could not be loaded.
              </p>
            )}
          </DetailCard>

          <DetailCard icon="👤" label="Volunteer" title="Contact details">
            <p>
              Name:{" "}
              <strong>
                {interest.volunteer_name || "Volunteer name not shared"}
              </strong>
            </p>
            <p>
              Email:{" "}
              <strong>{interest.volunteer_email || "Email not available"}</strong>
            </p>
            <p>
              Area: <strong>{interest.volunteer_city || "Area not shared"}</strong>
            </p>
          </DetailCard>

          <DetailCard icon="💬" label="Statement" title="Supporting statement">
            {interest.message ? (
              <p>{interest.message}</p>
            ) : (
              <p className="dashboard-muted-action">
                No supporting statement was added.
              </p>
            )}
          </DetailCard>

          <DetailCard icon="🌱" label="Goals" title="Volunteer goals">
            <ChipList
              values={interest.volunteer_goals}
              emptyText="No goals shared."
            />
          </DetailCard>

          <DetailCard icon="💚" label="Interests" title="Volunteer interests">
            <ChipList
              values={interest.volunteer_interests}
              emptyText="No interests shared."
            />
          </DetailCard>

          <DetailCard icon="⭐" label="Skills" title="Volunteer skills">
            <ChipList
              values={interest.volunteer_skills}
              emptyText="No skills shared."
            />
          </DetailCard>

          <DetailCard icon="💛" label="Support" title="Shared support">
            {interest.volunteer_support_shared &&
            interest.volunteer_support_needs ? (
              <p>{interest.volunteer_support_needs}</p>
            ) : (
              <p className="dashboard-muted-action">
                Support preferences were not shared with organisations.
              </p>
            )}
          </DetailCard>

          <article className="info-card dashboard-pathway-card interest-detail-card">
            <div
              className="dashboard-card-icon interest-detail-icon"
              aria-hidden="true"
            >
              ✅
            </div>

            <div className="dashboard-card-copy interest-detail-copy">
              <div>
                <p className="dashboard-card-label">Manage</p>
                <h2>Update status</h2>
              </div>

              <div className="interest-detail-body">
                <form action={updateInterestStatus} className="form-stack">
                  <input type="hidden" name="interest_id" value={interest.id} />

                  <label className="field-label">
                    <span className="field-label-row">
                      <span className="field-label-icon" aria-hidden="true">
                        📌
                      </span>
                      <span>Interest status</span>
                    </span>
                    <select name="status" defaultValue={interest.status}>
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </label>

                  <button type="submit" className="primary-button">
                    <span className="button-balanced-inner">
                      <span aria-hidden="true">✅</span>
                      <span>Save status</span>
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </article>
        </section>
      </section>

      <style>{`
        .interest-detail-grid {
          align-items: stretch;
        }

        .interest-detail-card {
          min-height: 228px;
          height: 100%;
          align-items: stretch;
        }

        .interest-detail-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          gap: 18px;
        }

        .interest-detail-body {
          display: grid;
          gap: 10px;
          color: #5d6677;
          line-height: 1.55;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .interest-detail-body p {
          margin: 0;
        }

        .interest-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-start;
        }

        .interest-chip {
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
          .interest-detail-card {
            min-height: 0;
          }

          .interest-detail-copy {
            gap: 14px;
          }

          .interest-chip-list {
            gap: 8px;
          }

          .interest-chip {
            border-radius: 18px;
            font-size: 0.86rem;
          }
        }
      `}</style>
    </main>
  );
}
