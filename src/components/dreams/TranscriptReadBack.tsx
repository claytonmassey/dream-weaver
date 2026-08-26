"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Volume2 } from "lucide-react";

/**
 * Reads the transcript aloud (browser speech synthesis).
 */
export function TranscriptReadBack({
  text,
  autoPlay = false,
}: {
  text: string;
  autoPlay?: boolean;
}) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoPlayed = useRef(false);

  function stop() {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function speak() {
    if (typeof window === "undefined" || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (!autoPlay || autoPlayed.current || !text.trim()) return;
    autoPlayed.current = true;
    // Small delay so the review UI is painted first
    const id = window.setTimeout(() => speak(), 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, text]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!text.trim()) return null;

  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : speak())}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] text-sm text-[var(--text)]"
      aria-label={speaking ? "Stop read back" : "Read back"}
    >
      {speaking ? (
        <>
          <Pause className="h-4 w-4" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" />
          Listen
        </>
      )}
    </button>
  );
}
