import Link from "next/link";

export default function HomePage() {
  return (
    <main className="center-shell">
      <section className="home-hero">
        <div className="home-badge">SO Volunteering</div>

        <h1 className="home-title">Belong. Grow. Thrive.</h1>

        <p className="home-lead">
          An inclusive volunteering and employability platform helping people
          find opportunities, build confidence, develop verified skills, and
          progress towards education, training, and employment.
        </p>

        <div className="action-row">
          <Link href="/signup" className="primary-button">
            Get started
          </Link>
          <Link href="/login" className="secondary-button">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
