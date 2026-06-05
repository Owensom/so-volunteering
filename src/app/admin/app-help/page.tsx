import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { updateAppHelpRequest } from "./actions";

export const dynamic = "force-dynamic";

type SupportAdminRow = {
  user_id: string;
};

type SupportRequestRow = {
  id: string;
  user_id: string | null;
  user_type: string;
  name: string | null;
  email: string | null;
  category: string;
  message: string;
  status: string;
  page_context: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

function formatCategory(category: string) {
  if (category === "stuck_using_app") return "Stuck using the app";
  if (category === "something_not_working") return "Something is not working";
  if (category === "account_or_profile") return "Account or profile help";
  if (category === "opportunity_help") return "Opportunity help";
  if (category === "report_problem") return "Report a problem";
  if (category === "safety_or_safeguarding") {
    return "Safety or safeguarding concern";
  }

  return category;
}

function formatStatus(status: string) {
  if (status === "reviewing") return "Reviewing";
  if (status === "resolved") return "Resolved";
  if (status === "closed") return "Closed";
  return "New";
}

function formatUserType(userType: string) {
  if (userType === "organisation") return "Organisation";
  if (userType === "volunteer") return "Volunteer";
  return "Unknown";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London"
  }).format(new Date(value));
}

function getStatusClass(status: string) {
  if (status === "resolved") return "app-help-status status-resolved";
  if (status === "closed") return "app-help-status status-closed";
  if (status === "reviewing") return "app-help-status status-reviewing";
  return "app-help-status status-new";
}

function getCategoryIcon(category: string) {
  if (category === "safety_or_safeguarding") return "🛡️";
  if (category === "something_not_working") return "🛠️";
  if (category === "account_or_profile") return "👤";
  if (category === "opportunity_help") return "📣";
  if (category === "report_problem") return "⚠️";
  return "🧭";
}

