import Link from "next/link";
import { signUp } from "@/app/auth/actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";

  return (
    <main className="center-shell">
      <section className="auth-card">
        <p className="brand-eyebrow">SO Volunteering</p>
        <h1 className="page-title">Create your account</h1>
        <p className="page-lead">Start building your inclusive volunteering pathway.</p>

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={signUp} className="form-stack">
          <label className="field-label">
            Full name
            <input name="full_name" type="text" required />
          </label>

          <label className="field-label">
            I am joining as
            <select name="user_type" defaultValue="volunteer">
              <option value="volunteer">Volunteer</option>
              <option value="organisation">Organisation</option>
            </select>
          </label>

          <label className="field-label">
            Email
            <input name="email" type="email" required />
          </label>

          <label className="field-label">
            Password
            <input name="password" type="password" required minLength={6} />
          </label>

          <button type="submit" className="primary-button">
            Create account
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
