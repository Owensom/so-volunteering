import Link from "next/link";
import { redirect } from "next/navigation";
import { updateInterestStatus } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type InterestRow = {
  id: string;
  opportunity_id: string;
  volunteer_user_id: string;
  volunteer_name: string | null;
  volunteer_email: string | null;
  volunteer_phone: string | null;
  volunteer_city: string | null;
  volunteer_goals: string[] | null;
  volunteer_interests: string[] | null;
  volunteer_skills: string[] | null;
  volunteer_support_shared: boolean | null;
  volunteer_support_needs: string | null;
  volunteer_preferred_contact_method: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  summary: string;
  location_type: string | null;
  location: string | null;
  time_commitment: string | null;
  status: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseInterestStatus(status: string | null | undefined) {
  if (
    status === "new" ||
    status === "contacted" ||
    status === "accepted" ||
    status === "closed"
  ) {
    return status;
  }

  if (status === "review" || status === "reviewed") {
    return "contacted";
  }

  return "new";
}

function formatStatus(status: string) {
  const normalisedStatus = normaliseInterestStatus(status);

  if (normalisedStatus === "accepted") return "Accepted";
  if (normalisedStatus === "contacted") return "Contacted";
  if (normalisedStatus === "closed") return "Closed";
  return "New";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

function formatContactMethod(value: string | null | undefined) {
  if (value === "sms") return "Text message";
  if (value === "phone") return "Phone call";
  if (value === "email") return "Email";
  return "Not chosen yet";
}

function shouldShowPhone(value: string | null | undefined) {
  return value === "phone" || value === "sms";
}

function getSafePhoneHref(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, "");
}

function buildContactEmail({
  volunteerName,
  roleTitle
}: {
  volunteerName: string;
  roleTitle: string;
}) {
  return `Hi ${volunteerName},

Thank you for expressing interest in ${roleTitle}.

It was lovely to see your interest come through on SO Volunteering. We would like to find out a little more and talk about whether this role feels like a good fit for you.

The next step would be a short, friendly conversation about the role, what support might help, and any questions you have.

Please let us know if you are still interested and what would be a good time to contact you.

Best wishes`;
}

function buildContactText({
  volunteerName,
  roleTitle
}: {
  volunteerName: string;
  roleTitle: string;
}) {
  return `Hi ${volunteerName}, thanks for your interest in ${roleTitle}. We’d love to chat about whether it feels like a good fit. Is there a good time to contact you? Thanks.`;
}

function buildCallNotes({
  volunteerName,
  roleTitle,
  preferredContactMethod
}: {
  volunteerName: string;
  roleTitle: string;
  preferredContactMethod: string;
}) {
  return [
    `Ask for ${volunteerName}.`,
    `Introduce yourself and say you are calling about ${roleTitle}.`,
    "Thank them for expressing interest.",
    "Ask if now is still a good time to talk.",
    "Briefly explain the role in plain language.",
    "Ask what support would help them feel comfortable.",
    `Note that their preferred contact method is ${preferredContactMethod}.`,
    "Agree the next step before ending the call."
  ];
}

function buildMailtoHref({
  email,
  subject,
  body
}: {
  email: string | null;
  subject: string;
  body: string;
}) {
  if (!email || !email.trim()) {
    return "";
  }

  return `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

function buildSmsHref({
  phoneNumber,
  body
}: {
  phoneNumber: string;
  body: string;
}) {
  const safePhone = getSafePhoneHref(phoneNumber);

  if (!safePhone) {
    return "";
  }

  return `sms:${encodeURIComponent(safePhone)}?&body=${encodeURIComponent(body)}`;
}

function ChipList({
  values,
  emptyText
}: {
  values: string[] | null | undefined;
  emptyText: string;
}) {
  if (!Array.isArray(values) || values.length === 0) {
    return <p className="dashboard-muted-action">{emptyText}</p>;
  }

  return (
    <div className="interest-chip-list">
      {values.map((value) => (
        <span key={value} className="interest-chip">
          {value}
        </span>
      ))}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  title,
  children
}: {
  icon: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="info-card dashboard-pathway-card interest-detail-card">
      <div
        className="dashboard-card-icon interest-detail-icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="dashboard-card-copy interest-detail-copy">
        <div>
          <p className="dashboard-card-label">{label}</p>
          <h2>{title}</h2>
        </div>

        <div className="interest-detail-body">{children}</div>
      </div>
    </article>
  );
}

export default async function OrganisationInterestDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const interestId = resolvedParams.id;

  const errorMessage = resolvedSearchParams.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : "";

  const successMessage = resolvedSearchParams.message
    ? decodeURIComponent(resolvedSearchParams.message)
    : "";

  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);

  if (userType !== "organisation") {
    redirect("/dashboard");
  }

  const { data: interest } = await supabase
    .from("opportunity_interests")
    .select(
      "id,opportunity_id,volunteer_user_id,volunteer_name,volunteer_email,volunteer_phone,volunteer_city,volunteer_goals,volunteer_interests,volunteer_skills,volunteer_support_shared,volunteer_support_needs,volunteer_preferred_contact_method,message,status,created_at"
    )
    .eq("id", interestId)
    .eq("organisation_user_id", user.id)
    .maybeSingle<InterestRow>();

  if (!interest) {
    redirect("/organisation/interests");
  }

  const normalisedStatus = normaliseInterestStatus(interest.status);

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,title,summary,location_type,location,time_commitment,status")
    .eq("id", interest.opportunity_id)
    .eq("organisation_user_id", user.id)
    .maybeSingle<OpportunityRow>();

  const preferredContactMethod = formatContactMethod(
    interest.volunteer_preferred_contact_method
  );

  const showPhoneNumber = shouldShowPhone(
    interest.volunteer_preferred_contact_method
  );

  const phoneNumber = interest.volunteer_phone?.trim() || "";
  const safePhoneHref = getSafePhoneHref(phoneNumber);

  const volunteerName = interest.volunteer_name || "Volunteer";
  const roleTitle = opportunity?.title || "this volunteering role";

  const contactEmailSubject = `Your interest in ${roleTitle}`;
  const contactEmailBody = buildContactEmail({
    volunteerName,
    roleTitle
  });

  const contactTextBody = buildContactText({
    volunteerName,
    roleTitle
  });

  const callNotes = buildCallNotes({
    volunteerName,
    roleTitle,
    preferredContactMethod
  });

  const contactMailtoHref = buildMailtoHref({
    email: interest.volunteer_email,
    subject: contactEmailSubject,
    body: contactEmailBody
  });

  const contactSmsHref = phoneNumber
    ? buildSmsHref({
        phoneNumber,
        body: contactTextBody
      })
    : "";

  const contactHelperMode =
    interest.volunteer_preferred_contact_method === "sms"
      ? "sms"
      : interest.volunteer_preferred_contact_method === "phone"
        ? "phone"
        : "email";

  const listenText =
    "You are on a volunteer interest detail page. First, read the volunteer name and current status. The cards below show the role, volunteer contact details, preferred contact method, phone number if the volunteer chose phone or text, supporting statement, goals, interests, skills and shared support information. The Status guide explains the workflow: New, Contacted, Accepted and Closed. The Prepare contact card adapts to the volunteer’s preferred contact method. It can suggest an email, a text message, or phone call notes. The platform does not send messages for you yet. Use the Update status card to mark this interest as contacted, accepted or closed.";

  return (
    <main className="dashboard-bg organisation-interest-page">
      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <Link
            href="/organisation/dashboard"
            className="dashboard-brand"
            aria-label="Back to organisation dashboard"
          >
            <img
              src="/brand/so-volunteering-logo-mark.png"
              alt=""
              className="dashboard-brand-mark"
              aria-hidden="true"
            />
            <span className="dashboard-brand-text">
              <span className="dashboard-brand-name">SO Volunteering</span>
              <span className="dashboard-brand-tagline">
                Belong • Grow • Thrive
              </span>
            </span>
          </Link>

          <div className="dashboard-topbar-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href="/organisation/interests"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Interest inbox</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card organisation-interest-hero"
          aria-labelledby="interest-detail-title"
        >
          <div className="dashboard-welcome-copy organisation-interest-hero-copy">
            <p className="dashboard-kicker">Volunteer interest</p>

            <h1
              id="interest-detail-title"
              className="dashboard-title organisation-interest-title"
            >
              <span aria-hidden="true">📬</span>
              <span>{interest.volunteer_name || "Volunteer"}</span>
            </h1>

            <p className="dashboard-lead organisation-interest-lead">
              Review this volunteer’s interest before deciding the next step.
              Keep contact kind, clear and supportive.
            </p>

            <div className="dashboard-primary-actions organisation-interest-actions">
              <Link
                href="/organisation/interests"
                className="primary-button dashboard-main-action"
              >
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📬</span>
                  <span>Back to inbox</span>
                </span>
              </Link>

              {opportunity ? (
                <Link
                  href={`/organisation/opportunities/${opportunity.id}`}
                  className="secondary-button dashboard-main-action"
                >
                  <span className="dashboard-button-inner">
                    <span aria-hidden="true">📣</span>
                    <span>Open role</span>
                  </span>
                </Link>
              ) : null}
            </div>
          </div>

          <aside
            className="dashboard-progress-card organisation-interest-status-card"
            aria-label="Interest status"
          >
            <div className="dashboard-progress-header organisation-interest-status-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ✨
              </span>
              <div>
                <h2>Status</h2>
                <p>
                  Current: <strong>{formatStatus(interest.status)}</strong>
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note organisation-interest-status-note">
              Preferred contact: <strong>{preferredContactMethod}</strong>
            </p>

            {showPhoneNumber ? (
              <p className="dashboard-progress-note organisation-interest-status-note">
                Phone: <strong>{phoneNumber || "Not supplied"}</strong>
              </p>
            ) : null}

            <p className="dashboard-progress-note organisation-interest-status-note">
              Update the status when this interest has been contacted, accepted
              or closed.
            </p>
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <section
          className="dashboard-grid interest-detail-grid"
          aria-label="Interest detail"
        >
          <DetailCard icon="📣" label="Role" title="Opportunity">
            {opportunity ? (
              <>
                <p>
                  Role: <strong>{opportunity.title}</strong>
                </p>
                <p>{opportunity.summary}</p>
                <p className="dashboard-muted-action">
                  {formatLocationType(opportunity.location_type)}
                  {opportunity.location ? ` · ${opportunity.location}` : ""}
                  {opportunity.time_commitment
                    ? ` · ${opportunity.time_commitment}`
                    : ""}
                </p>
              </>
            ) : (
              <p className="dashboard-muted-action">
                This opportunity could not be loaded.
              </p>
            )}
          </DetailCard>

          <DetailCard icon="👤" label="Volunteer" title="Contact details">
            <p>
              Name:{" "}
              <strong>
                {interest.volunteer_name || "Volunteer name not shared"}
              </strong>
            </p>
            <p>
              Email:{" "}
              <strong>{interest.volunteer_email || "Email not available"}</strong>
            </p>
            <p>
              Preferred contact: <strong>{preferredContactMethod}</strong>
            </p>
            {showPhoneNumber ? (
              <p>
                Phone number: <strong>{phoneNumber || "Not supplied"}</strong>
              </p>
            ) : null}
            <p>
              Area: <strong>{interest.volunteer_city || "Area not shared"}</strong>
            </p>
          </DetailCard>

          <DetailCard icon="📌" label="Status guide" title="How to use statuses">
            <div className="status-guide-list" aria-label="Interest status guide">
              <div
                className={
                  normalisedStatus === "new"
                    ? "status-guide-item status-guide-current"
                    : "status-guide-item"
                }
              >
                <span className="status-guide-badge">1</span>
                <div>
                  <p>
                    <strong>New</strong>
                  </p>
                  <p>The volunteer has expressed interest and is waiting.</p>
                </div>
              </div>

              <div
                className={
                  normalisedStatus === "contacted"
                    ? "status-guide-item status-guide-current"
                    : "status-guide-item"
                }
              >
                <span className="status-guide-badge">2</span>
                <div>
                  <p>
                    <strong>Contacted</strong>
                  </p>
                  <p>You have contacted the volunteer or started the conversation.</p>
                </div>
              </div>

              <div
                className={
                  normalisedStatus === "accepted"
                    ? "status-guide-item status-guide-current"
                    : "status-guide-item"
                }
              >
                <span className="status-guide-badge">3</span>
                <div>
                  <p>
                    <strong>Accepted</strong>
                  </p>
                  <p>You are ready to move forward with this volunteer.</p>
                </div>
              </div>

              <div
                className={
                  normalisedStatus === "closed"
                    ? "status-guide-item status-guide-current"
                    : "status-guide-item"
                }
              >
                <span className="status-guide-badge">4</span>
                <div>
                  <p>
                    <strong>Closed</strong>
                  </p>
                  <p>No further action is needed for this interest.</p>
                </div>
              </div>
            </div>
          </DetailCard>

          <DetailCard
            icon={
              contactHelperMode === "sms"
                ? "💬"
                : contactHelperMode === "phone"
                  ? "📞"
                  : "✉️"
            }
            label="Contact helper"
            title={
              contactHelperMode === "sms"
                ? "Prepare text"
                : contactHelperMode === "phone"
                  ? "Prepare call"
                  : "Prepare email"
            }
          >
            {contactHelperMode === "sms" ? (
              <>
                <p>
                  The volunteer chose text message. Use a short, friendly first
                  message and keep the next step clear.
                </p>

                <p>
                  Phone/text number:{" "}
                  <strong>{phoneNumber || "Not supplied"}</strong>
                </p>

                <div className="contact-email-preview" aria-label="Suggested text">
                  <pre>{contactTextBody}</pre>
                </div>

                {contactSmsHref ? (
                  <a href={contactSmsHref} className="contact-email-button">
                    Open text app
                  </a>
                ) : (
                  <p className="dashboard-muted-action">
                    No phone number is available, so a text link cannot be
                    prepared.
                  </p>
                )}
              </>
            ) : null}

            {contactHelperMode === "phone" ? (
              <>
                <p>
                  The volunteer chose phone call. Use these notes to keep the
                  call clear, kind and supportive.
                </p>

                <p>
                  Phone number: <strong>{phoneNumber || "Not supplied"}</strong>
                </p>

                <div className="call-notes-box" aria-label="Suggested call notes">
                  <ol>
                    {callNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ol>
                </div>

                {safePhoneHref ? (
                  <a
                    href={`tel:${safePhoneHref}`}
                    className="contact-email-button"
                  >
                    Open phone app
                  </a>
                ) : (
                  <p className="dashboard-muted-action">
                    No phone number is available, so a phone link cannot be
                    prepared.
                  </p>
                )}
              </>
            ) : null}

            {contactHelperMode === "email" ? (
              <>
                <p>
                  The volunteer chose email. A friendly first message is ready.
                  Open the preview only if you want to check or copy the full
                  wording.
                </p>

                <p>
                  Suggested subject: <strong>{contactEmailSubject}</strong>
                </p>

                <details className="contact-email-details">
                  <summary>Preview suggested email</summary>
                  <div
                    className="contact-email-preview"
                    aria-label="Suggested email"
                  >
                    <pre>{contactEmailBody}</pre>
                  </div>
                </details>

                {contactMailtoHref ? (
                  <a href={contactMailtoHref} className="contact-email-button">
                    Open email app
                  </a>
                ) : (
                  <p className="dashboard-muted-action">
                    No volunteer email is available, so an email link cannot be
                    prepared.
                  </p>
                )}
              </>
            ) : null}
          </DetailCard>

          <DetailCard icon="💬" label="Statement" title="Supporting statement">
            {interest.message ? (
              <p>{interest.message}</p>
            ) : (
              <p className="dashboard-muted-action">
                No supporting statement was added.
              </p>
            )}
          </DetailCard>

          <DetailCard icon="🌱" label="Goals" title="Volunteer goals">
            <ChipList
              values={interest.volunteer_goals}
              emptyText="No goals shared."
            />
          </DetailCard>

          <DetailCard icon="💚" label="Interests" title="Volunteer interests">
            <ChipList
              values={interest.volunteer_interests}
              emptyText="No interests shared."
            />
          </DetailCard>

          <DetailCard icon="⭐" label="Skills" title="Volunteer skills">
            <ChipList
              values={interest.volunteer_skills}
              emptyText="No skills shared."
            />
          </DetailCard>

          <DetailCard icon="💛" label="Support" title="Shared support">
            {interest.volunteer_support_shared &&
            interest.volunteer_support_needs ? (
              <p>{interest.volunteer_support_needs}</p>
            ) : (
              <p className="dashboard-muted-action">
                Support preferences were not shared with organisations.
              </p>
            )}
          </DetailCard>

          <DetailCard icon="🧭" label="Next steps" title="What happens next?">
            <p>
              Read the volunteer’s details and decide whether the role looks like
              a good fit.
            </p>
            <p>
              Contact the volunteer outside the platform for now, using their
              preferred contact method where possible.
            </p>
            <p>
              Mark the interest as Contacted after you have reached out.
            </p>
            <p>
              Mark the interest as Accepted if you are ready to move forward
              with the volunteer, or Closed when no further action is needed.
            </p>
          </DetailCard>

          <article className="info-card dashboard-pathway-card interest-detail-card">
            <div
              className="dashboard-card-icon interest-detail-icon"
              aria-hidden="true"
            >
              ✅
            </div>

            <div className="dashboard-card-copy interest-detail-copy">
              <div>
                <p className="dashboard-card-label">Manage</p>
                <h2>Update status</h2>
              </div>

              <div className="interest-detail-body">
                <form action={updateInterestStatus} className="form-stack">
                  <input type="hidden" name="interest_id" value={interest.id} />

                  <label className="field-label">
                    <span className="field-label-row">
                      <span className="field-label-icon" aria-hidden="true">
                        📌
                      </span>
                      <span>Interest status</span>
                    </span>
                    <select name="status" defaultValue={normalisedStatus}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="accepted">Accepted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </label>

                  <button type="submit" className="primary-button">
                    <span className="button-balanced-inner">
                      <span aria-hidden="true">✅</span>
                      <span>Save status</span>
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </article>
        </section>
      </section>

      <style>{`
        .organisation-interest-page,
        .organisation-interest-page * {
          box-sizing: border-box;
        }

        .organisation-interest-hero,
        .organisation-interest-status-card,
        .interest-detail-card {
          overflow: hidden;
        }

        .organisation-interest-hero-copy,
        .organisation-interest-status-card,
        .organisation-interest-status-card *,
        .interest-detail-card,
        .interest-detail-card * {
          min-width: 0;
        }

        .interest-detail-grid {
          align-items: stretch;
        }

        .interest-detail-card {
          min-height: 228px;
          height: 100%;
          align-items: stretch;
        }

        .interest-detail-copy {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          gap: 18px;
        }

        .interest-detail-body {
          display: grid;
          gap: 10px;
          color: #5d6677;
          line-height: 1.55;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .interest-detail-body p,
        .organisation-interest-status-note {
          margin: 0;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .interest-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-start;
        }

        .interest-chip {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          max-width: 100%;
          padding: 9px 12px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #536f63;
          font-size: 0.88rem;
          font-weight: 800;
          line-height: 1.2;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
          white-space: normal;
        }

        .status-guide-list {
          display: grid;
          gap: 10px;
        }

        .status-guide-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
          padding: 10px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.66);
        }

        .status-guide-current {
          border-color: rgba(83, 111, 99, 0.34);
          background: rgba(244, 255, 249, 0.92);
          box-shadow: 0 10px 24px rgba(33, 56, 48, 0.06);
        }

        .status-guide-badge {
          display: inline-flex;
          width: 28px;
          height: 28px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(83, 111, 99, 0.1);
          color: #536f63;
          font-size: 0.8rem;
          font-weight: 950;
          flex: 0 0 auto;
        }

        .contact-email-details {
          display: grid;
          gap: 10px;
        }

        .contact-email-details summary {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          min-height: 40px;
          align-items: center;
          justify-content: center;
          padding: 9px 14px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.84);
          color: #536f63;
          cursor: pointer;
          font-weight: 900;
          line-height: 1.15;
          box-shadow: 0 10px 22px rgba(33, 56, 48, 0.06);
          list-style: none;
        }

        .contact-email-details summary::-webkit-details-marker {
          display: none;
        }

        .contact-email-preview,
        .call-notes-box {
          display: grid;
          max-height: 260px;
          overflow: auto;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.74);
        }

        .contact-email-preview pre {
          margin: 0;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: normal;
          color: #35453f;
          font: inherit;
          line-height: 1.55;
        }

        .call-notes-box ol {
          margin: 0;
          padding-left: 1.25rem;
        }

        .call-notes-box li {
          margin: 0 0 8px;
          color: #35453f;
          line-height: 1.5;
        }

        .call-notes-box li:last-child {
          margin-bottom: 0;
        }

        .contact-email-button {
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          border: 1px solid rgba(83, 111, 99, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.88);
          color: #536f63;
          font-size: 0.94rem;
          font-weight: 900;
          line-height: 1.15;
          text-decoration: none;
          box-shadow: 0 10px 24px rgba(33, 56, 48, 0.07);
        }

        .contact-email-button:hover {
          border-color: rgba(83, 111, 99, 0.34);
          background: rgba(244, 255, 249, 0.96);
        }

        @media (max-width: 760px) {
          .organisation-interest-page .dashboard-shell {
            width: min(100%, 100vw);
            padding-left: 18px;
            padding-right: 18px;
          }

          .organisation-interest-page .dashboard-topbar {
            gap: 14px;
          }

          .organisation-interest-page .dashboard-topbar-actions {
            width: 100%;
            justify-content: stretch;
          }

          .organisation-interest-page .dashboard-topbar-actions > *,
          .organisation-interest-page .dashboard-topbar-actions a,
          .organisation-interest-page .dashboard-topbar-actions button {
            width: 100%;
          }

          .organisation-interest-hero {
            gap: 22px;
            padding: 28px 22px;
            border-radius: 30px;
          }

          .organisation-interest-title {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            max-width: 100%;
            font-size: clamp(2.15rem, 11vw, 3rem);
            line-height: 0.98;
            letter-spacing: -0.055em;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .organisation-interest-title span:last-child {
            min-width: 0;
          }

          .organisation-interest-lead {
            max-width: 100%;
            font-size: 1.08rem;
            line-height: 1.48;
            overflow-wrap: anywhere;
          }

          .organisation-interest-actions {
            width: 100%;
            gap: 12px;
          }

          .organisation-interest-actions .dashboard-main-action {
            width: 100%;
          }

          .organisation-interest-status-card {
            width: 100%;
            padding: 22px;
            border-radius: 26px;
          }

          .organisation-interest-status-header {
            align-items: flex-start;
            gap: 14px;
          }

          .organisation-interest-status-header h2 {
            font-size: 1.45rem;
            line-height: 1.08;
            overflow-wrap: anywhere;
          }

          .organisation-interest-status-header p,
          .organisation-interest-status-note {
            font-size: 1rem;
            line-height: 1.35;
          }

          .organisation-interest-status-note {
            margin-top: 10px;
          }

          .interest-detail-card {
            min-height: 0;
            padding: 22px;
          }

          .interest-detail-copy {
            gap: 14px;
          }

          .interest-detail-copy h2 {
            font-size: 1.45rem;
            line-height: 1.14;
            overflow-wrap: anywhere;
          }

          .interest-detail-body {
            font-size: 1rem;
            line-height: 1.48;
          }

          .interest-chip-list {
            gap: 8px;
          }

          .interest-chip {
            border-radius: 18px;
            font-size: 0.86rem;
          }

          .contact-email-details summary,
          .contact-email-button {
            width: 100%;
          }

          .contact-email-preview,
          .call-notes-box {
            max-height: 220px;
          }
        }

        @media (max-width: 420px) {
          .organisation-interest-page .dashboard-shell {
            padding-left: 14px;
            padding-right: 14px;
          }

          .organisation-interest-hero {
            padding: 24px 18px;
            border-radius: 28px;
          }

          .organisation-interest-title {
            font-size: clamp(1.95rem, 10.5vw, 2.55rem);
          }

          .organisation-interest-status-card,
          .interest-detail-card {
            padding: 18px;
          }
        }
      `}</style>
    </main>
  );
}
