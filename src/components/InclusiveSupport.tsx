"use client";

import { useEffect, useMemo, useState } from "react";

type VoicePreference = "female" | "neutral" | "default";

type InclusiveSupportProps = {
  text: string;
  label?: string;
};

const FEMALE_VOICE_HINTS = [
  "female",
  "woman",
  "samantha",
  "susan",
  "karen",
  "moira",
  "tessa",
  "serena",
  "victoria",
  "zira",
  "hazel",
  "shelley",
  "ava",
  "siri female",
  "google uk english female",
  "microsoft hazel",
  "microsoft susan",
  "microsoft zira"
];

const NEUTRAL_VOICE_HINTS = [
  "english",
  "en-gb",
  "uk",
  "great britain",
  "british",
  "google uk english",
  "microsoft"
];

function normaliseVoiceText(value: string) {
  return value.trim().toLowerCase();
}

function isLikelyFemaleVoice(voice: SpeechSynthesisVoice) {
  const voiceText = normaliseVoiceText(`${voice.name} ${voice.voiceURI} ${voice.lang}`);

  return FEMALE_VOICE_HINTS.some((hint) => voiceText.includes(hint));
}

function isLikelyNeutralEnglishVoice(voice: SpeechSynthesisVoice) {
  const voiceText = normaliseVoiceText(`${voice.name} ${voice.voiceURI} ${voice.lang}`);

  return (
    voice.lang.toLowerCase().startsWith("en") ||
    NEUTRAL_VOICE_HINTS.some((hint) => voiceText.includes(hint))
  );
}

function chooseVoice(
  voices: SpeechSynthesisVoice[],
  preference: VoicePreference
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const englishVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en")
  );

  const usableVoices = englishVoices.length ? englishVoices : voices;

  if (preference === "female") {
    const likelyFemale =
      usableVoices.find((voice) => isLikelyFemaleVoice(voice)) ||
      voices.find((voice) => isLikelyFemaleVoice(voice));

    if (likelyFemale) return likelyFemale;

    const likelyNeutral =
      usableVoices.find((voice) => isLikelyNeutralEnglishVoice(voice)) ||
      voices.find((voice) => isLikelyNeutralEnglishVoice(voice));

    return likelyNeutral || usableVoices[0] || null;
  }

  if (preference === "neutral") {
    const likelyNeutral =
      usableVoices.find((voice) => isLikelyNeutralEnglishVoice(voice)) ||
      voices.find((voice) => isLikelyNeutralEnglishVoice(voice));

    return likelyNeutral || usableVoices[0] || null;
  }

  return null;
}

function getStoredVoicePreference(): VoicePreference {
  if (typeof window === "undefined") return "female";

  const stored = window.localStorage.getItem("so-volunteering-voice-preference");

  if (stored === "female" || stored === "neutral" || stored === "default") {
    return stored;
  }

  return "female";
}

function buildPageReadingText(text: string, label?: string) {
  const cleanText = text.trim();

  if (label) {
    return `${label}. ${cleanText}`;
  }

  return cleanText;
}

export function InclusiveAudioButton({ text, label }: InclusiveSupportProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicePreference, setVoicePreference] =
    useState<VoicePreference>("female");

  const selectedVoiceName = useMemo(() => {
    const selectedVoice = chooseVoice(voices, voicePreference);

    if (voicePreference === "default") {
      return "Your device default voice";
    }

    if (!selectedVoice) {
      return "Your device voice";
    }

    return selectedVoice.name;
  }, [voices, voicePreference]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setVoicePreference(getStoredVoicePreference());

    if (!("speechSynthesis" in window)) return;

    function updateVoices() {
      setVoices(window.speechSynthesis.getVoices());
    }

    updateVoices();

    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  function saveVoicePreference(nextPreference: VoicePreference) {
    setVoicePreference(nextPreference);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "so-volunteering-voice-preference",
        nextPreference
      );
    }
  }

  function stopReading() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  function speakText() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      buildPageReadingText(text, label)
    );

    const selectedVoice = chooseVoice(voices, voicePreference);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || "en-GB";
    } else {
      utterance.lang = "en-GB";
    }

    utterance.rate = 0.88;
    utterance.pitch = voicePreference === "female" ? 1.04 : 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="audio-help-wrap" aria-label="Page listening support">
      <div className="audio-help-actions">
        <button
          type="button"
          className="audio-help-button"
          onClick={isSpeaking ? stopReading : speakText}
          aria-label={isSpeaking ? "Stop reading this page" : "Read this page aloud"}
        >
          {isSpeaking ? "⏹ Stop" : "🔊 Listen"}
        </button>

        <label className="audio-voice-label">
          <span className="audio-voice-text">Voice</span>
          <select
            className="audio-voice-select"
            value={voicePreference}
            onChange={(event) =>
              saveVoicePreference(event.target.value as VoicePreference)
            }
            aria-label="Choose reading voice"
          >
            <option value="female">Female voice</option>
            <option value="neutral">Neutral voice</option>
            <option value="default">Device default</option>
          </select>
        </label>
      </div>

      <p className="audio-voice-note" aria-live="polite">
        Using: {selectedVoiceName}
      </p>
    </div>
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
