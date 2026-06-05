"use client";

type PrintButtonProps = {
  label?: string;
  className?: string;
};

export function PrintButton({
  label = "Print / Save as PDF",
  className = "secondary-button print-button",
}: PrintButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.print()}
    >
      <span className="dashboard-button-inner">
        <span aria-hidden="true">🖨️</span>
        <span>{label}</span>
      </span>
    </button>
  );
}
