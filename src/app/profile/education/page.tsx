import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton } from "@/components/InclusiveSupport";
import { deleteEducationEntry, saveEducationEntry } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  full_name: string | null;
  user_type: string | null;
};

type EducationEntry = {
  id: string;
  entry_type: string;
  institution_name: string | null;
  qualification_name: string;
  qualification_level: string | null;
  subject_or_area: string | null;
  year_started: string | null;
  year_completed: string | null;
  is_current: boolean;
  notes: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type EntryTypeOption = {
  value: string;
  icon: string;
  title: string;
  description: string;
};

const entryTypeOptions: EntryTypeOption[] = [
  {
    value: "school",
    icon: "🏫",
    title: "School",
    description: "School qualifications or awards.",
  },
  {
    value: "college",
    icon: "🎓",
    title: "College",
    description: "College course, award or qualification.",
  },
  {
    value: "university",
    icon: "📚",
    title: "University",
    description: "Degree, module or university learning.",
  },
  {
    value: "training_course",
    icon: "🧭",
    title: "Training course",
    description: "Training completed in person.",
  },
  {
    value: "online_course",
    icon: "💻",
    title: "Online course",
    description: "Online learning, course or module.",
  },
  {
    value: "certificate",
    icon: "📜",
    title: "Certificate",
    description: "Certificate, award or short qualification.",
  },
  {
    value: "work_related_training",
    icon: "🛠️",
    title: "Work-related training",
    description: "Training linked to work or volunteering.",
  },
  {
    value: "other",
    icon: "✨",
    title: "Other",
    description: "Something useful that does not fit above.",
  },
];

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function formatEntryType(value: string) {
  const option = entryTypeOptions.find((entry) => entry.value === value);
  return option?.title || "Education";
}

function getEntryIcon(value: string) {
  const option = entryTypeOptions.find((entry) => entry.value === value);
  return option?.icon || "📚";
}

function formatStudyDates(entry: EducationEntry) {
  if (entry.is_current && entry.year_started) {
    return `${entry.year_started} – Present`;
  }

  if (entry.is_current) {
    return "Currently studying";
  }

  if (entry.year_started && entry.year_completed) {
    return `${entry.year_started} – ${entry.year_completed}`;
  }

  if (entry.year_completed) {
    return entry.year_completed;
  }

  if (entry.year_started) {
    return `Started ${entry.year_started}`;
  }

  return "Dates optional";
}

function EntryTypeChoiceGrid({
  selectedValue,
}: {
  selectedValue: string;
}) {
  return (
    <div className="education-choice-grid">
      {entryTypeOptions.map((option) => (
        <label key={option.value} className="education-choice-card">
          <input
            type="radio"
            name="entry_type"
            value={option.value}
            defaultChecked={selectedValue === option.value}
          />

          <span className="education-choice-icon" aria-hidden="true">
            {option.icon}
          </span>

          <span className="education-choice-copy">
            <span className="education-choice-title">{option.title}</span>
            <span className="education-choice-description">
              {option.description}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

function EducationEntryForm({
  entry,
}: {
  entry?: EducationEntry;
}) {
  const isEditing = Boolean(entry);

  return (
    <form action={saveEducationEntry} className="education-entry-form">
      {entry ? (
        <input type="hidden" name="education_id" value={entry.id} />
      ) : null}

      <fieldset className="education-fieldset">
        <legend>
          <span className="field-label-row">
            <span className="field-label-icon" aria-hidden="true">
              📚
            </span>
            <span>Type of education or training</span>
          </span>
        </legend>

        <EntryTypeChoiceGrid selectedValue={entry?.entry_type || "school"} />
      </fieldset>

      <div className="education-form-grid">
        <label className="field-label">
          <span className="field-label-row">
            <span className="field-label-icon" aria-hidden="true">
              ⭐
            </span>
            <span>Qualification, course or training name</span>
          </span>
          <input
            name="qualification_name"
            type="text"
            required
            defaultValue={entry?.qualification_name || ""}
            placeholder="Example: National 5 English, Food Hygiene, First Aid"
          />
        </label>

        <label className="field-label">
          <span className="field-label-row">
            <span className="field-label-icon" aria-hidden="true">
              🏫
            </span>
            <span>School, college or provider optional</span>
          </span>
          <input
            name="institution_name"
            type="text"
            defaultValue={entry?.institution_name || ""}
            placeholder="Example: Aberdeen College, Online course, Local charity"
          />
        </label>

        <label className="field-label">
          <span className="field-label-row">
            <span className="field-label-icon" aria-hidden="true">
              📌
            </span>
            <span>Level optional</span>
          </span>
          <input
            name="qualification_level"
            type="text"
            defaultValue={entry?.qualification_level || ""}
            placeholder="Example: National 5, Level 2, Beginner"
          />
        </label>

        <label className="field-label">
          <span className="field-label-row">
            <span className="field-label-icon" aria-hidden="true">
              💡
            </span>
            <span>Subject or area optional</span>
          </span>
          <input
            name="subject_or_area"
            type="text"
            defaultValue={entry?.subject_or_area || ""}
            placeholder="Example: Music, Customer service, Health and safety"
          />
        </label>

        <label className="field-label">
          <span className="field-label-row">
            <span className="field-label-icon" aria-hidden="true">
              📅
            </span>
            <span>Year started optional</span>
          </span>
          <input
            name="year_started"
            type="text"
            inputMode="numeric"
            defaultValue={entry?.year_started || ""}
            placeholder="Example: 2024"
          />
        </label>

        <label className="field-label">
          <span className="field-label-row">
            <span className="field-label-icon" aria-hidden="true">
              ✅
            </span>
            <span>Year completed optional</span>
          </span>
          <input
            name="year_completed"
            type="text"
            inputMode="numeric"
            defaultValue={entry?.year_completed || ""}
            placeholder="Example: 2026"
          />
        </label>
      </div>

      <label className="education-checkbox-card">
        <input
          type="checkbox"
          name="is_current"
          defaultChecked={entry?.is_current === true}
        />
        <span aria-hidden="true">🌱</span>
        <span>
          <strong>I am still studying or completing this</strong>
          <small>This will show as “Present” on the CV.</small>
        </span>
      </label>

      <label className="field-label">
        <span className="field-label-row">
          <span className="field-label-icon" aria-hidden="true">
            💬
          </span>
          <span>Short note optional</span>
        </span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={entry?.notes || ""}
          placeholder="Example: Completed as part of volunteering preparation. I enjoyed learning how to help safely."
        />
      </label>

      <label className="field-label display-order-field">
        <span className="field-label-row">
          <span className="field-label-icon" aria-hidden="true">
            🔢
          </span>
          <span>Order optional</span>
        </span>
        <input
          name="display_order"
          type="number"
          min="0"
          max="999"
          defaultValue={entry?.display_order ?? 0}
        />
      </label>

      <button type="submit" className="primary-button education-submit-button">
        <span className="button-balanced-inner">
          <span aria-hidden="true">{isEditing ? "✅" : "➕"}</span>
          <span>{isEditing ? "Save changes" : "Add to my CV"}</span>
        </span>
      </button>
    </form>
  );
}

export default async function EducationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";
  const successMessage = params.message ? decodeURIComponent(params.message) : "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  const { data: educationEntries } = await supabase
    .from("volunteer_education_entries")
    .select(
      "id,entry_type,institution_name,qualification_name,qualification_level,subject_or_area,year_started,year_completed,is_current,notes,display_order,created_at,updated_at",
    )
    .eq("volunteer_user_id", user.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (educationEntries as EducationEntry[] | null) ?? [];
  const displayName = profile?.full_name?.trim() || "there";

  const listenText =
    "You are on the Education and Qualifications page. This page is optional. Add school, college, training, certificates, online courses or other useful learning if you want them to appear on your Positive Pathway CV. Choose a type first, then add the qualification, course or training name. Provider, level, subject, years and notes are optional. You can edit or remove entries later.";

  return (
    <main className="dashboard-bg education-page">
      <section className="dashboard-shell">
        <header className="dashboard-topbar education-topbar">
          <Link
            href="/profile"
            className="dashboard-brand"
            aria-label="Back to profile"
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

          <div className="dashboard-topbar-actions education-topbar-actions">
            <InclusiveAudioButton text={listenText} />

            <Link
              href="/profile"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">←</span>
                <span>Back to profile</span>
              </span>
            </Link>

            <Link
              href="/pathway/cv"
              className="secondary-button dashboard-signout-button"
            >
              <span className="dashboard-button-inner">
                <span aria-hidden="true">📄</span>
                <span>View CV</span>
              </span>
            </Link>
          </div>
        </header>

        <section
          className="dashboard-welcome-card education-hero"
          aria-labelledby="education-title"
        >
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">Optional CV section</p>

            <h1 id="education-title" className="dashboard-title">
              <span aria-hidden="true">📚</span>
              <span>Education & Qualifications</span>
            </h1>

            <p className="dashboard-lead">
              Hi {displayName}. Add any learning, courses, certificates or
              qualifications you want included in your Positive Pathway CV.
            </p>

            <div className="dashboard-primary-actions education-hero-actions">
              <a href="#add-education" className="primary-button">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">➕</span>
                  <span>Add education</span>
                </span>
              </a>

              <Link href="/pathway/cv" className="secondary-button">
                <span className="dashboard-button-inner">
                  <span aria-hidden="true">📄</span>
                  <span>View CV</span>
                </span>
              </Link>
            </div>
          </div>

          <aside className="dashboard-progress-card" aria-label="Education summary">
            <div className="dashboard-progress-header">
              <span className="dashboard-progress-icon" aria-hidden="true">
                🎓
              </span>
              <div>
                <h2>CV entries</h2>
                <p>
                  {rows.length} education entr
                  {rows.length === 1 ? "y" : "ies"} added.
                </p>
              </div>
            </div>

            <p className="dashboard-progress-note">
              This section is optional. It is fine to leave it blank.
            </p>
          </aside>
        </section>

        {successMessage ? (
          <div className="alert alert-success">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <section className="education-existing-section" aria-label="Saved education entries">
          <div className="education-section-heading">
            <p className="dashboard-kicker">Saved entries</p>
            <h2>Your education and training</h2>
            <p>
              These entries will be formatted into the Education &
              Qualifications section of your CV.
            </p>
          </div>

          {rows.length === 0 ? (
            <article className="info-card education-empty-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                📚
              </div>
              <div className="dashboard-card-copy">
                <p className="dashboard-card-label">Nothing added yet</p>
                <h2>No education or qualifications added</h2>
                <p>
                  You can add school, training, certificates, online learning or
                  any qualification you want to include.
                </p>
              </div>
            </article>
          ) : (
            <div className="education-entry-list">
              {rows.map((entry) => (
                <article key={entry.id} className="info-card education-entry-card">
                  <div className="education-entry-header">
                    <span className="dashboard-card-icon" aria-hidden="true">
                      {getEntryIcon(entry.entry_type)}
                    </span>

                    <div>
                      <p className="dashboard-card-label">
                        {formatEntryType(entry.entry_type)}
                      </p>
                      <h2>{entry.qualification_name}</h2>
                      <p>
                        {entry.institution_name || "Provider not added"} ·{" "}
                        {formatStudyDates(entry)}
                      </p>
                    </div>
                  </div>

                  <div className="education-entry-details">
                    {entry.qualification_level ? (
                      <span>Level: {entry.qualification_level}</span>
                    ) : null}

                    {entry.subject_or_area ? (
                      <span>Area: {entry.subject_or_area}</span>
                    ) : null}

                    {entry.is_current ? <span>Currently studying</span> : null}
                  </div>

                  {entry.notes ? (
                    <div className="education-note-box">
                      <p>{entry.notes}</p>
                    </div>
                  ) : null}

                  <details className="education-edit-details">
                    <summary>Edit this entry</summary>
                    <EducationEntryForm entry={entry} />

                    <form
                      action={deleteEducationEntry}
                      className="education-delete-form"
                    >
                      <input
                        type="hidden"
                        name="education_id"
                        value={entry.id}
                      />

                      <button type="submit" className="secondary-button danger-button">
                        <span className="button-balanced-inner">
                          <span aria-hidden="true">🗑️</span>
                          <span>Remove this entry</span>
                        </span>
                      </button>
                    </form>
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          id="add-education"
          className="info-card education-add-card"
          aria-labelledby="add-education-title"
        >
          <div className="education-section-heading">
            <p className="dashboard-kicker">Add new entry</p>
            <h2 id="add-education-title">Add education or training</h2>
            <p>
              Add only what you want. The CV page will format this into a clean,
              appropriate CV section.
            </p>
          </div>

          <EducationEntryForm />
        </section>
      </section>

      <style>{`
        .education-page,
        .education-page * {
          box-sizing: border-box;
        }

        .education-topbar-actions,
        .education-hero-actions {
          gap: 10px;
        }

        .education-existing-section {
          display: grid;
          gap: 16px;
        }

        .education-section-heading {
          display: grid;
          gap: 6px;
        }

        .education-section-heading h2 {
          margin: 0;
          color: #315f48;
          font-size: clamp(1.3rem, 3vw, 1.85rem);
          letter-spacing: -0.035em;
        }

        .education-section-heading p {
          margin: 0;
          color: #60706a;
          line-height: 1.55;
        }

        .education-empty-card,
        .education-entry-card,
        .education-add-card {
          border-radius: 28px;
        }

        .education-empty-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
        }

        .education-entry-list {
          display: grid;
          gap: 16px;
        }

        .education-entry-card {
          display: grid;
          gap: 16px;
        }

        .education-entry-header {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
        }

        .education-entry-header h2 {
          margin: 0 0 6px;
          color: #315f48;
          overflow-wrap: anywhere;
        }

        .education-entry-header p {
          margin: 0;
          color: #60706a;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .education-entry-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .education-entry-details span {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(143, 178, 158, 0.18);
          background: rgba(244, 255, 249, 0.86);
          color: #315f48;
          font-weight: 900;
          line-height: 1.1;
        }

        .education-note-box {
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.74);
        }

        .education-note-box p {
          margin: 0;
          color: #4f625b;
          line-height: 1.5;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .education-edit-details {
          display: grid;
          gap: 14px;
        }

        .education-edit-details summary {
          width: fit-content;
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(83, 111, 99, 0.2);
          background: rgba(255, 255, 255, 0.88);
          color: #536f63;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(33, 56, 48, 0.07);
        }

        .education-entry-form {
          display: grid;
          gap: 16px;
        }

        .education-fieldset {
          min-width: 0;
          margin: 0;
          padding: 0;
          border: 0;
          display: grid;
          gap: 12px;
        }

        .education-fieldset legend {
          padding: 0;
          color: #315f48;
          font-weight: 950;
        }

        .education-choice-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .education-choice-card {
          position: relative;
          min-height: 126px;
          display: grid;
          gap: 10px;
          align-content: start;
          padding: 14px;
          border: 1px solid rgba(108, 92, 160, 0.16);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.76);
          box-shadow: 0 14px 34px rgba(33, 56, 48, 0.08);
          cursor: pointer;
        }

        .education-choice-card input {
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .education-choice-card:has(input:checked) {
          border-color: rgba(83, 111, 99, 0.62);
          background: rgba(244, 255, 249, 0.96);
          box-shadow:
            0 18px 42px rgba(33, 56, 48, 0.1),
            0 0 0 4px rgba(83, 111, 99, 0.1);
        }

        .education-choice-icon {
          width: 50px;
          height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: inset 0 0 0 1px rgba(108, 92, 160, 0.12);
          font-size: 1.35rem;
        }

        .education-choice-copy {
          display: grid;
          gap: 5px;
        }

        .education-choice-title {
          color: #24352f;
          font-weight: 950;
        }

        .education-choice-description {
          color: #5d6677;
          font-size: 0.9rem;
          line-height: 1.35;
        }

        .education-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .education-checkbox-card {
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border: 1px solid rgba(83, 111, 99, 0.18);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
          cursor: pointer;
        }

        .education-checkbox-card input {
          width: 22px;
          height: 22px;
          accent-color: #8fb29e;
        }

        .education-checkbox-card strong {
          display: block;
          color: #315f48;
        }

        .education-checkbox-card small {
          display: block;
          margin-top: 2px;
          color: #60706a;
          font-weight: 750;
        }

        .display-order-field {
          max-width: 220px;
        }

        .education-submit-button {
          width: fit-content;
        }

        .education-delete-form {
          margin-top: 14px;
        }

        .danger-button {
          border-color: rgba(190, 90, 30, 0.28);
          color: #8a4b16;
          background: rgba(255, 248, 240, 0.92);
        }

        @media (max-width: 980px) {
          .education-choice-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .education-topbar {
            gap: 14px;
          }

          .education-topbar-actions {
            width: 100%;
            justify-content: stretch;
          }

          .education-topbar-actions > *,
          .education-topbar-actions a,
          .education-topbar-actions button {
            width: 100%;
          }

          .education-hero {
            padding: 24px 20px;
          }

          .education-hero .dashboard-title {
            font-size: 2.2rem !important;
            line-height: 1.04 !important;
          }

          .education-hero-actions {
            width: 100%;
          }

          .education-hero-actions .primary-button,
          .education-hero-actions .secondary-button {
            width: 100%;
          }

          .education-empty-card,
          .education-entry-header {
            grid-template-columns: 1fr;
          }

          .education-choice-grid,
          .education-form-grid {
            grid-template-columns: 1fr;
          }

          .education-choice-card {
            min-height: 0;
          }

          .education-edit-details summary,
          .education-submit-button,
          .danger-button {
            width: 100%;
          }

          .display-order-field {
            max-width: none;
          }
        }
      `}</style>
    </main>
  );
}
