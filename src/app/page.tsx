import Link from "next/link";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export default function HomePage() {
  const listenText =
    "Welcome to SO Volunteering. This is the public home page. The main heading says, Belong. Grow. Thrive. SO Volunteering helps people find supportive volunteering opportunities, build confidence, develop positive skills evidence, and create a pathway towards education, training, employment or community connection. There is an About SO Volunteering section explaining how the app helps volunteers and organisations. Near the bottom there are two main buttons. The first button says Get started. Choose this if you want to create an account. The second button says Sign in. Choose this if you already have an account.";

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

          <div className="home-listen-wrap">
            <InclusiveAudioButton text={listenText} />
          </div>
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

        <section className="home-about-card" aria-labelledby="about-title">
          <div className="home-about-heading">
            <span className="home-about-icon" aria-hidden="true">
              🌈
            </span>

            <div>
              <p className="home-section-kicker">About SO Volunteering</p>
              <h2 id="about-title">Supportive volunteering, built around people.</h2>
            </div>
          </div>

          <p className="home-about-text">
            SO Volunteering helps volunteers find roles that feel realistic,
            welcoming and useful. It also helps organisations understand what
            support people may need, recognise positive skills, and help
            volunteers build a pathway towards work, learning or community
            connection.
          </p>

          <div className="home-about-grid" aria-label="What SO Volunteering supports">
            <article className="home-about-mini-card">
              <span aria-hidden="true">🌱</span>
              <div>
                <h3>For volunteers</h3>
                <p>
                  Find opportunities, choose what feels right, and build your
                  confidence step by step.
                </p>
              </div>
            </article>

            <article className="home-about-mini-card">
              <span aria-hidden="true">🤝</span>
              <div>
                <h3>For organisations</h3>
                <p>
                  Create inclusive roles, manage interest, and recognise the
                  positive skills volunteers show.
                </p>
              </div>
            </article>

            <article className="home-about-mini-card">
              <span aria-hidden="true">📄</span>
              <div>
                <h3>Positive pathway</h3>
                <p>
                  Shared skills reviews can help volunteers build a positive CV
                  for future steps.
                </p>
              </div>
            </article>
          </div>
        </section>

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

      <style>{`
        .home-hero .page-top-row {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(280px, auto);
          gap: 22px;
          align-items: start;
          width: 100%;
          max-width: 100%;
          margin-bottom: clamp(30px, 5vw, 48px);
        }

        .home-hero .home-brand-card {
          display: grid !important;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 18px;
          align-items: center;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
        }

        .home-hero .home-brand-mark {
          width: clamp(66px, 7vw, 84px);
          height: clamp(66px, 7vw, 84px);
          object-fit: contain;
          flex: 0 0 auto;
        }

        .home-hero .home-brand-text {
          min-width: 0;
          max-width: 100%;
          text-align: left;
          overflow: hidden;
        }

        .home-hero .home-brand-name {
          display: block;
          max-width: 100%;
          margin: 0;
          color: #4f746d;
          font-size: clamp(1.85rem, 2.7vw, 3.2rem);
          font-weight: 950;
          line-height: 0.98;
          letter-spacing: clamp(0.1em, 0.9vw, 0.16em);
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: clip;
        }

        .home-hero .home-brand-name span {
          color: #6c5ca0;
        }

        .home-hero .home-brand-tagline {
          max-width: 100%;
          margin: 10px 0 0;
          color: #e5b95a;
          font-size: clamp(0.86rem, 1.15vw, 1.05rem);
          font-weight: 950;
          letter-spacing: clamp(0.16em, 1.1vw, 0.28em);
          line-height: 1.2;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
        }

        .home-hero .home-listen-wrap {
          display: flex;
          min-width: 0;
          max-width: 360px;
          justify-content: flex-end;
          align-items: flex-start;
          overflow: visible;
          position: relative;
          z-index: 3;
        }

        .home-hero .home-listen-wrap > * {
          max-width: 100%;
        }

        .home-about-card {
          width: 100%;
          display: grid;
          gap: 18px;
          margin-top: 24px;
          padding: clamp(18px, 4vw, 26px);
          border: 1px solid rgba(143, 178, 158, 0.24);
          border-radius: 30px;
          background:
            linear-gradient(135deg, rgba(244, 255, 249, 0.86), rgba(255, 255, 255, 0.9)),
            rgba(255, 255, 255, 0.86);
          box-shadow: 0 22px 56px rgba(33, 56, 48, 0.08);
          text-align: left;
        }

        .home-about-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: center;
        }

        .home-about-icon {
          width: 62px;
          height: 62px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: rgba(143, 178, 158, 0.16);
          box-shadow: inset 0 0 0 1px rgba(83, 111, 99, 0.12);
          font-size: 2rem;
        }

        .home-section-kicker {
          margin: 0 0 4px;
          color: #536f63;
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .home-about-heading h2 {
          margin: 0;
          color: #315f48;
          font-size: clamp(1.35rem, 3vw, 1.95rem);
          line-height: 1.08;
          letter-spacing: -0.04em;
        }

        .home-about-text {
          margin: 0;
          color: #4d5566;
          font-size: clamp(1rem, 2.2vw, 1.12rem);
          font-weight: 700;
          line-height: 1.58;
        }

        .home-about-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .home-about-mini-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          min-height: 132px;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.78);
        }

        .home-about-mini-card > span {
          width: 46px;
          height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(248, 248, 252, 0.92);
          font-size: 1.45rem;
        }

        .home-about-mini-card h3 {
          margin: 0 0 6px;
          color: #315f48;
          font-size: 1rem;
          font-weight: 950;
          line-height: 1.18;
        }

        .home-about-mini-card p {
          margin: 0;
          color: #60706a;
          font-size: 0.94rem;
          font-weight: 700;
          line-height: 1.42;
        }

        @media (max-width: 1180px) {
          .home-hero .page-top-row {
            grid-template-columns: 1fr;
            gap: 20px;
            justify-items: center;
            margin-bottom: 34px;
          }

          .home-hero .home-brand-card {
            width: 100%;
            max-width: 760px;
            justify-self: center;
          }

          .home-hero .home-brand-name {
            font-size: clamp(2.05rem, 5.2vw, 3.8rem);
          }

          .home-hero .home-brand-tagline {
            font-size: clamp(0.9rem, 2vw, 1.2rem);
          }

          .home-hero .home-listen-wrap {
            width: 100%;
            max-width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 860px) {
          .home-about-grid {
            grid-template-columns: 1fr;
          }

          .home-about-mini-card {
            min-height: 0;
          }
        }

        @media (max-width: 640px) {
          .home-hero .page-top-row {
            gap: 18px;
            margin-bottom: 28px;
          }

          .home-hero .home-brand-card {
            grid-template-columns: 1fr;
            justify-items: center;
            text-align: center;
            gap: 12px;
          }

          .home-hero .home-brand-mark {
            width: 76px;
            height: 76px;
          }

          .home-hero .home-brand-text {
            text-align: center;
          }

          .home-hero .home-brand-name {
            font-size: clamp(1.7rem, 8vw, 2.35rem);
            letter-spacing: 0.1em;
            white-space: normal;
            overflow: visible;
          }

          .home-hero .home-brand-tagline {
            font-size: 0.88rem;
            letter-spacing: 0.16em;
            white-space: normal;
            overflow: visible;
          }
        }

        @media (max-width: 560px) {
          .home-about-card {
            border-radius: 26px;
          }

          .home-about-heading {
            grid-template-columns: 1fr;
          }

          .home-about-icon {
            width: 58px;
            height: 58px;
          }

          .home-about-mini-card {
            grid-template-columns: 1fr;
          }

          .home-about-mini-card > span {
            width: 52px;
            height: 52px;
            font-size: 1.6rem;
          }
        }
      `}</style>
    </main>
  );
}
