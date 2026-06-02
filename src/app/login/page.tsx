import Link from "next/link";
import { signIn } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";

  return (
    <main className="center-shell">
      <section className="auth-card">
        <p className="brand-eyebrow">SO Volunteering</p>
        <h1 className="page-title">Welcome back</h1>
        <p className="page-lead">Sign in to continue your volunteering journey.</p>

        {params.message === "account_created" ? (
          <div className="alert alert-success">
            Account created. Please sign in to continue.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={signIn} className="form-stack">
          <label className="field-label">
            Email
            <input name="email" type="email" required />
          </label>

          <label className="field-label">
            Password
            <input name="password" type="password" required />
          </label>

          <button type="submit" className="primary-button">
            Sign in
          </button>
        </form>

        <p className="footer-text">
          New here?{" "}
          <Link href="/signup" className="text-link">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
