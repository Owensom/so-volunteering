import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import {
  deleteOpportunityApproval,
  deleteOrganisationApproval,
  saveOpportunityApproval,
  saveOrganisationApproval,
} from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  user_type: string | null;
};

type OrganisationProfile = {
  user_id: string;
  organisation_name: string | null;
  contact_email: string | null;
  location: string | null;
  organisation_type: string | null;
  safeguarding_region: string | null;
  works_with_children_or_pupils: boolean | null;
};

type Opportunity = {
  id: string;
  title: string;
  summary: string;
  status: string;
  organisation_user_id: string;
  location_type: string;
  location: string | null;
  time_commitment: string | null;

  minimum_age_stage: string | null;
  suitable_for_pupils: boolean | null;
  parent_carer_consent_required: boolean | null;
  school_approval_required: boolean | null;
  safeguarding_check_region: string | null;
  safeguarding_review_required: boolean | null;
  supervision_required: boolean | null;
  no_lone_working: boolean | null;
  no_home_visits: boolean | null;
  no_money_handling: boolean | null;
  no_personal_care: boolean | null;
  no_private_messaging: boolean | null;
  risk_assessment_completed: boolean | null;
  named_safeguarding_contact: string | null;
  legal_safeguarding_notes: string | null;
  role_frequency_pattern: string | null;
};

type OrganisationApproval = {
  id: string;
  school_user_id: string;
  approved_organisation_user_id: string;
  approval_status: string;
  approval_notes: string | null;
  approval_conditions: string | null;
  s5_s6_only: boolean;
  duke_of_edinburgh_only: boolean;
  parent_carer_consent_required: boolean;
  school_supervised_only: boolean;
  safeguarding_check_review_required: boolean;
  no_lone_working: boolean;
  no_home_visits: boolean;
  no_money_handling: boolean;
  no_personal_care: boolean;
  daytime_only: boolean;
  updated_at: string;
};

type OpportunityApproval = {
  id: string;
  school_user_id: string;
  opportunity_id: string;
  organisation_user_id: string;
  approval_status: string;
  approval_notes: string | null;
  approval_conditions: string | null;
  s5_s6_only: boolean;
  duke_of_edinburgh_only: boolean;
  parent_carer_consent_required: boolean;
  school_supervised_only: boolean;
  safeguarding_check_review_required: boolean;
  no_lone_working: boolean;
  no_home_visits: boolean;
  no_money_handling: boolean;
  no_personal_care: boolean;
  daytime_only: boolean;
  updated_at: string;
};

type ApprovalConditionKey =
  | "s5_s6_only"
  | "duke_of_edinburgh_only"
  | "parent_carer_consent_required"
  | "school_supervised_only"
  | "safeguarding_check_review_required"
  | "no_lone_working"
  | "no_home_visits"
  | "no_money_handling"
  | "no_personal_care"
  | "daytime_only";

type ApprovalFormDefaults = Partial<Record<ApprovalConditionKey, boolean>> & {
  approval_status?: string;
  approval_notes?: string | null;
  approval_conditions?: string | null;
};

const conditionOptions: {
  name: ApprovalConditionKey;
  icon: string;
  title: string;
  text: string;
}[] = [
  {
    name: "s5_s6_only",
    icon: "🎓",
    title: "S5/S6 only",
    text: "Suitable only for older school pupils.",
  },
  {
    name: "duke_of_edinburgh_only",
    icon: "🏅",
    title: "Duke of Edinburgh only",
    text: "Use only for approved DofE pathways.",
  },
  {
    name: "parent_carer_consent_required",
    icon: "👪",
    title: "Parent/carer consent",
    text: "Consent is required before pupils can take part.",
  },
  {
    name: "school_supervised_only",
    icon: "🏫",
    title: "School-supervised only",
    text: "Pupils should only take part with school supervision.",
  },
  {
    name: "safeguarding_check_review_required",
    icon: "🛡️",
    title: "PVG/DBS/AccessNI review",
    text: "Safeguarding check wording needs review before use.",
  },
  {
    name: "no_lone_working",
    icon: "🚫",
    title: "No lone working",
    text: "No one-to-one unsupervised activity.",
  },
  {
    name: "no_home_visits",
    icon: "🏠",
    title: "No home visits",
    text: "Pupils should not visit private homes.",
  },
  {
    name: "no_money_handling",
    icon: "💷",
    title: "No money handling",
    text: "No handling payments or financial details.",
  },
  {
    name: "no_personal_care",
    icon: "🤲",
    title: "No personal care",
    text: "No personal care tasks.",
  },
  {
    name: "daytime_only",
    icon: "☀️",
    title: "Daytime only",
    text: "Only suitable during normal daytime activity.",
  },
];

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function formatApprovalStatus(value: string | null | undefined) {
  if (value === "approved") return "Approved";
  if (value === "paused") return "Paused";
  if (value === "declined") return "Declined";
  return "Draft";
}

