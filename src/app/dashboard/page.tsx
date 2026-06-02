import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>SO Volunteering</p>
          <h1 style={styles.title}>
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p style={styles.lead}>
            Your inclusive volunteering pathway dashboard is ready.
          </p>
        </div>

        <form action={signOut}>
          <button type="submit" style={styles.signOutButton}>
            Sign out
          </button>
        </form>
      </section>

      <section style={styles.grid}>
        <article style={styles.card}>
          <h2 style={styles.cardTitle}>Your profile</h2>
          <p style={styles.cardText}>
            Account type: <strong>{profile?.user_type ?? "volunteer"}</strong>
          </p>
          <p style={styles.cardText}>{profile?.email}</p>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>Opportunities</h2>
          <p style={styles.cardText}>
            Browse inclusive volunteering opportunities and start building verified experience.
          </p>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>Wellbeing</h2>
          <p style={styles.cardText}>
            Support and safety features are built into the platform from the start.
          </p>
        </article>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background:
      "linear-gradient(135deg, rgba(183,167,214,0.16), rgba(143,178,158,0.12), rgba(244,183,197,0.10))"
  },
  hero: {
    maxWidth: "1120px",
    margin: "0 auto 24px",
    background: "white",
    borderRadius: "28px",
    padding: "32px",
    border: "1px solid rgba(143,178,158,0.25)",
    boxShadow: "0 20px 60px rgba(38,50,56,0.08)",
    display: "flex",
    gap: "18px",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap"
  },
  eyebrow: {
    margin: 0,
    color: "#8f7ac0",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: "13px"
  },
  title: {
    margin: "12px 0 8px",
    fontSize: "42px",
    color: "#5f7f73"
  },
  lead: {
    margin: 0,
    color: "#6b7280",
    lineHeight: 1.5
  },
  signOutButton: {
    border: "1px solid rgba(143,178,158,0.35)",
    borderRadius: "999px",
    padding: "12px 18px",
    background: "white",
    color: "#5f7f73",
    fontWeight: 800,
    cursor: "pointer"
  },
  grid: {
    maxWidth: "1120px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px"
  },
  card: {
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    border: "1px solid rgba(143,178,158,0.22)",
    boxShadow: "0 16px 44px rgba(38,50,56,0.06)"
  },
  cardTitle: {
    margin: "0 0 10px",
    color: "#5f7f73"
  },
  cardText: {
    margin: 0,
    color: "#6b7280",
    lineHeight: 1.55
  }
};
