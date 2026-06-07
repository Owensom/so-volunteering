import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { joinSchoolWithCode, leaveSchoolMembership } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  user_type: string | null;
};

type SchoolProfile = {
  user_id: string;
  organisation_name: string | null;
  contact_email: string | null;
  location: string | null;
  safeguarding_region: string | null;
};

type PupilMembership = {
  id: string;
  school_user_id: string;
  volunteer_user_id: string;
  join_code_id: string | null;
  membership_status: string;
  pupil_stage: string | null;
  pupil_notes: string | null;
  parent_carer_consent_confirmed: boolean;
  school_staff_confirmed: boolean;
  joined_at: string;
  updated_at: string;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function formatMembershipStatus(value: string | null | undefined) {
  if (value === "pending") return "Pending";
  if (value === "paused") return "Paused";
  if (value === "left") return "Left";
  if (value === "removed") return "Removed";
  return "Active";
}

function getMembershipStatusClass(value: string | null | undefined) {
  if (value === "paused") return "school-link-status school-link-status-paused";
  if (value === "left" || value === "removed") {
    return "school-link-status school-link-status-closed";
  }
  if (value === "pending") return "school-link-status school-link-status-pending";
  return "school-link-status school-link-status-active";
}

function formatPupilStage(value: string | null | undefined) {
  if (value === "s1") return "S1";
  if (value === "s2") return "S2";
  if (value === "s3") return "S3";
  if (value === "s4") return "S4";
  if (value === "s5") return "S5";
  if (value === "s6") return "S6";
  if (value === "college") return "College";
  if (value === "other") return "Other";
  return "Not set";
}

function formatSafeguardingRegion(value: string | null | undefined) {
  if (value === "england_wales") return "England / Wales - DBS";
  if (value === "northern_ireland") return "Northern Ireland - AccessNI";
  if (value === "other") return "Other / country-specific guidance";
  return "Scotland - PVG";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Europe/London",
  }).format(date);
}

function getSchoolName(
  schoolUserId: string,
  schoolMap: Map<string, SchoolProfile>,
) {
  return (
    schoolMap.get(schoolUserId)?.organisation_name ||
    schoolMap.get(schoolUserId)?.contact_email ||
    "School"
  );
}

function getSchoolLocation(
  schoolUserId: string,
  schoolMap: Map<string, SchoolProfile>,
) {
  return schoolMap.get(schoolUserId)?.location || "Location not listed";
}

function getSchoolRegion(
  schoolUserId: string,
  schoolMap: Map<string, SchoolProfile>,
) {
  return formatSafeguardingRegion(schoolMap.get(schoolUserId)?.safeguarding_region);
}

function StatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: string;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <article className="school-link-stat-card">
      <span aria-hidden="true">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