export default async function AdminAppHelpPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";
  const successMessage = params.message ? decodeURIComponent(params.message) : "";

  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: supportAdmin } = await supabase
    .from("support_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle<SupportAdminRow>();

  if (!supportAdmin) {
    redirect("/dashboard");
  }

  const { data: requests, error } = await supabase
    .from("support_requests")
    .select(
      "id,user_id,user_type,name,email,category,message,status,page_context,admin_note,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const requestRows = (requests as SupportRequestRow[] | null) ?? [];

  const newCount = requestRows.filter((request) => request.status === "new")
    .length;
  const reviewingCount = requestRows.filter(
    (request) => request.status === "reviewing"
  ).length;
  const safetyCount = requestRows.filter(
    (request) => request.category === "safety_or_safeguarding"
  ).length;

  const listenText =
    "You are on the admin app help inbox. This page shows help requests submitted through Help using the app. Use the Back to workspace button to return to your organisation dashboard. Review new requests first. Safety or safeguarding concerns should be checked as soon as possible. Each card shows the user type, name, email, category, page area, message and status. You can update the status and add an internal note. This page is only for app help requests, not volunteer personal support needs.";

  return (
    <main className="dashboard-bg app-help-admin-page">
      <section className="dashboard-shell">
        <header className="dashboard-topbar app-help-admin-topbar">
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

          <div className="dashboard-topbar-actions app-help-admin-topbar-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href="/organisation/dashboard"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Back to workspace</span>
              </span>
            </Link>

            <Link
              href="/help"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">🧭</span>
                <span>Open help page</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card app-help-admin-hero"
          aria-labelledby="admin-app-help-title"
        >
          <div className="dashboard-welcome-copy app-help-admin-copy">
            <p className="dashboard-kicker">Owner tools</p>

            <h1 id="admin-app-help-title" className="dashboard-title">
              <span aria-hidden="true">🧭</span>
              <span>App help inbox</span>
            </h1>

            <p className="dashboard-lead">
              View help requests from volunteers and organisations. Keep this
              separate from volunteer wellbeing and support preferences.
            </p>

            <div className="dashboard-primary-actions app-help-admin-actions">
              <Link href="/organisation/dashboard" className="primary-button">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">←</span>
                  <span>Back to workspace</span>
                </span>
              </Link>

              <Link href="/help" className="secondary-button">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">🧭</span>
                  <span>Open help page</span>
                </span>
              </Link>
            </div>

            <div className="app-help-admin-stats" aria-label="Help request summary">
              <span>New: {newCount}</span>
              <span>Reviewing: {reviewingCount}</span>
              <span>Safety: {safetyCount}</span>
            </div>
          </div>

          <aside className="dashboard-progress-card app-help-admin-note">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                🛡️
              </span>
              <div>
                <h2>Safety note</h2>
                <p>This inbox is not a live emergency service.</p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Safety or safeguarding requests should be checked promptly and
              handled outside the app if urgent action is needed.
            </p>
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage || error ? (
          <div className="alert alert-error">
            {errorMessage || error?.message}
          </div>
        ) : null}

        <section className="app-help-request-list" aria-label="Help requests">
          {requestRows.length === 0 ? (
            <article className="info-card app-help-empty-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                ✅
              </div>
              <div className="dashboard-card-copy">
                <p className="dashboard-card-label">No requests</p>
                <h2>No app help requests yet</h2>
                <p>
                  When a volunteer or organisation submits Help using the app,
                  the request will appear here.
                </p>
              </div>
            </article>
          ) : null}

          {requestRows.map((request) => (
            <article
              key={request.id}
              className={
                request.category === "safety_or_safeguarding"
                  ? "info-card app-help-request-card safety-request-card"
                  : "info-card app-help-request-card"
              }
            >
              <div className="app-help-request-header">
                <div className="app-help-request-title-row">
                  <span className="dashboard-card-icon" aria-hidden="true">
                    {getCategoryIcon(request.category)}
                  </span>

                  <div>
                    <p className="dashboard-card-label">
                      {formatUserType(request.user_type)}
                    </p>
                    <h2>{formatCategory(request.category)}</h2>
                  </div>
                </div>

                <span className={getStatusClass(request.status)}>
                  {formatStatus(request.status)}
                </span>
              </div>

              <div className="app-help-request-meta">
                <p>
                  <strong>Name:</strong> {request.name || "Not supplied"}
                </p>
                <p>
                  <strong>Email:</strong> {request.email || "Not supplied"}
                </p>
                <p>
                  <strong>Page / area:</strong>{" "}
                  {request.page_context || "Not supplied"}
                </p>
                <p>
                  <strong>Submitted:</strong> {formatDate(request.created_at)}
                </p>
                <p>
                  <strong>Updated:</strong> {formatDate(request.updated_at)}
                </p>
              </div>

              <div className="app-help-message-box">
                <p className="dashboard-card-label">Message</p>
                <p>{request.message}</p>
              </div>

              <form action={updateAppHelpRequest} className="app-help-update-form">
                <input type="hidden" name="request_id" value={request.id} />

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      📌
                    </span>
                    <span>Status</span>
                  </span>
                  <select name="status" defaultValue={request.status}>
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      📝
                    </span>
                    <span>Internal note</span>
                  </span>
                  <textarea
                    name="admin_note"
                    rows={3}
                    defaultValue={request.admin_note || ""}
                    placeholder="Optional internal note. This is for owner/admin tracking."
                  />
                </label>

                <button type="submit" className="primary-button">
                  <span className="button-balanced-inner">
                    <span aria-hidden="true">✅</span>
                    <span>Save update</span>
                  </span>
                </button>
              </form>
            </article>
          ))}
        </section>
      </section>

      <style>{`
        .app-help-admin-page,
        .app-help-admin-page * {
          box-sizing: border-box;
        }

        .app-help-admin-actions {
          gap: 12px;
          margin-top: 6px;
        }

        .app-help-admin-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .app-help-admin-stats span {
          display: inline-flex;
          min-height: 36px;
          align-items: center;
          padding: 8px 12px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.86);
          color: #536f63;
          font-weight: 900;
          line-height: 1.15;
        }

        .app-help-request-list {
          display: grid;
          gap: 18px;
        }

        .app-help-empty-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 18px;
          align-items: start;
        }

        .app-help-request-card {
          display: grid;
          gap: 18px;
          border-radius: 28px;
        }

        .safety-request-card {
          border-color: rgba(190, 90, 30, 0.34);
          background: rgba(255, 248, 240, 0.92);
        }

        .app-help-request-header {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: flex-start;
          justify-content: space-between;
        }

        .app-help-request-title-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
          min-width: 0;
        }

        .app-help-request-title-row h2 {
          margin: 0;
          overflow-wrap: anywhere;
        }

        .app-help-status {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 0.86rem;
          font-weight: 950;
          line-height: 1.1;
        }

        .status-new {
          border: 1px solid rgba(190, 118, 76, 0.26);
          background: rgba(255, 248, 240, 0.96);
          color: #8a4b16;
        }

        .status-reviewing {
          border: 1px solid rgba(74, 112, 160, 0.24);
          background: rgba(239, 247, 255, 0.96);
          color: #315f8a;
        }

        .status-resolved {
          border: 1px solid rgba(83, 111, 99, 0.24);
          background: rgba(244, 255, 249, 0.96);
          color: #536f63;
        }

        .status-closed {
          border: 1px solid rgba(100, 100, 110, 0.18);
          background: rgba(248, 248, 252, 0.96);
          color: #5d6677;
        }

        .app-help-request-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 14px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.66);
        }

        .app-help-request-meta p {
          margin: 0;
          color: #5d6677;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .app-help-message-box {
          display: grid;
          gap: 8px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.74);
        }

        .app-help-message-box p {
          margin: 0;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.5;
        }

        .app-help-update-form {
          display: grid;
          gap: 14px;
        }

        .app-help-update-form .primary-button {
          width: fit-content;
        }

        @media (max-width: 760px) {
          .app-help-admin-topbar {
            gap: 14px;
          }

          .app-help-admin-topbar-actions {
            width: 100%;
            justify-content: stretch;
          }

          .app-help-admin-topbar-actions > *,
          .app-help-admin-topbar-actions a,
          .app-help-admin-topbar-actions button {
            width: 100%;
          }

          .app-help-admin-hero {
            padding: 24px 20px;
          }

          .app-help-admin-hero .dashboard-title {
            font-size: 2.2rem !important;
            line-height: 1.04 !important;
          }

          .app-help-admin-hero .dashboard-lead {
            font-size: 1.02rem !important;
            line-height: 1.48 !important;
          }

          .app-help-admin-actions {
            width: 100%;
          }

          .app-help-admin-actions .primary-button,
          .app-help-admin-actions .secondary-button {
            width: 100%;
          }

          .app-help-admin-note {
            padding: 18px;
          }

          .app-help-request-card {
            padding: 20px;
          }

          .app-help-request-header {
            display: grid;
            gap: 14px;
          }

          .app-help-request-title-row {
            grid-template-columns: 1fr;
          }

          .app-help-request-meta {
            grid-template-columns: 1fr;
          }

          .app-help-update-form .primary-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
