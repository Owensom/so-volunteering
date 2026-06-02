import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import { InclusiveAudioButton, IconLabel } from "@/components/InclusiveSupport";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";

  const listenText =
    "This is the sign in page for SO Volunteering. Enter your email and password to continue to your dashboard.";

  return (
    <main className="center-shell">
      <section className="auth-card">
        <div className="page-top-row">
          <p className="brand-eyebrow">SO Volunteering</p>
          <InclusiveAudioButton text={listenText} />
        </div>

        <h1 className="page-title">
          <IconLabel icon="👋">Welcome back</IconLabel>
        </h1>

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
            <IconLabel icon="✉️">Email</IconLabel>
            <input name="email" type="email" required />
          </label>

          <label className="field-label">
            <IconLabel icon="🔒">Password</IconLabel>
            <input name="password" type="password" required />
          </label>

          <button type="submit" className="primary-button">
            <IconLabel icon="➡️">Sign in</IconLabel>
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
