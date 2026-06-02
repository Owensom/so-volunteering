import type { ReactNode } from "react";

type ChoiceOption = {
  value: string;
  label: string;
  helpText?: string;
  icon?: string;
};

export function OnboardingProgress({
  step,
  total
}: {
  step: number;
  total: number;
}) {
  const percentage = Math.max(0, Math.min(100, (step / total) * 100));

  return (
    <div className="progress-wrap">
      <div className="progress-meta">
        <span>
          Step {step} of {total}
        </span>
        <span>{Math.round(percentage)}% complete</span>
      </div>
      <div className="progress-track" aria-label={`Step ${step} of ${total}`}>
        <span className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function InclusiveSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="inclusive-section">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ChoiceCards({
  name,
  options
}: {
  name: string;
  options: ChoiceOption[];
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <label key={option.value} className="choice-card">
          <input type="checkbox" name={name} value={option.value} />

          {option.icon ? (
            <span className="choice-card-icon" aria-hidden="true">
              {option.icon}
            </span>
          ) : null}

          <span className="choice-card-copy">
            <span className="choice-card-title">{option.label}</span>
            {option.helpText ? (
              <small className="choice-help">{option.helpText}</small>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}

export function OptionalTextarea({
  name,
  label,
  placeholder
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <label className="field-label">
      {label}
      <textarea name={name} rows={5} placeholder={placeholder} />
    </label>
  );
}
