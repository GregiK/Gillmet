"use client";

import { useEffect, useRef, useState } from "react";

// Minimalne typy dla Web Speech API (brak oficjalnych typow w TypeScript/DOM lib).
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

type VoiceInputProps = {
  onResult: (text: string) => void;
  lang?: string;
  className?: string;
};

export default function VoiceInput({ onResult, lang = "pl-PL", className = "" }: VoiceInputProps) {
  const [wspierane, setWspierane] = useState(true);
  const [sluchanie, setSluchanie] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setWspierane(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let tekst = "";
      for (let i = 0; i < event.results.length; i++) {
        tekst += event.results[i][0].transcript;
      }
      if (tekst.trim()) onResult(tekst.trim());
    };
    recognition.onerror = () => setSluchanie(false);
    recognition.onend = () => setSluchanie(false);
    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const przelacz = () => {
    if (!recognitionRef.current) return;
    if (sluchanie) {
      recognitionRef.current.stop();
      setSluchanie(false);
    } else {
      try {
        recognitionRef.current.start();
        setSluchanie(true);
      } catch {
        setSluchanie(false);
      }
    }
  };

  if (!wspierane) return null;

  return (
    <button
      type="button"
      onClick={przelacz}
      title={sluchanie ? "Zatrzymaj dyktowanie" : "Dyktuj glosowo"}
      className={`inline-flex items-center justify-center rounded-full w-8 h-8 shrink-0 border ${
        sluchanie ? "bg-red-500 border-red-500 text-white animate-pulse" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
      } ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}
