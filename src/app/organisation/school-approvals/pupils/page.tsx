import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import {
  createSchoolJoinCode,
  deleteSchoolJoinCode,
  removePupilMembership,
  updatePupilMembership,
  updateSchoolJoinCode,
} from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type SchoolProfile = {
  user_id: string;
  organisation_name: string | null;
  contact_email: string | null;
  organisation_type: string | null;
  safeguarding_region: string | null;
};

type JoinCode = {
  id: string;
  school_user_id: string;
  code: string;
  label: string | null;
  status: string;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
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

type VolunteerProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function formatSafeguardingRegion(value: string | null | undefined) {
  if (value === "england_wales") return "England / Wales - DBS";
  if (value === "northern_ireland") return "Northern Ireland - AccessNI";
  if (value === "other") return "Other / country-specific guidance";
  return "Scotland - PVG";
}

function formatJoinCodeStatus(value: string | null | undefined) {
  if (value === "paused") return "Paused";
  if (value === "expired") return "Expired";
  return "Active";
}

function getJoinCodeStatusClass(value: string | null | undefined) {
  if (value === "paused") return "status-pill status-paused";
  if (value === "expired") return "status-pill status-expired";
  return "status-pill status-active";
}

function formatMembershipStatus(value: string | null | undefined) {
  if (value === "pending") return "Pending";
  if (value === "paused") return "Paused";
  if (value === "left") return "Left";
  if (value === "removed") return "Removed";
  return "Active";
}

function getMembershipStatusClass(value: string | null | undefined) {
  if (value === "paused") return "status-pill status-paused";
  if (value === "left" || value === "removed") {
    return "status-pill status-expired";
  }
  if (value === "pending") return "status-pill status-draft";
  return "status-pill status-active";
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

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Europe/London",
  }).format(date);
}