function getApprovalStatusClass(value: string | null | undefined) {
  if (value === "approved") return "approval-status approval-status-approved";
  if (value === "paused") return "approval-status approval-status-paused";
  if (value === "declined") return "approval-status approval-status-declined";
  return "approval-status approval-status-draft";
}

function formatOrganisationType(value: string | null | undefined) {
  if (value === "school_college") return "School / college";
  if (value === "local_authority_employability") {
    return "Local authority / employability partner";
  }
  if (value === "other") return "Other organisation";
  return "Charity / community organisation";
}

function formatSafeguardingRegion(value: string | null | undefined) {
  if (value === "england_wales") return "England / Wales - DBS";
  if (value === "northern_ireland") return "Northern Ireland - AccessNI";
  if (value === "other") return "Other / country-specific guidance";
  return "Scotland - PVG";
}

function formatLocationType(value: string | null | undefined) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  return "In-person";
}

function formatMinimumAgeStage(value: string | null | undefined) {
  if (value === "adults_only") return "Adults only";
  if (value === "sixteen_plus") return "16+";
  if (value === "fourteen_plus") return "14+";
  if (value === "school_pupils_with_approval") return "School approval";
  if (value === "school_pupils_with_parent_carer_consent") {
    return "Parent/carer consent";
  }
  return "Not set";
}

