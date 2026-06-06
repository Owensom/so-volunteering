"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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
  "microsoft zira",
];

const NEUTRAL_VOICE_HINTS = [
  "english",
  "en-gb",
  "uk",
  "great britain",
  "british",
  "google uk english",
  "microsoft",
];

function normaliseVoiceText(value: string) {
  return value.trim().toLowerCase();
}

function isLikelyFemaleVoice(voice: SpeechSynthesisVoice) {
  const voiceText = normaliseVoiceText(
    `${voice.name} ${voice.voiceURI} ${voice.lang}`,
  );

  return FEMALE_VOICE_HINTS.some((hint) => voiceText.includes(hint));
}

function isLikelyNeutralEnglishVoice(voice: SpeechSynthesisVoice) {
  const voiceText = normaliseVoiceText(
    `${voice.name} ${voice.voiceURI} ${voice.lang}`,
  );

  return (
    voice.lang.toLowerCase().startsWith("en") ||
    NEUTRAL_VOICE_HINTS.some((hint) => voiceText.includes(hint))
  );
}

function chooseVoice(
  voices: SpeechSynthesisVoice[],
  preference: VoicePreference,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const englishVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en"),
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

  try {
    const stored = window.localStorage.getItem(
      "so-volunteering-voice-preference",
    );

    if (stored === "female" || stored === "neutral" || stored === "default") {
      return stored;
    }
  } catch {
    return "female";
  }

  return "female";
}

function saveStoredVoicePreference(nextPreference: VoicePreference) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      "so-volunteering-voice-preference",
      nextPreference,
    );
  } catch {
    // Local storage can be blocked in some browser/privacy modes.
  }
}

function buildPageReadingText(text: string, label?: string) {
  const cleanText = text.trim();

  if (!cleanText && !label) return "";

  if (label) {
    return `${label}. ${cleanText}`.trim();
  }

  return cleanText;
}

function getVoiceSignature(voices: SpeechSynthesisVoice[]) {
  return voices
    .map((voice) => `${voice.name}|${voice.lang}|${voice.voiceURI}`)
    .join("::");
}

export function InclusiveAudioButton({ text, label }: InclusiveSupportProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicePreference, setVoicePreference] =
    useState<VoicePreference>("female");

  const mountedRef = useRef(false);
  const voiceSignatureRef = useRef("");
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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
    mountedRef.current = true;

    const storedPreference = getStoredVoicePreference();
    setVoicePreference((currentPreference) =>
      currentPreference === storedPreference ? currentPreference : storedPreference,
    );

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return () => {
        mountedRef.current = false;
      };
    }

    const speechSynthesis = window.speechSynthesis;

    function updateVoices() {
      if (!mountedRef.current) return;

      const nextVoices = speechSynthesis.getVoices();
      const nextSignature = getVoiceSignature(nextVoices);

      if (voiceSignatureRef.current === nextSignature) {
        return;
      }

      voiceSignatureRef.current = nextSignature;
      setVoices(nextVoices);
    }

    updateVoices();

    if (typeof speechSynthesis.addEventListener === "function") {
      speechSynthesis.addEventListener("voiceschanged", updateVoices);
    } else {
      speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      mountedRef.current = false;

      currentUtteranceRef.current = null;

      try {
        speechSynthesis.cancel();
      } catch {
        // Some browsers can throw if speech synthesis is not ready.
      }

      if (typeof speechSynthesis.removeEventListener === "function") {
        speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      } else if (speechSynthesis.onvoiceschanged === updateVoices) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  function saveVoicePreference(nextPreference: VoicePreference) {
    setVoicePreference((currentPreference) =>
      currentPreference === nextPreference ? currentPreference : nextPreference,
    );

    saveStoredVoicePreference(nextPreference);
  }

  function stopReading() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore browser speech synthesis interruption errors.
    }

    currentUtteranceRef.current = null;

    if (mountedRef.current) {
      setIsSpeaking(false);
    }
  }

  function speakText() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const readingText = buildPageReadingText(text, label);

    if (!readingText) return;

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore browser speech synthesis interruption errors.
    }

    const utterance = new SpeechSynthesisUtterance(readingText);
    const selectedVoice = chooseVoice(voices, voicePreference);

    currentUtteranceRef.current = utterance;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || "en-GB";
    } else {
      utterance.lang = "en-GB";
    }

    utterance.rate = 0.88;
    utterance.pitch = voicePreference === "female" ? 1.04 : 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      if (!mountedRef.current || currentUtteranceRef.current !== utterance) {
        return;
      }

      setIsSpeaking(true);
    };

    utterance.onend = () => {
      if (!mountedRef.current || currentUtteranceRef.current !== utterance) {
        return;
      }

      currentUtteranceRef.current = null;
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      if (!mountedRef.current || currentUtteranceRef.current !== utterance) {
        return;
      }

      currentUtteranceRef.current = null;
      setIsSpeaking(false);
    };

    setIsSpeaking(true);

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      currentUtteranceRef.current = null;

      if (mountedRef.current) {
        setIsSpeaking(false);
      }
    }
  }

  return (
    <div className="audio-help-wrap" aria-label="Page listening support">
      <div className="audio-help-actions">
        <button
          type="button"
          className="audio-help-button"
          onClick={isSpeaking ? stopReading : speakText}
          aria-label={
            isSpeaking ? "Stop reading this page" : "Read this page aloud"
          }
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
  children,
}: {
  icon: string;
  children: ReactNode;
}) {
  return (
    <span className="icon-label">
      <span aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </span>
  );
}
