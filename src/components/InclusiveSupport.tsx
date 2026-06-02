"use client";

type InclusiveSupportProps = {
  text: string;
};

export function InclusiveAudioButton({ text }: InclusiveSupportProps) {
  function speakText() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.lang = "en-GB";

    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      className="audio-help-button"
      onClick={speakText}
      aria-label="Read this page aloud"
    >
      🔊 Listen
    </button>
  );
}

export function IconLabel({
  icon,
  children
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <span className="icon-label">
      <span aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </span>
  );
}