function formatSafeguardingCheck(value: string | null | undefined) {
  if (value === "scotland_pvg") return "PVG";
  if (value === "england_wales_dbs") return "DBS";
  if (value === "northern_ireland_accessni") return "AccessNI";
  if (value === "not_expected") return "No check expected";
  if (value === "not_sure") return "Needs review";
  return "Organisation default";
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

function getOrganisationName(
  userId: string,
  organisationMap: Map<string, OrganisationProfile>,
) {
  return (
    organisationMap.get(userId)?.organisation_name ||
    organisationMap.get(userId)?.contact_email ||
    "Organisation"
  );
}

function getOpportunityTitle(
  opportunityId: string,
  opportunityMap: Map<string, Opportunity>,
) {
  return opportunityMap.get(opportunityId)?.title || "Opportunity";
}

function ApprovalConditionCheckboxes({
  defaults = {},
}: {
  defaults?: ApprovalFormDefaults;
}) {
  return (
    <div className="condition-grid">
      {conditionOptions.map((option) => (
        <label key={option.name} className="condition-card">
          <input
            type="checkbox"
            name={option.name}
            defaultChecked={defaults[option.name] === true}
          />
          <span className="condition-icon" aria-hidden="true">
            {option.icon}
          </span>
          <span>
            <strong>{option.title}</strong>
            <small>{option.text}</small>
          </span>
        </label>
      ))}
    </div>
  );
}

function ApprovalFields({
  defaults = {},
}: {
  defaults?: ApprovalFormDefaults;
}) {
  return (
    <>
      <label className="field-label">
        <span className="field-label-row">
          <span className="field-label-icon" aria-hidden="true">
            📌
          </span>
          <span>Approval status</span>
        </span>
        <select
          name="approval_status"
          defaultValue={defaults.approval_status || "draft"}
        >
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="paused">Paused</option>
          <option value="declined">Declined</option>
        </select>
      </label>

      <label className="field-label">
        <span className="field-label-row">
          <span className="field-label-icon" aria-hidden="true">
            📝
          </span>
          <span>Approval notes optional</span>
        </span>
        <textarea
          name="approval_notes"
          rows={3}
          defaultValue={defaults.approval_notes || ""}
          placeholder="Internal school note. Example: Suitable for senior pupils after parent/carer consent."
        />
      </label>

      <label className="field-label">
        <span className="field-label-row">
          <span className="field-label-icon" aria-hidden="true">
            ✅
          </span>
          <span>Approval conditions optional</span>
        </span>
        <textarea
          name="approval_conditions"
          rows={3}
          defaultValue={defaults.approval_conditions || ""}
          placeholder="Example: S5/S6 only, daytime only, school staff to confirm first visit arrangements."
        />
      </label>

      <ApprovalConditionCheckboxes defaults={defaults} />
    </>
  );
}

function ConditionPills({
  approval,
}: {
  approval: ApprovalFormDefaults;
}) {
  const activeConditions = conditionOptions.filter(
    (condition) => approval[condition.name] === true,
  );

  if (activeConditions.length === 0) {
    return <p className="muted-copy">No condition flags selected.</p>;
  }

  return (
    <div className="condition-pill-list">
      {activeConditions.map((condition) => (
        <span key={condition.name} className="condition-pill">
          <span aria-hidden="true">{condition.icon}</span>
          {condition.title}
        </span>
      ))}
    </div>
  );
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
    <article className="school-stat-card">
      <span aria-hidden="true">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

export default async function SchoolApprovalsPage({
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
      "user_id,organisation_name,contact_email,location,organisation_type,safeguarding_region,works_with_children_or_pupils",
    )
    .eq("user_id", user.id)
    .maybeSingle<OrganisationProfile>();

  if (schoolProfile?.organisation_type !== "school_college") {
    redirect("/organisation/dashboard");
  }

  const { data: organisationProfiles } = await supabase
    .from("organisation_profiles")
    .select(
      "user_id,organisation_name,contact_email,location,organisation_type,safeguarding_region,works_with_children_or_pupils",
    )
    .neq("user_id", user.id)
    .neq("organisation_type", "school_college")
    .order("organisation_name", { ascending: true });

  const organisations = (organisationProfiles as OrganisationProfile[] | null) ?? [];

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id,title,summary,status,organisation_user_id,location_type,location,time_commitment,minimum_age_stage,suitable_for_pupils,parent_carer_consent_required,school_approval_required,safeguarding_check_region,safeguarding_review_required,supervision_required,no_lone_working,no_home_visits,no_money_handling,no_personal_care,no_private_messaging,risk_assessment_completed,named_safeguarding_contact,legal_safeguarding_notes,role_frequency_pattern",
    )
    .eq("status", "published")
    .neq("organisation_user_id", user.id)
    .order("title", { ascending: true });

  const publishedOpportunities = ((opportunities as Opportunity[] | null) ?? []).filter(
    (opportunity) => {
      const ownerProfile = organisations.find(
        (organisation) => organisation.user_id === opportunity.organisation_user_id,
      );

      return ownerProfile && ownerProfile.organisation_type !== "school_college";
    },
  );

  const { data: organisationApprovalsData } = await supabase
    .from("school_approval_organisations")
    .select("*")
    .eq("school_user_id", user.id)
    .order("updated_at", { ascending: false });

  const organisationApprovals =
    (organisationApprovalsData as OrganisationApproval[] | null) ?? [];

  const { data: opportunityApprovalsData } = await supabase
    .from("school_approval_opportunities")
    .select("*")
    .eq("school_user_id", user.id)
    .order("updated_at", { ascending: false });

  const opportunityApprovals =
    (opportunityApprovalsData as OpportunityApproval[] | null) ?? [];

  const organisationMap = new Map(
    organisations.map((organisation) => [organisation.user_id, organisation]),
  );

  const opportunityMap = new Map(
    publishedOpportunities.map((opportunity) => [opportunity.id, opportunity]),
  );

  const approvedOrganisationCount = organisationApprovals.filter(
    (approval) => approval.approval_status === "approved",
  ).length;

  const approvedOpportunityCount = opportunityApprovals.filter(
    (approval) => approval.approval_status === "approved",
  ).length;

  const pausedOrDeclinedCount =
    organisationApprovals.filter(
      (approval) =>
        approval.approval_status === "paused" ||
        approval.approval_status === "declined",
    ).length +
    opportunityApprovals.filter(
      (approval) =>
        approval.approval_status === "paused" ||
        approval.approval_status === "declined",
    ).length;

  const flaggedConditionCount =
    organisationApprovals.reduce((total, approval) => {
      return (
        total +
        conditionOptions.filter((condition) => approval[condition.name] === true)
          .length
      );
    }, 0) +
    opportunityApprovals.reduce((total, approval) => {
      return (
        total +
        conditionOptions.filter((condition) => approval[condition.name] === true)
          .length
      );
    }, 0);

  const listenText =
    "This is the school approvals dashboard. It is only for school or college organisations. It lets a school record approved organisations and approved opportunities, with notes and safety conditions. This phase does not change public visibility, does not filter pupils yet, and does not change volunteer pages. Approval statuses are draft, approved, paused and declined. Conditions include S5 or S6 only, Duke of Edinburgh only, parent or carer consent, school supervised only, PVG, DBS or AccessNI review, no lone working, no home visits, no money handling, no personal care and daytime only.";

  return (
    <main className="dashboard-bg school-approvals-page">
      <section className="dashboard-shell school-approvals-shell">
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

          <div className="dashboard-topbar-actions school-approvals-top-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href="/organisation/dashboard"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Dashboard</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card school-approval-hero"
          aria-labelledby="school-approvals-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">School safety layer phase 1C</p>

            <h1 id="school-approvals-title" className="dashboard-title">
              <span aria-hidden="true">🏫</span>
              <span>School approvals</span>
            </h1>

            <p className="dashboard-lead">
              Record which organisations and opportunities your school is happy
              to approve, pause or decline. This is an internal school control
              layer only at this stage.
            </p>

            <div className="school-safety-note">
              <span aria-hidden="true">🛡️</span>
              <p>
                No public pages change here. No pupil filtering starts yet.
                These records prepare the later school-approved-only pathway.
              </p>
            </div>
          </div>

          <aside className="dashboard-progress-card">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                ⚖️
              </span>
              <div>
                <h2>{schoolProfile?.organisation_name || "School approvals"}</h2>
                <p>{formatSafeguardingRegion(schoolProfile?.safeguarding_region)}</p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              Organisation type:{" "}
              <strong>{formatOrganisationType(schoolProfile?.organisation_type)}</strong>
            </p>
            <p className="dashboard-progress-note">
              Approved organisations: <strong>{approvedOrganisationCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Approved opportunities: <strong>{approvedOpportunityCount}</strong>
            </p>
            <p className="dashboard-progress-note">
              Paused/declined records: <strong>{pausedOrDeclinedCount}</strong>
            </p>
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <section className="school-stat-grid" aria-label="Approval summary">
          <StatCard
            icon="🏢"
            label="Approved organisations"
            value={approvedOrganisationCount}
            helper="Organisation-level school approvals"
          />
          <StatCard
            icon="📣"
            label="Approved opportunities"
            value={approvedOpportunityCount}
            helper="Role-level school approvals"
          />
          <StatCard
            icon="⏸️"
            label="Paused or declined"
            value={pausedOrDeclinedCount}
            helper="Records not currently approved"
          />
          <StatCard
            icon="✅"
            label="Condition flags"
            value={flaggedConditionCount}
            helper="Safety conditions selected"
          />
        </section>

        <section className="school-approval-grid">
          <article className="approval-form-card">
            <div className="approval-card-heading">
              <span aria-hidden="true">🏢</span>
              <div>
                <p className="dashboard-kicker">Organisation approval</p>
                <h2>Approve an organisation</h2>
                <p>
                  Use this when your school is happy for pupils to see or use
                  opportunities from an organisation later, once filtering is
                  built.
                </p>
              </div>
            </div>

            <form action={saveOrganisationApproval} className="approval-form">
              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    🏢
                  </span>
                  <span>Organisation</span>
                </span>
                <select name="approved_organisation_user_id" required defaultValue="">
                  <option value="">Choose organisation</option>
                  {organisations.map((organisation) => (
                    <option key={organisation.user_id} value={organisation.user_id}>
                      {organisation.organisation_name ||
                        organisation.contact_email ||
                        organisation.user_id}
                    </option>
                  ))}
                </select>
              </label>

              <ApprovalFields />

              <button type="submit" className="primary-button approval-submit">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">✅</span>
                  <span>Save organisation approval</span>
                </span>
              </button>
            </form>
          </article>

          <article className="approval-form-card">
            <div className="approval-card-heading">
              <span aria-hidden="true">📣</span>
              <div>
                <p className="dashboard-kicker">Opportunity approval</p>
                <h2>Approve a specific opportunity</h2>
                <p>
                  Use this when one role is suitable but the whole organisation
                  is not approved yet.
                </p>
              </div>
            </div>

            <form action={saveOpportunityApproval} className="approval-form">
              <label className="field-label">
                <span className="field-label-row">
                  <span className="field-label-icon" aria-hidden="true">
                    📣
                  </span>
                  <span>Published opportunity</span>
                </span>
                <select name="opportunity_id" required defaultValue="">
                  <option value="">Choose opportunity</option>
                  {publishedOpportunities.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title} ·{" "}
                      {getOrganisationName(opportunity.organisation_user_id, organisationMap)}
                    </option>
                  ))}
                </select>
              </label>

              <ApprovalFields />

              <button type="submit" className="primary-button approval-submit">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">✅</span>
                  <span>Save opportunity approval</span>
                </span>
              </button>
            </form>
          </article>
        </section>

        <section
          className="approval-list-section"
          aria-labelledby="organisation-approvals-title"
        >
          <div className="approval-list-heading">
            <span aria-hidden="true">🏢</span>
            <div>
              <p className="dashboard-kicker">Saved records</p>
              <h2 id="organisation-approvals-title">Organisation approvals</h2>
            </div>
          </div>

          {organisationApprovals.length === 0 ? (
            <p className="empty-copy">No organisation approvals saved yet.</p>
          ) : (
            <div className="approval-list">
              {organisationApprovals.map((approval) => (
                <article key={approval.id} className="approval-record-card">
                  <div className="approval-record-top">
                    <div>
                      <p className="dashboard-kicker">Organisation</p>
                      <h3>
                        {getOrganisationName(
                          approval.approved_organisation_user_id,
                          organisationMap,
                        )}
                      </h3>
                      <p className="muted-copy">
                        Updated {formatDate(approval.updated_at)}
                      </p>
                    </div>

                    <span className={getApprovalStatusClass(approval.approval_status)}>
                      {formatApprovalStatus(approval.approval_status)}
                    </span>
                  </div>

                  <ConditionPills approval={approval} />

                  {approval.approval_conditions ? (
                    <p className="approval-note">
                      <strong>Conditions:</strong> {approval.approval_conditions}
                    </p>
                  ) : null}

                  {approval.approval_notes ? (
                    <p className="approval-note">
                      <strong>Notes:</strong> {approval.approval_notes}
                    </p>
                  ) : null}

                  <details className="approval-edit-details">
                    <summary>Edit approval</summary>

                    <form action={saveOrganisationApproval} className="approval-form compact">
                      <input
                        type="hidden"
                        name="approved_organisation_user_id"
                        value={approval.approved_organisation_user_id}
                      />

                      <ApprovalFields defaults={approval} />

                      <button type="submit" className="primary-button approval-submit">
                        <span className="dashboard-button-inner">
                          <span aria-hidden="true">✅</span>
                          <span>Update approval</span>
                        </span>
                      </button>
                    </form>
                  </details>

                  <form action={deleteOrganisationApproval}>
                    <input type="hidden" name="approval_id" value={approval.id} />
                    <button type="submit" className="danger-button">
                      Remove approval
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          className="approval-list-section"
          aria-labelledby="opportunity-approvals-title"
        >
          <div className="approval-list-heading">
            <span aria-hidden="true">📣</span>
            <div>
              <p className="dashboard-kicker">Saved records</p>
              <h2 id="opportunity-approvals-title">Opportunity approvals</h2>
            </div>
          </div>

          {opportunityApprovals.length === 0 ? (
            <p className="empty-copy">No opportunity approvals saved yet.</p>
          ) : (
            <div className="approval-list">
              {opportunityApprovals.map((approval) => {
                const opportunity = opportunityMap.get(approval.opportunity_id);

                return (
                  <article key={approval.id} className="approval-record-card">
                    <div className="approval-record-top">
                      <div>
                        <p className="dashboard-kicker">Opportunity</p>
                        <h3>
                          {getOpportunityTitle(approval.opportunity_id, opportunityMap)}
                        </h3>
                        <p className="muted-copy">
                          {getOrganisationName(approval.organisation_user_id, organisationMap)}
                          {" · "}
                          Updated {formatDate(approval.updated_at)}
                        </p>
                      </div>

                      <span className={getApprovalStatusClass(approval.approval_status)}>
                        {formatApprovalStatus(approval.approval_status)}
                      </span>
                    </div>

                    {opportunity ? (
                      <div className="opportunity-context-card">
                        <span>
                          <strong>Type:</strong>{" "}
                          {formatLocationType(opportunity.location_type)}
                        </span>
                        <span>
                          <strong>Time:</strong>{" "}
                          {opportunity.time_commitment || "Not listed"}
                        </span>
                        <span>
                          <strong>Age/stage:</strong>{" "}
                          {formatMinimumAgeStage(opportunity.minimum_age_stage)}
                        </span>
                        <span>
                          <strong>Check:</strong>{" "}
                          {formatSafeguardingCheck(
                            opportunity.safeguarding_check_region,
                          )}
                        </span>
                      </div>
                    ) : null}

                    <ConditionPills approval={approval} />

                    {approval.approval_conditions ? (
                      <p className="approval-note">
                        <strong>Conditions:</strong> {approval.approval_conditions}
                      </p>
                    ) : null}

                    {approval.approval_notes ? (
                      <p className="approval-note">
                        <strong>Notes:</strong> {approval.approval_notes}
                      </p>
                    ) : null}

                    <details className="approval-edit-details">
                      <summary>Edit approval</summary>

                      <form action={saveOpportunityApproval} className="approval-form compact">
                        <input
                          type="hidden"
                          name="opportunity_id"
                          value={approval.opportunity_id}
                        />

                        <ApprovalFields defaults={approval} />

                        <button type="submit" className="primary-button approval-submit">
                          <span className="dashboard-button-inner">
                            <span aria-hidden="true">✅</span>
                            <span>Update approval</span>
                          </span>
                        </button>
                      </form>
                    </details>

                    <form action={deleteOpportunityApproval}>
                      <input type="hidden" name="approval_id" value={approval.id} />
                      <button type="submit" className="danger-button">
                        Remove approval
                      </button>
                    </form>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .school-approvals-page,
        .school-approvals-page * {
          box-sizing: border-box;
        }

        .school-approvals-page {
          overflow-x: hidden;
        }

        .school-approvals-shell {
          width: min(1180px, calc(100% - 32px));
        }

        .school-approvals-top-actions {
          gap: 12px;
        }

        .school-approval-hero,
        .approval-form-card,
        .approval-list-section,
        .approval-record-card,
        .school-stat-card {
          overflow: hidden;
        }

        .school-safety-note {
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

        .school-safety-note p {
          margin: 0;
        }

        .school-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin: 20px 0;
        }

        .school-stat-card {
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

        .school-stat-card > span {
          display: inline-flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: rgba(143, 178, 158, 0.13);
          font-size: 1.25rem;
        }

        .school-stat-card p {
          margin: 0 0 5px;
          color: #60706a;
          font-size: 0.82rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .school-stat-card strong {
          display: block;
          color: #315f48;
          font-size: 1.85rem;
          line-height: 1;
        }

        .school-stat-card small {
          display: block;
          margin-top: 8px;
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.25;
        }

        .school-approval-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin: 22px 0;
          align-items: start;
        }

        .approval-form-card,
        .approval-list-section {
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

        .approval-card-heading,
        .approval-list-heading {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .approval-card-heading > span,
        .approval-list-heading > span {
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

        .approval-card-heading h2,
        .approval-list-heading h2 {
          margin: 0 0 8px;
          color: #315f48;
          font-size: clamp(1.3rem, 3vw, 1.65rem);
          font-weight: 950;
          letter-spacing: -0.035em;
          line-height: 1.12;
        }

        .approval-card-heading p,
        .approval-list-heading p {
          margin: 0;
          color: #60706a;
          font-weight: 760;
          line-height: 1.45;
        }

        .approval-form {
          display: grid;
          gap: 14px;
        }

        .approval-form.compact {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(108, 92, 160, 0.12);
        }

        .condition-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .condition-card {
          display: grid;
          grid-template-columns: auto auto 1fr;
          gap: 10px;
          align-items: start;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
          color: #315f48;
          cursor: pointer;
        }

        .condition-card input {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          accent-color: #4f8d68;
        }

        .condition-icon {
          font-size: 1.2rem;
          line-height: 1;
        }

        .condition-card strong,
        .condition-card small {
          display: block;
        }

        .condition-card strong {
          margin-bottom: 4px;
          font-size: 0.9rem;
          font-weight: 950;
          line-height: 1.18;
        }

        .condition-card small {
          color: #60706a;
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.28;
        }

        .approval-submit {
          width: 100%;
        }

        .approval-list {
          display: grid;
          gap: 14px;
        }

        .approval-record-card {
          display: grid;
          gap: 13px;
          padding: 16px;
          border: 1px solid rgba(108, 92, 160, 0.14);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.82);
        }

        .approval-record-top {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: flex-start;
          justify-content: space-between;
        }

        .approval-record-top h3 {
          margin: 0 0 5px;
          color: #315f48;
          font-size: 1.14rem;
          font-weight: 950;
          line-height: 1.16;
          overflow-wrap: anywhere;
        }

        .approval-status {
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

        .approval-status-approved {
          border: 1px solid rgba(34, 124, 78, 0.22);
          background: rgba(244, 255, 249, 0.94);
          color: #145c38;
        }

        .approval-status-paused {
          border: 1px solid rgba(191, 146, 72, 0.24);
          background: rgba(255, 250, 241, 0.94);
          color: #8a6630;
        }

        .approval-status-declined {
          border: 1px solid rgba(190, 118, 76, 0.26);
          background: rgba(255, 248, 241, 0.94);
          color: #8a4d30;
        }

        .approval-status-draft {
          border: 1px solid rgba(108, 92, 160, 0.16);
          background: rgba(248, 245, 255, 0.94);
          color: #5c5488;
        }

        .muted-copy,
        .empty-copy {
          margin: 0;
          color: #60706a;
          font-weight: 760;
          line-height: 1.45;
        }

        .condition-pill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .condition-pill {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          padding: 7px 10px;
          border: 1px solid rgba(34, 124, 78, 0.18);
          border-radius: 999px;
          background: rgba(244, 255, 249, 0.9);
          color: #145c38;
          font-size: 0.8rem;
          font-weight: 900;
          line-height: 1.12;
        }

        .approval-note {
          margin: 0;
          padding: 12px;
          border-radius: 16px;
          background: rgba(248, 248, 252, 0.84);
          color: #60706a;
          font-weight: 760;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .approval-note strong {
          color: #315f48;
        }

        .opportunity-context-card {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding: 12px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 18px;
          background: rgba(248, 245, 255, 0.66);
        }

        .opportunity-context-card span {
          color: #60706a;
          font-size: 0.84rem;
          font-weight: 760;
          line-height: 1.28;
          overflow-wrap: anywhere;
        }

        .opportunity-context-card strong {
          color: #315f48;
        }

        .approval-edit-details {
          display: grid;
          gap: 12px;
        }

        .approval-edit-details summary {
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

        .approval-edit-details summary::-webkit-details-marker {
          display: none;
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
          .school-stat-grid,
          .school-approval-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .school-approval-grid,
          .condition-grid,
          .opportunity-context-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .school-approvals-shell {
            width: 100%;
            max-width: 100%;
            padding: 18px 16px 40px;
          }

          .school-approvals-top-actions {
            width: 100%;
            justify-content: stretch;
          }

          .school-approvals-top-actions > *,
          .school-approvals-top-actions a,
          .school-approvals-top-actions button {
            width: 100%;
          }

          .school-approval-hero {
            padding: 24px 20px;
            border-radius: 30px;
          }

          .school-stat-grid,
          .school-approval-grid {
            grid-template-columns: 1fr;
          }

          .school-safety-note,
          .approval-card-heading,
          .approval-list-heading {
            grid-template-columns: 1fr;
          }

          .approval-form-card,
          .approval-list-section {
            padding: 18px;
            border-radius: 24px;
          }

          .approval-card-heading > span,
          .approval-list-heading > span {
            width: 56px;
            height: 56px;
            border-radius: 20px;
          }

          .condition-card {
            grid-template-columns: 1fr;
          }

          .condition-icon {
            display: none;
          }

          .approval-record-top {
            display: grid;
          }

          .approval-status,
          .approval-edit-details summary,
          .danger-button {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .school-approvals-shell {
            padding-left: 14px;
            padding-right: 14px;
          }

          .school-approval-hero {
            padding: 22px 18px;
            border-radius: 28px;
          }
        }
      `}</style>
    </main>
  );
}
