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
              src="/brand/so-volunteering-logo-mark.png"
              alt=""
              className="home-brand-mark"
              aria-hidden="true"
            />

            <div className="home-brand-text">
              <p className="home-brand-name">
                <span>SO</span> Volunteering
              </p>
              <p className="home-brand-tagline">Belong • Grow • Thrive</p>
            </div>
          </div>

          <InclusiveAudioButton text={listenText} />
        </div>

        <h1 className="home-title" aria-label="Belong. Grow. Thrive.">
          <span className="home-title-word">Belong.</span>{" "}
          <span className="home-title-word">Grow.</span>{" "}
          <span className="home-title-word">Thrive.</span>
        </h1>

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