export default async function VolunteerSchoolLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const errorMessage = resolvedSearchParams.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : "";
  const successMessage = resolvedSearchParams.message
    ? decodeURIComponent(resolvedSearchParams.message)
    : "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,email,user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);

  if (userType !== "volunteer") {
    redirect("/organisation/dashboard");
  }

  const { data: membershipsData } = await supabase
    .from("school_pupil_memberships")
    .select("*")
    .eq("volunteer_user_id", user.id)
    .order("joined_at", { ascending: false });

  const memberships = (membershipsData as PupilMembership[] | null) ?? [];

  const schoolUserIds = Array.from(
    new Set(memberships.map((membership) => membership.school_user_id)),
  );

  let schoolProfiles: SchoolProfile[] = [];

  if (schoolUserIds.length > 0) {
    const { data: schoolProfilesData } = await supabase
      .from("organisation_profiles")
      .select("user_id,organisation_name,contact_email,location,safeguarding_region")
      .in("user_id", schoolUserIds);

    schoolProfiles = (schoolProfilesData as SchoolProfile[] | null) ?? [];
  }

  const schoolMap = new Map(
    schoolProfiles.map((schoolProfile) => [schoolProfile.user_id, schoolProfile]),
  );

  const activeCount = memberships.filter(
    (membership) => membership.membership_status === "active",
  ).length;
  const pendingCount = memberships.filter(
    (membership) => membership.membership_status === "pending",
  ).length;
  const pausedCount = memberships.filter(
    (membership) => membership.membership_status === "paused",
  ).length;
  const consentCount = memberships.filter(
    (membership) => membership.parent_carer_consent_confirmed,
  ).length;

  const listenText =
    "This is the school link page. If your school gives you a school join code, you can enter it here to link your volunteer account to that school. This does not change which opportunities you see yet. It only creates a school membership record for later school-approved opportunity filtering. The app does not guess your school from your email address, postcode or name.";

  return (
    <main className="dashboard-bg school-link-page">
      <section className="dashboard-shell school-link-shell">
        <header className="dashboard-topbar">
          <Link
            href="/dashboard"
            className="dashboard-brand"
            aria-label="Back to volunteer dashboard"
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

          <div className="dashboard-topbar-actions school-link-top-actions">
            <InclusiveAudioButton text={listenText} />

            <Link href="/dashboard" className="secondary-button dashboard-signout-button">
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Dashboard</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card school-link-hero"
          aria-labelledby="school-link-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">School link</p>

            <h1 id="school-link-title" className="dashboard-title">
              <span aria-hidden="true">🏫</span>
              <span>Link to your school</span>
            </h1>

            <p className="dashboard-lead">
              Enter a school join code if your school or college has given you
              one. This prepares a safer school-approved volunteering pathway for
              later.
            </p>

            <div className="school-link-safety-note">
              <span aria-hidden="true">🛡️</span>
              <p>
                This does not change opportunity browsing yet. Your school link
                is created from a code you enter, not guessed from your personal
                details.
              </p>
            </div>
          </div>

          <aside className="dashboard-progress-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                🎓
              </span>
              <div>
                <h2>{profile?.full_name || "Your school links"}</h2>
                <p>
                  Active school membership
                  {activeCount === 1 ? "" : "s"}: <strong>{activeCount}</strong>
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Pending: <strong>{pendingCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Paused: <strong>{pausedCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Parent/carer consent confirmed: <strong>{consentCount}</strong>
            </p>
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <section className="school-link-stat-grid" aria-label="School link summary">
          <StatCard
            icon="🏫"
            label="School links"
            value={memberships.length}
            helper="Total membership records"
          />
          <StatCard
            icon="✅"
            label="Active"
            value={activeCount}
            helper="Currently linked"
          />
          <StatCard
            icon="⏸️"
            label="Paused"
            value={pausedCount}
            helper="Paused by school"
          />
          <StatCard
            icon="👪"
            label="Consent"
            value={consentCount}
            helper="Parent/carer consent confirmed"
          />
        </section>

        <section className="school-link-grid">
          <article className="school-link-card">
            <div className="school-link-card-heading">
              <span aria-hidden="true">🔑</span>
              <div>
                <p className="dashboard-kicker">Join code</p>
                <h2>Enter your school code</h2>
                <p>
                  Use the code exactly as your school gave it to you. The code
                  links your volunteer account to that school.
                </p>
              </div>
            </div>

            <form action={joinSchoolWithCode} className="school-link-form">
              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🔑
                  </span>
                  <span>School join code</span>
                </span>
                <input
                  name="join_code"
                  type="text"
                  minLength={6}
                  maxLength={32}
                  placeholder="Example: SO-ABCD2345"
                  required
                />
              </label>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🎓
                  </span>
                  <span>Your stage optional</span>
                </span>
                <select name="pupil_stage" defaultValue="not_set">
                  <option value="not_set">Prefer not to say yet</option>
                  <option value="s1">S1</option>
                  <option value="s2">S2</option>
                  <option value="s3">S3</option>
                  <option value="s4">S4</option>
                  <option value="s5">S5</option>
                  <option value="s6">S6</option>
                  <option value="college">College</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <button type="submit" className="primary-button school-link-submit">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">✅</span>
                  <span>Link my school</span>
                </span>
              </button>
            </form>
          </article>

          <article className="school-link-card">
            <div className="school-link-card-heading">
              <span aria-hidden="true">🧭</span>
              <div>
                <p className="dashboard-kicker">What this means</p>
                <h2>School-approved pathway foundation</h2>
                <p>
                  This page only links your account to a school. Later, it can
                  help show school-approved organisations and opportunities.
                </p>
              </div>
            </div>

            <div className="school-link-steps">
              <article>
                <span aria-hidden="true">1</span>
                <p>Your school creates a join code.</p>
              </article>
              <article>
                <span aria-hidden="true">2</span>
                <p>You enter the code here.</p>
              </article>
              <article>
                <span aria-hidden="true">3</span>
                <p>Your school can see the membership link.</p>
              </article>
              <article>
                <span aria-hidden="true">4</span>
                <p>Filtering comes later, after the approval layer is tested.</p>
              </article>
            </div>
          </article>
        </section>

        <section className="school-link-list-section" aria-labelledby="school-links-title">
          <div className="school-link-list-heading">
            <span aria-hidden="true">🏫</span>
            <div>
              <p className="dashboard-kicker">Your linked schools</p>
              <h2 id="school-links-title">School memberships</h2>
            </div>
          </div>

          {memberships.length === 0 ? (
            <p className="empty-copy">
              You have not linked to a school yet. Enter a code above if your
              school has given you one.
            </p>
          ) : (
            <div className="school-link-list">
              {memberships.map((membership) => (
                <article key={membership.id} className="school-link-record-card">
                  <div className="school-link-record-top">
                    <div>
                      <p className="dashboard-kicker">School</p>
                      <h3>{getSchoolName(membership.school_user_id, schoolMap)}</h3>
                      <p className="muted-copy">
                        {getSchoolLocation(membership.school_user_id, schoolMap)}
                        {" · "}
                        Joined {formatDate(membership.joined_at)}
                      </p>
                    </div>

                    <span className={getMembershipStatusClass(membership.membership_status)}>
                      {formatMembershipStatus(membership.membership_status)}
                    </span>
                  </div>

                  <div className="school-link-meta-grid">
                    <span>
                      <strong>Stage:</strong>{" "}
                      {formatPupilStage(membership.pupil_stage)}
                    </span>
                    <span>
                      <strong>Region:</strong>{" "}
                      {getSchoolRegion(membership.school_user_id, schoolMap)}
                    </span>
                    <span>
                      <strong>Parent/carer consent:</strong>{" "}
                      {membership.parent_carer_consent_confirmed
                        ? "Confirmed"
                        : "Not confirmed"}
                    </span>
                    <span>
                      <strong>School staff confirmed:</strong>{" "}
                      {membership.school_staff_confirmed
                        ? "Confirmed"
                        : "Not confirmed"}
                    </span>
                  </div>

                  {membership.pupil_notes ? (
                    <p className="school-link-note">
                      <strong>School note:</strong> {membership.pupil_notes}
                    </p>
                  ) : null}

                  {membership.membership_status !== "left" ? (
                    <form action={leaveSchoolMembership}>
                      <input type="hidden" name="membership_id" value={membership.id} />
                      <button type="submit" className="danger-button">
                        Leave school link
                      </button>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .school-link-page,
        .school-link-page * {
          box-sizing: border-box;
        }

        .school-link-page {
          overflow-x: hidden;
        }

        .school-link-shell {
          width: min(1180px, calc(100% - 32px));
        }

        .school-link-top-actions {
          gap: 12px;
        }

        .school-link-hero,
        .school-link-card,
        .school-link-list-section,
        .school-link-record-card,
        .school-link-stat-card {
          overflow: hidden;
        }

        .school-link-safety-note {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          width: min(100%, 720px);
          margin-top: 18px;
          padding: 14px 16px;
          border: 1px solid rgba(34, 124, 78, 0.24);
          border-radius: 20px;
          background: rgba(244, 255, 249, 0.86);
          color: #275f45;
          font-weight: 800;
          line-height: 1.45;
        }

        .school-link-safety-note p {
          margin: 0;
        }

        .school-link-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin: 20px 0;
        }

        .school-link-stat-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          min-height: 118px;
          padding: 14px;
          border: 1px solid rgba(143, 178, 158, 0.2);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 14px 36px rgba(33, 56, 48, 0.06);
        }

        .school-link-stat-card > span {
          display: inline-flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: rgba(143, 178, 158, 0.13);
          font-size: 1.25rem;
        }

        .school-link-stat-card p {
          margin: 0 0 5px;
          color: #60706a;
          font-size: 0.82rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .school-link-stat-card strong {
          display: block;
          color: #315f48;
          font-size: 1.85rem;
          line-height: 1;
        }

        .school-link-stat-card small {
          display: block;
          margin-top: 8px;
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.25;
        }

        .school-link-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin: 22px 0;
          align-items: start;
        }

        .school-link-card,
        .school-link-list-section {
          display: grid;
          gap: 18px;
          padding: 22px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(222, 214, 255, 0.24), transparent 34%),
            rgba(255, 255, 255, 0.88);
          box-shadow: 0 18px 42px rgba(33, 56, 48, 0.07);
        }

        .school-link-card-heading,
        .school-link-list-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .school-link-card-heading > span,
        .school-link-list-heading > span {
          display: inline-flex;
          width: 58px;
          height: 58px;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: rgba(108, 92, 160, 0.12);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.12);
          font-size: 1.75rem;
        }

        .school-link-card-heading h2,
        .school-link-list-heading h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.3rem, 3vw, 1.65rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.12;
        }

        .school-link-card-heading p,
        .school-link-list-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 760;
          line-height: 1.45;
        }

        .school-link-form {
          display: grid;
          gap: 14px;
        }

        .school-link-submit {
          width: 100%;
        }

        .school-link-steps {
          display: grid;
          gap: 10px;
        }

        .school-link-steps article {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: center;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
        }

        .school-link-steps span {
          display: inline-flex;
          width: 34px;
          height: 34px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(108, 92, 160, 0.12);
          color: #4f4b82;
          font-weight: 950;
        }

        .school-link-steps p {
          margin: 0;
          color: #60706a;
          font-weight: 800;
          line-height: 1.35;
        }

        .school-link-list {
          display: grid;
          gap: 14px;
        }

        .school-link-record-card {
          display: grid;
          gap: 13px;
          padding: 16px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.82);
        }

        .school-link-record-top {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: flex-start;
          justify-content: space-between;
        }

        .school-link-record-top h3 {
          margin: 0 0 5px;
          color: #315f48;
          font-size: 1.14rem;
          font-weight: 950;
          line-height: 1.16;
          overflow-wrap: anywhere;
        }

        .school-link-status {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 950;
          line-height: 1.1;
        }

        .school-link-status-active {
          border: 1px solid rgba(34, 124, 78, 0.22);
          background: rgba(244, 255, 249, 0.94);
          color: #145c38;
        }

        .school-link-status-paused {
          border: 1px solid rgba(191, 146, 72, 0.24);
          background: rgba(255, 250, 241, 0.94);
          color: #8a6630;
        }

        .school-link-status-closed {
          border: 1px solid rgba(190, 118, 76, 0.26);
          background: rgba(255, 248, 241, 0.94);
          color: #8a4d30;
        }

        .school-link-status-pending {
          border: 1px solid rgba(108, 92, 160, 0.16);
          background: rgba(248, 245, 255, 0.94);
          color: #5c5488;
        }

        .school-link-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(248, 245, 255, 0.66);
        }

        .school-link-meta-grid span {
          color: #60706a;
          font-size: 0.84rem;
          font-weight: 760;
          line-height: 1.28;
          overflow-wrap: anywhere;
        }

        .school-link-meta-grid strong {
          color: #315f48;
        }

        .muted-copy,
        .empty-copy {
          margin: 0;
          color: #60706a;
          font-weight: 760;
          line-height: 1.45;
        }

        .school-link-note {
          margin: 0;
          padding: 12px;
          border-radius: 16px;
          background: rgba(248, 248, 252, 0.84);
          color: #60706a;
          font-weight: 760;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .school-link-note strong {
          color: #315f48;
        }

        .danger-button {
          display: inline-flex;
          min-height: 40px;
          width: fit-content;
          align-items: center;
          justify-content: center;
          padding: 9px 14px;
          border: 1px solid rgba(190, 118, 76, 0.24);
          border-radius: 999px;
          background: rgba(255, 248, 241, 0.9);
          color: #8a4d30;
          cursor: pointer;
          font: inherit;
          font-size: 0.86rem;
          font-weight: 900;
          line-height: 1.1;
        }

        .danger-button:hover {
          border-color: rgba(190, 118, 76, 0.38);
          background: rgba(255, 240, 232, 0.96);
        }

        @media (max-width: 1080px) {
          .school-link-stat-grid,
          .school-link-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .school-link-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .school-link-shell {
            width: 100%;
            max-width: 100%;
            padding: 18px 16px 40px;
          }

          .school-link-top-actions {
            width: 100%;
            justify-content: stretch;
          }

          .school-link-top-actions > *,
          .school-link-top-actions a,
          .school-link-top-actions button {
            width: 100%;
          }

          .school-link-hero {
            padding: 24px 20px;
            border-radius: 30px;
          }

          .school-link-stat-grid,
          .school-link-grid,
          .school-link-meta-grid {
            grid-template-columns: 1fr;
          }

          .school-link-safety-note,
          .school-link-card-heading,
          .school-link-list-heading {
            grid-template-columns: 1fr;
          }

          .school-link-card,
          .school-link-list-section {
            padding: 18px;
            border-radius: 24px;
          }

          .school-link-card-heading > span,
          .school-link-list-heading > span {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .school-link-record-top {
            display: grid;
          }

          .school-link-status,
          .danger-button {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .school-link-shell {
            padding-left: 14px;
            padding-right: 14px;
          }

          .school-link-hero {
            padding: 22px 18px;
            border-radius: 28px;
          }
        }
      `}</style>
    </main>
  );
}
