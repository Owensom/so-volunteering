import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SupportAdminRow = {
  user_id: string;
};

type SupportRequestStatus = "new" | "reviewing" | "resolved" | "closed";

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

  const [totalRequests, newRequests, reviewingRequests, resolvedRequests] =
    await Promise.all([
      getSupportRequestCount(supabase),
      getSupportRequestCount(supabase, "new"),
      getSupportRequestCount(supabase, "reviewing"),
      getSupportRequestCount(supabase, "resolved"),
    ]);

  return (
    <main className="owner-page">
      <style>{styles}</style>

      <section className="owner-shell">
        <div className="owner-hero">
          <div>
            <p className="eyebrow">SO Volunteering</p>
            <h1>Owner access</h1>
            <p>
              A separate owner-only space for app support, platform oversight
              and future operational tools.
            </p>
          </div>

          <Link href="/admin/app-help" className="primary-button">
            Open App Help Inbox
          </Link>
        </div>

        <div className="stats-grid" aria-label="App help summary">
          <div className="stat-card">
            <span>Total requests</span>
            <strong>{totalRequests ?? "—"}</strong>
          </div>

          <div className="stat-card attention">
            <span>New</span>
            <strong>{newRequests ?? "—"}</strong>
          </div>

          <div className="stat-card">
            <span>Reviewing</span>
            <strong>{reviewingRequests ?? "—"}</strong>
          </div>

          <div className="stat-card">
            <span>Resolved</span>
            <strong>{resolvedRequests ?? "—"}</strong>
          </div>
        </div>

        <section className="owner-grid">
          <Link href="/admin/app-help" className="tool-card primary-tool">
            <span className="tool-icon">💬</span>
            <span className="tool-content">
              <span className="tool-title">App Help Inbox</span>
              <span className="tool-text">
                View and update help requests from volunteers and organisations.
              </span>
            </span>
            <span className="tool-arrow">→</span>
          </Link>

          <div className="tool-card muted-tool" aria-disabled="true">
            <span className="tool-icon">🧭</span>
            <span className="tool-content">
              <span className="tool-title">Owner dashboard</span>
              <span className="tool-text">
                Future home for platform-level checks and support workflows.
              </span>
            </span>
            <span className="coming-soon">Later</span>
          </div>

          <div className="tool-card muted-tool" aria-disabled="true">
            <span className="tool-icon">📣</span>
            <span className="tool-content">
              <span className="tool-title">Support operations</span>
              <span className="tool-text">
                Planned tools for notes, contact actions and support status
                tracking.
              </span>
            </span>
            <span className="coming-soon">Later</span>
          </div>
        </section>

        <section className="safety-panel">
          <div>
            <h2>Access model</h2>
            <p>
              Volunteer and organisation help requests stay separate from normal
              organisation dashboards. Only approved owner/support-admin users
              should access the App Help inbox.
            </p>
          </div>

          <div className="access-flow">
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
  padding: clamp(20px, 4vw, 44px);
  background:
    radial-gradient(circle at top left, rgba(183, 167, 214, 0.22), transparent 34%),
    radial-gradient(circle at top right, rgba(244, 183, 197, 0.18), transparent 30%),
    linear-gradient(135deg, #f7fbf8 0%, #fff8fa 50%, #f8f5ff 100%);
  color: #263238;
}

.owner-shell {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  gap: 20px;
}

.owner-hero,
.safety-panel {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(143, 178, 158, 0.24);
  box-shadow: 0 24px 70px rgba(38, 50, 56, 0.08);
  border-radius: 32px;
}

.owner-hero {
  padding: clamp(24px, 5vw, 36px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}

.owner-hero h1 {
  margin: 6px 0 10px;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
  color: #315f48;
}

.owner-hero p,
.safety-panel p {
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

.primary-button {
  min-height: 48px;
  border-radius: 999px;
  padding: 13px 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 900;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  touch-action: manipulation;
  background: linear-gradient(135deg, #8fb29e, #b7a7d6);
  color: #ffffff;
  box-shadow: 0 16px 34px rgba(143, 178, 158, 0.28);
}

.primary-button:hover {
  transform: translateY(-1px);
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

.safety-panel {
  padding: clamp(22px, 4vw, 30px);
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}

.safety-panel h2 {
  margin: 0 0 8px;
  color: #315f48;
  font-size: 1.25rem;
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

@media (max-width: 860px) {
  .owner-hero {
    align-items: stretch;
  }

  .owner-hero .primary-button {
    width: 100%;
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
    padding: 16px;
  }

  .owner-hero,
  .safety-panel {
    border-radius: 26px;
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

  .safety-panel {
    align-items: stretch;
  }

  .access-flow {
    display: grid;
  }

  .primary-button {
    width: 100%;
  }
}
`;
