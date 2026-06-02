import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.badge}>SO Volunteering</div>

        <h1 style={styles.title}>Belong. Grow. Thrive.</h1>

        <p style={styles.lead}>
          An inclusive volunteering and employability platform helping people
          find opportunities, build confidence, develop verified skills, and
          progress towards education, training, and employment.
        </p>

        <div style={styles.actions}>
          <Link href="/signup" style={styles.primaryButton}>
            Get started
          </Link>
          <Link href="/login" style={styles.secondaryButton}>
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  hero: {
    width: "100%",
    maxWidth: "980px",
    borderRadius: "32px",
    padding: "56px",
    background:
      "linear-gradient(135deg, rgba(183,167,214,0.22), rgba(143,178,158,0.18), rgba(244,183,197,0.16))",
    border: "1px solid rgba(143,178,158,0.28)",
    boxShadow: "0 24px 80px rgba(38,50,56,0.10)"
  },
  badge: {
    display: "inline-flex",
    padding: "10px 16px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.75)",
    color: "#6f5fa1",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: "13px"
  },
  title: {
    margin: "28px 0 16px",
    fontSize: "clamp(42px, 7vw, 82px)",
    lineHeight: 1,
    color: "#5f7f73"
  },
  lead: {
    maxWidth: "720px",
    fontSize: "20px",
    lineHeight: 1.6,
    color: "#374151"
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    marginTop: "32px"
  },
  primaryButton: {
    padding: "14px 22px",
    borderRadius: "999px",
    background: "#8fb29e",
    color: "white",
    fontWeight: 700
  },
  secondaryButton: {
    padding: "14px 22px",
    borderRadius: "999px",
    background: "white",
    color: "#5f7f73",
    fontWeight: 700,
    border: "1px solid rgba(143,178,158,0.35)"
  }
};
