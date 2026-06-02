import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { InclusiveAudioButton, IconLabel } from "@/components/InclusiveSupport";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";

  const listenText =
    "This page lets you create a SO Volunteering account. Choose whether you are joining as a volunteer or an organisation, then enter your name, email and password.";

  return (
    <main className="center-shell">
      <section className="auth-card">
        <div className="page-top-row">
          <p className="brand-eyebrow">SO Volunteering</p>
          <InclusiveAudioButton text={listenText} />
        </div>

        <h1 className="page-title">
          <IconLabel icon="🌱">Create your account</IconLabel>
        </h1>

        <p className="page-lead">Start building your inclusive volunteering pathway.</p>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={signUp} className="form-stack">
          <label className="field-label">
            <IconLabel icon="👤">Full name</IconLabel>
            <input name="full_name" type="text" required />
          </label>

          <label className="field-label">
            <IconLabel icon="🤝">I am joining as</IconLabel>
            <select name="user_type" defaultValue="volunteer">
              <option value="volunteer">Volunteer</option>
              <option value="organisation">Organisation</option>
            </select>
          </label>

          <label className="field-label">
            <IconLabel icon="✉️">Email</IconLabel>
            <input name="email" type="email" required />
          </label>

          <label className="field-label">
            <IconLabel icon="🔒">Password</IconLabel>
            <input name="password" type="password" required minLength={6} />
          </label>

          <button type="submit" className="primary-button">
            <IconLabel icon="➡️">Create account</IconLabel>
          </button>
        </form>

        <p className="footer-text">
          Already have an account?{" "}
          <Link href="/login" className="text-link">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