function formatDateInput(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function getVolunteerName(
  volunteerId: string,
  volunteerMap: Map<string, VolunteerProfile>,
) {
  const profile = volunteerMap.get(volunteerId);

  return profile?.full_name || profile?.email || "Volunteer";
}

function getVolunteerEmail(
  volunteerId: string,
  volunteerMap: Map<string, VolunteerProfile>,
) {
  return volunteerMap.get(volunteerId)?.email || "Email not available";
}

function getJoinCodeLabel(joinCodeId: string | null, joinCodeMap: Map<string, JoinCode>) {
  if (!joinCodeId) return "Manual or unknown";

  const joinCode = joinCodeMap.get(joinCodeId);

  if (!joinCode) return "Unknown code";

  return joinCode.label ? `${joinCode.label} · ${joinCode.code}` : joinCode.code;
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
    <article className="school-pupil-stat-card">
      <span aria-hidden="true">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

function StageSelect({ defaultValue = "not_set" }: { defaultValue?: string | null }) {
  return (
    <select name="pupil_stage" defaultValue={defaultValue || "not_set"}>
      <option value="not_set">Not set</option>
      <option value="s1">S1</option>
      <option value="s2">S2</option>
      <option value="s3">S3</option>
      <option value="s4">S4</option>
      <option value="s5">S5</option>
      <option value="s6">S6</option>
      <option value="college">College</option>
      <option value="other">Other</option>
    </select>
  );
}

export default async function SchoolApprovalPupilsPage({
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

  const { data: schoolProfile } = await supabase
    .from("organisation_profiles")
    .select(
      "user_id,organisation_name,contact_email,organisation_type,safeguarding_region",
    )
    .eq("user_id", user.id)
    .maybeSingle<SchoolProfile>();

  if (schoolProfile?.organisation_type !== "school_college") {
    redirect("/organisation/dashboard");
  }

  const { data: joinCodesData } = await supabase
    .from("school_join_codes")
    .select("*")
    .eq("school_user_id", user.id)
    .order("created_at", { ascending: false });

  const joinCodes = (joinCodesData as JoinCode[] | null) ?? [];

  const { data: membershipsData } = await supabase
    .from("school_pupil_memberships")
    .select("*")
    .eq("school_user_id", user.id)
    .order("joined_at", { ascending: false });

  const memberships = (membershipsData as PupilMembership[] | null) ?? [];

  const volunteerIds = Array.from(
    new Set(memberships.map((membership) => membership.volunteer_user_id)),
  );

  let volunteerProfiles: VolunteerProfile[] = [];

  if (volunteerIds.length > 0) {
    const { data: volunteerProfilesData } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .in("id", volunteerIds);

    volunteerProfiles = (volunteerProfilesData as VolunteerProfile[] | null) ?? [];
  }

  const volunteerMap = new Map(
    volunteerProfiles.map((volunteerProfile) => [
      volunteerProfile.id,
      volunteerProfile,
    ]),
  );

  const joinCodeMap = new Map(joinCodes.map((joinCode) => [joinCode.id, joinCode]));

  const activeJoinCodeCount = joinCodes.filter(
    (joinCode) => joinCode.status === "active",
  ).length;
  const pausedJoinCodeCount = joinCodes.filter(
    (joinCode) => joinCode.status === "paused",
  ).length;
  const activeMembershipCount = memberships.filter(
    (membership) => membership.membership_status === "active",
  ).length;
  const pausedMembershipCount = memberships.filter(
    (membership) => membership.membership_status === "paused",
  ).length;
  const consentConfirmedCount = memberships.filter(
    (membership) => membership.parent_carer_consent_confirmed,
  ).length;
  const staffConfirmedCount = memberships.filter(
    (membership) => membership.school_staff_confirmed,
  ).length;

  const listenText =
    "This is the school pupil linking page. Schools can create join codes and view pupils who have linked themselves to this school. This phase only creates the school membership foundation. It does not change public visibility, does not filter opportunities, and does not change volunteer browsing yet. Pupils should link to schools using a school-provided code rather than through guessed email addresses or postcodes.";

  return (
    <main className="dashboard-bg school-pupils-page">
      <section className="dashboard-shell school-pupils-shell">
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

          <div className="dashboard-topbar-actions school-pupils-top-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href="/organisation/school-approvals"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>School approvals</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card school-pupils-hero"
          aria-labelledby="school-pupils-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">School safety layer phase 1D</p>

            <h1 id="school-pupils-title" className="dashboard-title">
              <span aria-hidden="true">🎓</span>
              <span>Pupil linking</span>
            </h1>

            <p className="dashboard-lead">
              Create school join codes and review pupils who have linked
              themselves to your school. This prepares later school-approved
              opportunity filtering without changing public visibility yet.
            </p>

            <div className="school-pupil-safety-note">
              <span aria-hidden="true">🛡️</span>
              <p>
                Pupils link using a school-provided code. The app does not guess
                school membership from email address, postcode or name.
              </p>
            </div>
          </div>

          <aside className="dashboard-progress-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                🏫
              </span>
              <div>
                <h2>{schoolProfile?.organisation_name || "School pupils"}</h2>
                <p>{formatSafeguardingRegion(schoolProfile?.safeguarding_region)}</p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Active join codes: <strong>{activeJoinCodeCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Linked pupils: <strong>{memberships.length}</strong>
            </p>
            <p className="dashboard-progress-note">
              Active memberships: <strong>{activeMembershipCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Staff confirmed: <strong>{staffConfirmedCount}</strong>
            </p>
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <section className="school-pupil-stat-grid" aria-label="Pupil linking summary">
          <StatCard
            icon="🔑"
            label="Active codes"
            value={activeJoinCodeCount}
            helper={`${pausedJoinCodeCount} paused code${
              pausedJoinCodeCount === 1 ? "" : "s"
            }`}
          />
          <StatCard
            icon="🎓"
            label="Linked pupils"
            value={memberships.length}
            helper="Membership records"
          />
          <StatCard
            icon="✅"
            label="Active pupils"
            value={activeMembershipCount}
            helper={`${pausedMembershipCount} paused membership${
              pausedMembershipCount === 1 ? "" : "s"
            }`}
          />
          <StatCard
            icon="👪"
            label="Consent confirmed"
            value={consentConfirmedCount}
            helper="Parent/carer flag set"
          />
        </section>

        <section className="school-pupil-grid">
          <article className="school-pupil-card">
            <div className="school-pupil-card-heading">
              <span aria-hidden="true">🔑</span>
              <div>
                <p className="dashboard-kicker">Join codes</p>
                <h2>Create a join code</h2>
                <p>
                  Share this code with pupils you want to link to your school
                  account. Keep it school-controlled.
                </p>
              </div>
            </div>

            <form action={createSchoolJoinCode} className="school-pupil-form">
              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🏷️
                  </span>
                  <span>Label optional</span>
                </span>
                <input
                  name="label"
                  type="text"
                  placeholder="Example: S5 DofE group, Careers Week, June 2026"
                />
              </label>

              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🔑
                  </span>
                  <span>Custom code optional</span>
                </span>
                <input
                  name="code"
                  type="text"
                  minLength={6}
                  maxLength={32}
                  placeholder="Leave blank to generate automatically"
                />
              </label>

              <div className="school-pupil-form-grid">
                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      🔢
                    </span>
                    <span>Max uses optional</span>
                  </span>
                  <input name="max_uses" type="number" min={1} placeholder="50" />
                </label>

                <label className="field-label">
                  <span className="field-label-row">
                    <span className="field-label-icon" aria-hidden="true">
                      📅
                    </span>
                    <span>Expiry date optional</span>
                  </span>
                  <input name="expires_at" type="date" />
                </label>
              </div>

              <button type="submit" className="primary-button school-pupil-submit">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">✅</span>
                  <span>Create join code</span>
                </span>
              </button>
            </form>
          </article>

          <article className="school-pupil-card">
            <div className="school-pupil-card-heading">
              <span aria-hidden="true">🧭</span>
              <div>
                <p className="dashboard-kicker">How pupils link</p>
                <h2>Controlled school membership</h2>
                <p>
                  A volunteer pupil will later enter one of these codes in their
                  account. That creates a school membership record. Filtering
                  will come after this foundation.
                </p>
              </div>
            </div>

            <div className="school-pupil-steps">
              <article>
                <span aria-hidden="true">1</span>
                <p>Create a join code.</p>
              </article>
              <article>
                <span aria-hidden="true">2</span>
                <p>Pupil enters the code from their volunteer account.</p>
              </article>
              <article>
                <span aria-hidden="true">3</span>
                <p>School reviews membership status and consent flags.</p>
              </article>
              <article>
                <span aria-hidden="true">4</span>
                <p>Later phases use approved school memberships for filtering.</p>
              </article>
            </div>
          </article>
        </section>

        <section className="school-pupil-list-section" aria-labelledby="join-codes-title">
          <div className="school-pupil-list-heading">
            <span aria-hidden="true">🔑</span>
            <div>
              <p className="dashboard-kicker">Saved codes</p>
              <h2 id="join-codes-title">School join codes</h2>
            </div>
          </div>

          {joinCodes.length === 0 ? (
            <p className="empty-copy">No join codes created yet.</p>
          ) : (
            <div className="school-pupil-list">
              {joinCodes.map((joinCode) => (
                <article key={joinCode.id} className="school-pupil-record-card">
                  <div className="school-pupil-record-top">
                    <div>
                      <p className="dashboard-kicker">Join code</p>
                      <h3>{joinCode.code}</h3>
                      <p className="muted-copy">
                        {joinCode.label || "No label"} · Created{" "}
                        {formatDate(joinCode.created_at)}
                      </p>
                    </div>

                    <span className={getJoinCodeStatusClass(joinCode.status)}>
                      {formatJoinCodeStatus(joinCode.status)}
                    </span>
                  </div>

                  <div className="join-code-meta-grid">
                    <span>
                      <strong>Uses:</strong> {joinCode.uses_count}
                      {joinCode.max_uses ? ` / ${joinCode.max_uses}` : ""}
                    </span>
                    <span>
                      <strong>Expires:</strong>{" "}
                      {joinCode.expires_at
                        ? formatDate(joinCode.expires_at)
                        : "No expiry"}
                    </span>
                    <span>
                      <strong>Updated:</strong> {formatDate(joinCode.updated_at)}
                    </span>
                  </div>

                  <details className="school-pupil-edit-details">
                    <summary>Edit join code</summary>

                    <form action={updateSchoolJoinCode} className="school-pupil-form compact">
                      <input type="hidden" name="join_code_id" value={joinCode.id} />

                      <label className="field-label">
                        <span className="field-label-row">
                          <span className="field-label-icon" aria-hidden="true">
                            🏷️
                          </span>
                          <span>Label optional</span>
                        </span>
                        <input
                          name="label"
                          type="text"
                          defaultValue={joinCode.label || ""}
                        />
                      </label>

                      <label className="field-label">
                        <span className="field-label-row">
                          <span className="field-label-icon" aria-hidden="true">
                            📌
                          </span>
                          <span>Status</span>
                        </span>
                        <select name="status" defaultValue={joinCode.status}>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="expired">Expired</option>
                        </select>
                      </label>

                      <div className="school-pupil-form-grid">
                        <label className="field-label">
                          <span className="field-label-row">
                            <span className="field-label-icon" aria-hidden="true">
                              🔢
                            </span>
                            <span>Max uses optional</span>
                          </span>
                          <input
                            name="max_uses"
                            type="number"
                            min={1}
                            defaultValue={joinCode.max_uses || ""}
                          />
                        </label>

                        <label className="field-label">
                          <span className="field-label-row">
                            <span className="field-label-icon" aria-hidden="true">
                              📅
                            </span>
                            <span>Expiry date optional</span>
                          </span>
                          <input
                            name="expires_at"
                            type="date"
                            defaultValue={formatDateInput(joinCode.expires_at)}
                          />
                        </label>
                      </div>

                      <button type="submit" className="primary-button school-pupil-submit">
                        <span className="dashboard-button-inner">
                          <span aria-hidden="true">✅</span>
                          <span>Update join code</span>
                        </span>
                      </button>
                    </form>
                  </details>

                  <form action={deleteSchoolJoinCode}>
                    <input type="hidden" name="join_code_id" value={joinCode.id} />
                    <button type="submit" className="danger-button">
                      Remove join code
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="school-pupil-list-section" aria-labelledby="memberships-title">
          <div className="school-pupil-list-heading">
            <span aria-hidden="true">🎓</span>
            <div>
              <p className="dashboard-kicker">Linked pupils</p>
              <h2 id="memberships-title">School pupil memberships</h2>
            </div>
          </div>

          {memberships.length === 0 ? (
            <p className="empty-copy">
              No pupils have linked to this school yet. Pupil-side code entry
              comes next.
            </p>
          ) : (
            <div className="school-pupil-list">
              {memberships.map((membership) => (
                <article key={membership.id} className="school-pupil-record-card">
                  <div className="school-pupil-record-top">
                    <div>
                      <p className="dashboard-kicker">Pupil membership</p>
                      <h3>
                        {getVolunteerName(membership.volunteer_user_id, volunteerMap)}
                      </h3>
                      <p className="muted-copy">
                        {getVolunteerEmail(membership.volunteer_user_id, volunteerMap)}
                        {" · "}
                        Joined {formatDate(membership.joined_at)}
                      </p>
                    </div>

                    <span className={getMembershipStatusClass(membership.membership_status)}>
                      {formatMembershipStatus(membership.membership_status)}
                    </span>
                  </div>

                  <div className="join-code-meta-grid">
                    <span>
                      <strong>Stage:</strong> {formatPupilStage(membership.pupil_stage)}
                    </span>
                    <span>
                      <strong>Join code:</strong>{" "}
                      {getJoinCodeLabel(membership.join_code_id, joinCodeMap)}
                    </span>
                    <span>
                      <strong>Parent/carer consent:</strong>{" "}
                      {membership.parent_carer_consent_confirmed ? "Confirmed" : "Not confirmed"}
                    </span>
                    <span>
                      <strong>Staff confirmed:</strong>{" "}
                      {membership.school_staff_confirmed ? "Confirmed" : "Not confirmed"}
                    </span>
                  </div>

                  {membership.pupil_notes ? (
                    <p className="school-pupil-note">
                      <strong>Notes:</strong> {membership.pupil_notes}
                    </p>
                  ) : null}

                  <details className="school-pupil-edit-details">
                    <summary>Edit membership</summary>

                    <form action={updatePupilMembership} className="school-pupil-form compact">
                      <input type="hidden" name="membership_id" value={membership.id} />

                      <div className="school-pupil-form-grid">
                        <label className="field-label">
                          <span className="field-label-row">
                            <span className="field-label-icon" aria-hidden="true">
                              📌
                            </span>
                            <span>Status</span>
                          </span>
                          <select
                            name="membership_status"
                            defaultValue={membership.membership_status}
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="left">Left</option>
                            <option value="removed">Removed</option>
                          </select>
                        </label>

                        <label className="field-label">
                          <span className="field-label-row">
                            <span className="field-label-icon" aria-hidden="true">
                              🎓
                            </span>
                            <span>Pupil stage</span>
                          </span>
                          <StageSelect defaultValue={membership.pupil_stage} />
                        </label>
                      </div>

                      <div className="membership-check-grid">
                        <label className="membership-check-card">
                          <input
                            name="parent_carer_consent_confirmed"
                            type="checkbox"
                            defaultChecked={membership.parent_carer_consent_confirmed}
                          />
                          <span>
                            <strong>Parent/carer consent confirmed</strong>
                            <small>Use where school policy requires this.</small>
                          </span>
                        </label>

                        <label className="membership-check-card">
                          <input
                            name="school_staff_confirmed"
                            type="checkbox"
                            defaultChecked={membership.school_staff_confirmed}
                          />
                          <span>
                            <strong>School staff confirmed</strong>
                            <small>Use when staff have checked the membership.</small>
                          </span>
                        </label>
                      </div>

                      <label className="field-label">
                        <span className="field-label-row">
                          <span className="field-label-icon" aria-hidden="true">
                            📝
                          </span>
                          <span>Internal notes optional</span>
                        </span>
                        <textarea
                          name="pupil_notes"
                          rows={3}
                          defaultValue={membership.pupil_notes || ""}
                          placeholder="Internal school note. Do not add unnecessary personal detail."
                        />
                      </label>

                      <button type="submit" className="primary-button school-pupil-submit">
                        <span className="dashboard-button-inner">
                          <span aria-hidden="true">✅</span>
                          <span>Update membership</span>
                        </span>
                      </button>
                    </form>
                  </details>

                  <form action={removePupilMembership}>
                    <input type="hidden" name="membership_id" value={membership.id} />
                    <button type="submit" className="danger-button">
                      Remove membership
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .school-pupils-page,
        .school-pupils-page * {
          box-sizing: border-box;
        }

        .school-pupils-page {
          overflow-x: hidden;
        }

        .school-pupils-shell {
          width: min(1180px, calc(100% - 32px));
        }

        .school-pupils-top-actions {
          gap: 12px;
        }

        .school-pupils-hero,
        .school-pupil-card,
        .school-pupil-list-section,
        .school-pupil-record-card,
        .school-pupil-stat-card {
          overflow: hidden;
        }

        .school-pupil-safety-note {
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

        .school-pupil-safety-note p {
          margin: 0;
        }

        .school-pupil-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin: 20px 0;
        }

        .school-pupil-stat-card {
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

        .school-pupil-stat-card > span {
          display: inline-flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: rgba(143, 178, 158, 0.13);
          font-size: 1.25rem;
        }

        .school-pupil-stat-card p {
          margin: 0 0 5px;
          color: #60706a;
          font-size: 0.82rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .school-pupil-stat-card strong {
          display: block;
          color: #315f48;
          font-size: 1.85rem;
          line-height: 1;
        }

        .school-pupil-stat-card small {
          display: block;
          margin-top: 8px;
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.25;
        }

        .school-pupil-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin: 22px 0;
          align-items: start;
        }

        .school-pupil-card,
        .school-pupil-list-section {
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

        .school-pupil-card-heading,
        .school-pupil-list-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .school-pupil-card-heading > span,
        .school-pupil-list-heading > span {
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

        .school-pupil-card-heading h2,
        .school-pupil-list-heading h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.3rem, 3vw, 1.65rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.12;
        }

        .school-pupil-card-heading p,
        .school-pupil-list-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 760;
          line-height: 1.45;
        }

        .school-pupil-form {
          display: grid;
          gap: 14px;
        }

        .school-pupil-form.compact {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(108, 92, 160, 0.12);
        }

        .school-pupil-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .school-pupil-submit {
          width: 100%;
        }

        .school-pupil-steps {
          display: grid;
          gap: 10px;
        }

        .school-pupil-steps article {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: center;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
        }

        .school-pupil-steps span {
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

        .school-pupil-steps p {
          margin: 0;
          color: #60706a;
          font-weight: 800;
          line-height: 1.35;
        }

        .school-pupil-list {
          display: grid;
          gap: 14px;
        }

        .school-pupil-record-card {
          display: grid;
          gap: 13px;
          padding: 16px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.82);
        }

        .school-pupil-record-top {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: flex-start;
          justify-content: space-between;
        }

        .school-pupil-record-top h3 {
          margin: 0 0 5px;
          color: #315f48;
          font-size: 1.14rem;
          font-weight: 950;
          line-height: 1.16;
          overflow-wrap: anywhere;
        }

        .status-pill {
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

        .status-active {
          border: 1px solid rgba(34, 124, 78, 0.22);
          background: rgba(244, 255, 249, 0.94);
          color: #145c38;
        }

        .status-paused {
          border: 1px solid rgba(191, 146, 72, 0.24);
          background: rgba(255, 250, 241, 0.94);
          color: #8a6630;
        }

        .status-expired {
          border: 1px solid rgba(190, 118, 76, 0.26);
          background: rgba(255, 248, 241, 0.94);
          color: #8a4d30;
        }

        .status-draft {
          border: 1px solid rgba(108, 92, 160, 0.16);
          background: rgba(248, 245, 255, 0.94);
          color: #5c5488;
        }

        .join-code-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(248, 245, 255, 0.66);
        }

        .join-code-meta-grid span {
          color: #60706a;
          font-size: 0.84rem;
          font-weight: 760;
          line-height: 1.28;
          overflow-wrap: anywhere;
        }

        .join-code-meta-grid strong {
          color: #315f48;
        }

        .muted-copy,
        .empty-copy {
          margin: 0;
          color: #60706a;
          font-weight: 760;
          line-height: 1.45;
        }

        .school-pupil-note {
          margin: 0;
          padding: 12px;
          border-radius: 16px;
          background: rgba(248, 248, 252, 0.84);
          color: #60706a;
          font-weight: 760;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .school-pupil-note strong {
          color: #315f48;
        }

        .school-pupil-edit-details {
          display: grid;
          gap: 12px;
        }

        .school-pupil-edit-details summary {
          display: inline-flex;
          width: fit-content;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          padding: 8px 13px;
          border: 1px solid rgba(83, 111, 99, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.88);
          color: #536f63;
          cursor: pointer;
          font-weight: 900;
          line-height: 1.1;
          list-style: none;
        }

        .school-pupil-edit-details summary::-webkit-details-marker {
          display: none;
        }

        .membership-check-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .membership-check-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
          color: #315f48;
          cursor: pointer;
        }

        .membership-check-card input {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          accent-color: #4f8d68;
        }

        .membership-check-card strong,
        .membership-check-card small {
          display: block;
        }

        .membership-check-card strong {
          margin-bottom: 4px;
          font-size: 0.9rem;
          font-weight: 950;
          line-height: 1.18;
        }

        .membership-check-card small {
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.28;
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
          .school-pupil-stat-grid,
          .school-pupil-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .join-code-meta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .school-pupil-grid,
          .school-pupil-form-grid,
          .membership-check-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .school-pupils-shell {
            width: 100%;
            max-width: 100%;
            padding: 18px 16px 40px;
          }

          .school-pupils-top-actions {
            width: 100%;
            justify-content: stretch;
          }

          .school-pupils-top-actions > *,
          .school-pupils-top-actions a,
          .school-pupils-top-actions button {
            width: 100%;
          }

          .school-pupils-hero {
            padding: 24px 20px;
            border-radius: 30px;
          }

          .school-pupil-stat-grid,
          .school-pupil-grid,
          .join-code-meta-grid {
            grid-template-columns: 1fr;
          }

          .school-pupil-safety-note,
          .school-pupil-card-heading,
          .school-pupil-list-heading {
            grid-template-columns: 1fr;
          }

          .school-pupil-card,
          .school-pupil-list-section {
            padding: 18px;
            border-radius: 24px;
          }

          .school-pupil-card-heading > span,
          .school-pupil-list-heading > span {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .school-pupil-record-top {
            display: grid;
          }

          .status-pill,
          .school-pupil-edit-details summary,
          .danger-button {
            width: 100%;
          }

          .membership-check-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 420px) {
          .school-pupils-shell {
            padding-left: 14px;
            padding-right: 14px;
          }

          .school-pupils-hero {
            padding: 22px 18px;
            border-radius: 28px;
          }
        }
      `}</style>
    </main>
  );
}
