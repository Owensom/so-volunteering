import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SupportAdminRow = {
  user_id: string;
};

type SupportRequestStatus = "new" | "reviewing" | "resolved" | "closed";

type RecentSupportRequestRow = {
  id: string;
  user_type: string;
  name: string | null;
  email: string | null;
  category: string;
  status: string;
  created_at: string;
};

async function getSupportRequestCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  status?: SupportRequestStatus,
) {
  let query = supabase
    .from("support_requests")
    .select("id", { count: "exact", head: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { count, error } = await query;

  if (error) {
    return null;
  }

  return count ?? 0;
}

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
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function getRequestIcon(category: string) {
  if (category === "safety_or_safeguarding") return "🛡️";
  if (category === "something_not_working") return "🛠️";
  if (category === "account_or_profile") return "👤";
  if (category === "opportunity_help") return "📣";
  if (category === "report_problem") return "⚠️";
  return "🧭";
}

function getStatusClass(status: string) {
  if (status === "resolved") return "request-status status-resolved";
  if (status === "closed") return "request-status status-closed";
  if (status === "reviewing") return "request-status status-reviewing";
  return "request-status status-new";
}

export default async function OwnerHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
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

  const [
    totalRequests,
    newRequests,
    reviewingRequests,
    resolvedRequests,
    recentRequestsResult,
  ] = await Promise.all([
    getSupportRequestCount(supabase),
    getSupportRequestCount(supabase, "new"),
    getSupportRequestCount(supabase, "reviewing"),
    getSupportRequestCount(supabase, "resolved"),
    supabase
      .from("support_requests")
      .select("id,user_type,name,email,category,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const recentRequests =
    (recentRequestsResult.data as RecentSupportRequestRow[] | null) ?? [];

  return (
    <main className="owner-page">
      <style>{styles}</style>

      <section className="owner-shell">
        <header className="owner-topbar" aria-label="Owner navigation">
          <Link href="/organisation/dashboard" className="owner-brand">
            <img
              src="/brand/so-volunteering-logo-mark.png"
              alt=""
              className="owner-brand-mark"
              aria-hidden="true"
            />
            <span className="owner-brand-text">
              <span className="owner-brand-name">SO Volunteering</span>
              <span className="owner-brand-tagline">
                Belong • Grow • Thrive
              </span>
            </span>
          </Link>

          <div className="owner-topbar-actions">
            <Link href="/organisation/dashboard" className="secondary-button">
              <span aria-hidden="true">←</span>
              <span>Back to workspace</span>
            </Link>

            <Link href="/help" className="ghost-button">
              <span aria-hidden="true">🧭</span>
              <span>Open help page</span>
            </Link>
          </div>
        </header>

        <section className="owner-hero">
          <div className="owner-hero-copy">
            <p className="eyebrow">Owner tools</p>
            <h1>Owner access</h1>
            <p>
              A separate owner-only space for app support, platform oversight
              and future operational tools.
            </p>

            <div className="owner-hero-actions">
              <Link href="/admin/app-help" className="primary-button">
                <span aria-hidden="true">💬</span>
                <span>Open App Help Inbox</span>
              </Link>

              <Link href="/admin/app-help?status=new" className="secondary-button">
                <span aria-hidden="true">🆕</span>
                <span>View new requests</span>
              </Link>
            </div>
          </div>

          <aside className="owner-status-card">
            <span className="owner-status-icon" aria-hidden="true">
              🛡️
            </span>
            <div>
              <h2>Protected owner area</h2>
              <p>
                This route is only available to approved support-admin users.
                Normal volunteers and organisations are redirected away.
              </p>
            </div>
          </aside>
        </section>

        <div className="stats-grid" aria-label="App help summary">
          <Link href="/admin/app-help" className="stat-card stat-link">
            <span>Total requests</span>
            <strong>{totalRequests ?? "—"}</strong>
          </Link>

          <Link
            href="/admin/app-help?status=new"
            className="stat-card stat-link attention"
          >
            <span>New</span>
            <strong>{newRequests ?? "—"}</strong>
          </Link>

          <Link
            href="/admin/app-help?status=reviewing"
            className="stat-card stat-link"
          >
            <span>Reviewing</span>
            <strong>{reviewingRequests ?? "—"}</strong>
          </Link>

          <Link
            href="/admin/app-help?status=resolved"
            className="stat-card stat-link"
          >
            <span>Resolved</span>
            <strong>{resolvedRequests ?? "—"}</strong>
          </Link>
        </div>

        <section className="owner-grid" aria-label="Owner tools">
          <Link href="/admin/app-help" className="tool-card primary-tool">
            <span className="tool-icon" aria-hidden="true">
              💬
            </span>
            <span className="tool-content">
              <span className="tool-title">App Help Inbox</span>
              <span className="tool-text">
                View and update help requests from volunteers and organisations.
              </span>
            </span>
            <span className="tool-arrow" aria-hidden="true">
              →
            </span>
          </Link>

          <div className="tool-card muted-tool" aria-disabled="true">
            <span className="tool-icon" aria-hidden="true">
              🧭
            </span>
            <span className="tool-content">
              <span className="tool-title">Owner dashboard</span>
              <span className="tool-text">
                Future home for platform-level checks, account review and
                support workflow summaries.
              </span>
            </span>
            <span className="coming-soon">Later</span>
          </div>

          <div className="tool-card muted-tool" aria-disabled="true">
            <span className="tool-icon" aria-hidden="true">
              📣
            </span>
            <span className="tool-content">
              <span className="tool-title">Support operations</span>
              <span className="tool-text">
                Planned tools for notes, contact actions, internal triage and
                support status tracking.
              </span>
            </span>
            <span className="coming-soon">Later</span>
          </div>
        </section>

        <section className="recent-panel" aria-labelledby="recent-requests-title">
          <div className="recent-panel-header">
            <div>
              <p className="eyebrow">Latest activity</p>
              <h2 id="recent-requests-title">Recent App Help requests</h2>
              <p>
                Quick view of the latest requests submitted through Help using
                the app.
              </p>
            </div>

            <Link href="/admin/app-help" className="secondary-button">
              <span>View full inbox</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {recentRequestsResult.error ? (
            <div className="owner-alert">
              Recent requests could not be loaded. Open the full inbox to check
              requests.
            </div>
          ) : null}

          {!recentRequestsResult.error && recentRequests.length === 0 ? (
            <article className="empty-recent-card">
              <span aria-hidden="true">✅</span>
              <div>
                <h3>No app help requests yet</h3>
                <p>
                  When a volunteer or organisation submits Help using the app,
                  the latest requests will appear here.
                </p>
              </div>
            </article>
          ) : null}

          {recentRequests.length > 0 ? (
            <div className="recent-list">
              {recentRequests.map((request) => (
                <Link
                  key={request.id}
                  href="/admin/app-help"
                  className={
                    request.category === "safety_or_safeguarding"
                      ? "recent-request-card safety-recent-card"
                      : "recent-request-card"
                  }
                >
                  <span className="recent-icon" aria-hidden="true">
                    {getRequestIcon(request.category)}
                  </span>

                  <span className="recent-copy">
                    <span className="recent-title">
                      {formatCategory(request.category)}
                    </span>
                    <span className="recent-meta">
                      {formatUserType(request.user_type)} •{" "}
                      {request.name || request.email || "No name supplied"} •{" "}
                      {formatDate(request.created_at)}
                    </span>
                  </span>

                  <span className={getStatusClass(request.status)}>
                    {formatStatus(request.status)}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="safety-panel">
          <div>
            <p className="eyebrow">Current owner home</p>
            <h2>Temporary but production-safe</h2>
            <p>
              This page is intentionally simple for now. It gives owner/support
              admins a clean entry point to the App Help inbox without exposing
              owner tools inside the normal organisation dashboard.
            </p>
          </div>

          <div className="access-flow" aria-label="Help request flow">
            <span>Volunteer help</span>
            <span>Organisation help</span>
            <strong>Owner inbox</strong>
          </div>
        </section>
      </section>
    </main>
  );
}

const styles = `
.owner-page {
  min-height: 100vh;
  padding: clamp(16px, 4vw, 44px);
  background:
    radial-gradient(circle at top left, rgba(183, 167, 214, 0.22), transparent 34%),
    radial-gradient(circle at top right, rgba(244, 183, 197, 0.18), transparent 30%),
    linear-gradient(135deg, #f7fbf8 0%, #fff8fa 50%, #f8f5ff 100%);
  color: #263238;
}

.owner-page,
.owner-page * {
  box-sizing: border-box;
}

.owner-shell {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  gap: 20px;
}

.owner-topbar,
.owner-hero,
.safety-panel,
.recent-panel {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(143, 178, 158, 0.24);
  box-shadow: 0 24px 70px rgba(38, 50, 56, 0.08);
  border-radius: 32px;
}

.owner-topbar {
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.owner-brand {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.owner-brand-mark {
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex: 0 0 auto;
}

.owner-brand-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.owner-brand-name {
  color: #315f48;
  font-weight: 950;
  letter-spacing: -0.03em;
}

.owner-brand-tagline {
  color: #60706a;
  font-size: 0.86rem;
  font-weight: 800;
}

.owner-topbar-actions,
.owner-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.owner-hero {
  padding: clamp(24px, 5vw, 38px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  align-items: stretch;
  gap: 18px;
}

.owner-hero-copy {
  display: grid;
  align-content: center;
  gap: 14px;
}

.owner-hero h1 {
  margin: 0;
  font-size: clamp(2.2rem, 6vw, 4rem);
  line-height: 0.96;
  letter-spacing: -0.06em;
  color: #315f48;
}

.owner-hero p,
.safety-panel p,
.owner-status-card p,
.recent-panel p,
.empty-recent-card p {
  margin: 0;
  max-width: 680px;
  color: #60706a;
  font-size: 1rem;
  line-height: 1.6;
}

.eyebrow {
  margin: 0;
  color: #7a6aa8 !important;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.78rem !important;
}

.primary-button,
.secondary-button,
.ghost-button {
  min-height: 48px;
  border-radius: 999px;
  padding: 13px 18px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 900;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  touch-action: manipulation;
  text-align: center;
}

.primary-button {
  background: linear-gradient(135deg, #8fb29e, #b7a7d6);
  color: #ffffff;
  box-shadow: 0 16px 34px rgba(143, 178, 158, 0.28);
}

.secondary-button {
  background: #ffffff;
  color: #315f48;
  border: 1px solid rgba(143, 178, 158, 0.38);
}

.ghost-button {
  background: rgba(183, 167, 214, 0.1);
  color: #6c5b9c;
  border: 1px solid rgba(183, 167, 214, 0.28);
}

.primary-button:hover,
.secondary-button:hover,
.ghost-button:hover,
.stat-link:hover,
.recent-request-card:hover {
  transform: translateY(-1px);
}

.owner-status-card {
  min-height: 100%;
  padding: 22px;
  border-radius: 26px;
  background:
    linear-gradient(135deg, rgba(143, 178, 158, 0.14), rgba(183, 167, 214, 0.12)),
    rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(143, 178, 158, 0.22);
  display: grid;
  align-content: start;
  gap: 14px;
}

.owner-status-icon {
  width: 62px;
  height: 62px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 14px 34px rgba(38, 50, 56, 0.08);
}

.owner-status-card h2 {
  margin: 0 0 8px;
  color: #315f48;
  font-size: 1.2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  min-height: 118px;
  padding: 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(143, 178, 158, 0.22);
  box-shadow: 0 16px 48px rgba(38, 50, 56, 0.06);
  display: grid;
  align-content: space-between;
  gap: 16px;
}

.stat-link {
  text-decoration: none;
  transition: transform 160ms ease;
}

.stat-card span {
  color: #60706a;
  font-size: 0.9rem;
  font-weight: 800;
}

.stat-card strong {
  color: #315f48;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  line-height: 1;
  letter-spacing: -0.045em;
}

.stat-card.attention {
  border-color: rgba(244, 183, 197, 0.55);
  background: linear-gradient(135deg, rgba(244, 183, 197, 0.2), rgba(255, 255, 255, 0.9));
}

.owner-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.tool-card {
  min-height: 180px;
  padding: 22px;
  border-radius: 28px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: start;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(143, 178, 158, 0.22);
  box-shadow: 0 18px 54px rgba(38, 50, 56, 0.07);
}

.primary-tool {
  background:
    linear-gradient(135deg, rgba(143, 178, 158, 0.18), rgba(183, 167, 214, 0.16)),
    rgba(255, 255, 255, 0.9);
  border-color: rgba(143, 178, 158, 0.38);
}

.muted-tool {
  opacity: 0.82;
}

.tool-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
  background: rgba(143, 178, 158, 0.14);
}

.tool-content {
  display: grid;
  gap: 8px;
}

.tool-title {
  color: #315f48;
  font-size: 1.05rem;
  font-weight: 950;
}

.tool-text {
  color: #60706a;
  line-height: 1.5;
  font-weight: 650;
}

.tool-arrow {
  color: #6c5b9c;
  font-size: 1.5rem;
  font-weight: 950;
}

.coming-soon {
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(183, 167, 214, 0.12);
  color: #6c5b9c;
  font-size: 0.78rem;
  font-weight: 950;
}

.recent-panel {
  padding: clamp(22px, 4vw, 30px);
  display: grid;
  gap: 18px;
}

.recent-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.recent-panel h2,
.safety-panel h2 {
  margin: 2px 0 8px;
  color: #315f48;
  font-size: 1.25rem;
}

.recent-list {
  display: grid;
  gap: 10px;
}

.recent-request-card,
.empty-recent-card,
.owner-alert {
  border-radius: 22px;
  border: 1px solid rgba(143, 178, 158, 0.18);
  background: rgba(255, 255, 255, 0.76);
  padding: 14px;
}

.recent-request-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  text-decoration: none;
  transition: transform 160ms ease;
}

.safety-recent-card {
  border-color: rgba(190, 90, 30, 0.34);
  background: rgba(255, 248, 240, 0.92);
}

.recent-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: rgba(143, 178, 158, 0.14);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
}

.recent-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.recent-title {
  color: #315f48;
  font-weight: 950;
  overflow-wrap: anywhere;
}

.recent-meta {
  color: #60706a;
  font-size: 0.9rem;
  font-weight: 750;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.request-status {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 8px 11px;
  font-size: 0.82rem;
  font-weight: 950;
  white-space: nowrap;
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

.empty-recent-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: start;
}

.empty-recent-card > span {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: rgba(143, 178, 158, 0.14);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
}

.empty-recent-card h3 {
  margin: 0 0 6px;
  color: #315f48;
}

.owner-alert {
  color: #8a4b16;
  background: rgba(255, 248, 240, 0.92);
  font-weight: 850;
}

.safety-panel {
  padding: clamp(22px, 4vw, 30px);
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}

.access-flow {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.access-flow span,
.access-flow strong {
  border-radius: 999px;
  padding: 10px 13px;
  font-size: 0.86rem;
  font-weight: 900;
  white-space: nowrap;
}

.access-flow span {
  background: rgba(143, 178, 158, 0.13);
  color: #315f48;
}

.access-flow strong {
  background: rgba(183, 167, 214, 0.16);
  color: #6c5b9c;
}

@media (max-width: 900px) {
  .owner-topbar {
    align-items: stretch;
    flex-direction: column;
  }

  .owner-topbar-actions {
    width: 100%;
  }

  .owner-topbar-actions .secondary-button,
  .owner-topbar-actions .ghost-button {
    flex: 1 1 220px;
  }

  .owner-hero {
    grid-template-columns: 1fr;
  }

  .stats-grid,
  .owner-grid {
    grid-template-columns: 1fr 1fr;
  }

  .tool-card {
    min-height: 160px;
  }
}

@media (max-width: 640px) {
  .owner-page {
    padding: 14px;
  }

  .owner-topbar,
  .owner-hero,
  .safety-panel,
  .recent-panel {
    border-radius: 26px;
  }

  .owner-topbar-actions,
  .owner-hero-actions {
    display: grid;
    width: 100%;
  }

  .owner-topbar-actions .secondary-button,
  .owner-topbar-actions .ghost-button,
  .owner-hero-actions .primary-button,
  .owner-hero-actions .secondary-button,
  .recent-panel-header .secondary-button {
    width: 100%;
  }

  .owner-brand-mark {
    width: 44px;
    height: 44px;
  }

  .owner-brand-tagline {
    font-size: 0.8rem;
  }

  .stats-grid,
  .owner-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    min-height: 96px;
  }

  .tool-card {
    grid-template-columns: auto 1fr;
  }

  .tool-arrow,
  .coming-soon {
    grid-column: 2;
    justify-self: start;
  }

  .recent-request-card {
    grid-template-columns: auto 1fr;
    align-items: start;
  }

  .recent-request-card .request-status {
    grid-column: 2;
    justify-self: start;
  }

  .safety-panel {
    align-items: stretch;
  }

  .access-flow {
    display: grid;
  }
}
`;
