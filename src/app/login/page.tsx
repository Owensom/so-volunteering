import Link from "next/link";
import { signIn } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.eyebrow}>SO Volunteering</p>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.lead}>Sign in to continue your volunteering journey.</p>

        {params.message === "account_created" ? (
          <div style={styles.success}>
            Account created. Please sign in to continue.
          </div>
        ) : null}

        {params.error ? (
          <div style={styles.error}>Please check your details and try again.</div>
        ) : null}

        <form action={signIn} style={styles.form}>
          <label style={styles.label}>
            Email
            <input name="email" type="email" required style={styles.input} />
          </label>

          <label style={styles.label}>
            Password
            <input
              name="password"
              type="password"
              required
              style={styles.input}
            />
          </label>

          <button type="submit" style={styles.primaryButton}>
            Sign in
          </button>
        </form>

        <p style={styles.footerText}>
          New here?{" "}
          <Link href="/signup" style={styles.link}>
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px"
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    background: "white",
    borderRadius: "28px",
    padding: "36px",
    boxShadow: "0 24px 70px rgba(38,50,56,0.10)",
    border: "1px solid rgba(143,178,158,0.25)"
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
    margin: "14px 0 8px",
    fontSize: "38px",
    color: "#5f7f73"
  },
  lead: {
    margin: "0 0 24px",
    color: "#6b7280",
    lineHeight: 1.5
  },
  form: {
    display: "grid",
    gap: "16px"
  },
  label: {
    display: "grid",
    gap: "8px",
    fontWeight: 700,
    color: "#374151"
  },
  input: {
    border: "1px solid rgba(107,114,128,0.25)",
    borderRadius: "14px",
    padding: "13px 14px",
    outline: "none"
  },
  primaryButton: {
    marginTop: "8px",
    border: 0,
    borderRadius: "999px",
    padding: "14px 20px",
    background: "#8fb29e",
    color: "white",
    fontWeight: 800,
    cursor: "pointer"
  },
  success: {
    background: "#ecfdf5",
    color: "#047857",
    borderRadius: "14px",
    padding: "12px 14px",
    marginBottom: "18px",
    fontWeight: 700
  },
  error: {
    background: "#fff1f2",
    color: "#9f1239",
    borderRadius: "14px",
    padding: "12px 14px",
    marginBottom: "18px",
    fontWeight: 700
  },
  footerText: {
    marginTop: "22px",
    color: "#6b7280"
  },
  link: {
    color: "#6f5fa1",
    fontWeight: 800
  }
};
