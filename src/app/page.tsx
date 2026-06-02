import Link from "next/link";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export default function HomePage() {
  const listenText =
    "Welcome to SO Volunteering. This platform helps people belong, grow and thrive through inclusive volunteering, support, skills development and pathways into education, training and employment.";

  return (
    <main className="center-shell">
      <section className="home-hero">
        <div className="page-top-row">
          <div className="home-brand-card" aria-label="SO Volunteering">
            <img
              src="/brand/so-volunteering-logo-horizontal-compact.png"
              alt="SO Volunteering. Belong, Grow, Thrive."
              className="home-brand-logo"
            />
          </div>

          <InclusiveAudioButton text={listenText} />
        </div>

        <h1 className="home-title">Belong. Grow. Thrive.</h1>

        <p className="home-lead">
          An inclusive volunteering and employability platform helping people
          find opportunities, build confidence, develop verified skills, and
          progress towards education, training, and employment.
        </p>

        <div className="action-row">
          <Link href="/signup" className="primary-button home-action-button">
            <span className="home-action-inner">
              <span className="home-action-icon" aria-hidden="true">
                🌱
              </span>
              <span className="home-action-text">Get started</span>
            </span>
          </Link>

          <Link href="/login" className="secondary-button home-action-button">
            <span className="home-action-inner">
              <span className="home-action-icon" aria-hidden="true">
                🔐
              </span>
              <span className="home-action-text">Sign in</span>
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
