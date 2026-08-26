"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { WebAudioRecorder } from "@/features/recorder/web-recorder";

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Focused speak capture — chrome fades away so it's clear you're recording.
 */
export function SpeakFocus({
  onReady,
  onCancel,
}: {
  onReady: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const recorderRef = useRef(new WebAudioRecorder());
  const [phase, setPhase] = useState<"starting" | "recording" | "error">(
    "starting",
  );
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    return () => {
      void recorderRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => {
      setElapsed(recorderRef.current.getElapsedMs());
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  async function begin() {
    setError(null);
    setPhase("starting");
    try {
      await recorderRef.current.start();
      setPhase("recording");
      setElapsed(0);
    } catch {
      setError("Microphone permission needed.");
      setPhase("error");
    }
  }

  async function stop() {
    try {
      const blob = await recorderRef.current.stop();
      onReady(blob);
    } catch {
      setError("Couldn't finish listening.");
      setPhase("error");
    }
  }

  async function cancel() {
    await recorderRef.current.cancel();
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center dream-bg px-6 animate-[fade-in_0.35s_ease-out]">
      <div className="flex flex-col items-center gap-8 animate-[speak-rise_0.45s_cubic-bezier(0.22,1,0.36,1)]">
        <p className="font-display text-2xl text-[var(--text)]">
          {phase === "recording" && "Listening…"}
          {phase === "starting" && "Allow the microphone…"}
          {phase === "error" && "Can't hear yet"}
        </p>

        <div className="relative flex h-36 w-36 items-center justify-center">
          {phase === "recording" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)]/20 [animation-duration:2.2s]" />
          )}
          {(phase === "starting" || phase === "recording") && (
            <>
              <span
                aria-hidden
                className="animate-mic-ring absolute inset-2 rounded-full border border-[var(--accent)]/40"
              />
              <span
                aria-hidden
                className="animate-mic-ring absolute inset-2 rounded-full border border-[var(--accent)]/25 [animation-delay:120ms]"
              />
            </>
          )}
          <div
            className={`relative flex h-32 w-32 items-center justify-center rounded-full ${
              phase === "recording"
                ? "bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/50 animate-glow-breathe"
                : phase === "error"
                  ? "glass"
                  : "mic-orb"
            }`}
          >
            {phase === "recording" ? (
              <div className="flex h-12 items-end gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="recording-bar w-2 rounded-full bg-[var(--accent)]"
                    style={{
                      height: `${18 + ((i * 11) % 24)}px`,
                      animationDelay: `${i * 0.09}s`,
                    }}
                  />
                ))}
              </div>
            ) : phase === "starting" ? (
              <Mic className="h-9 w-9 animate-pulse-soft" />
            ) : (
              <Mic className="h-9 w-9 text-[var(--text-muted)]" />
            )}
          </div>
        </div>

        {phase === "recording" && (
          <p className="tabular-nums text-sm text-[var(--text-muted)]">
            {formatTimer(elapsed)}
          </p>
        )}

        {error && <p className="text-center text-sm text-[var(--danger)]">{error}</p>}

        <div className="flex flex-col items-center gap-4">
          {phase === "recording" && (
            <>
              <button
                type="button"
                onClick={() => void stop()}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger)] text-white shadow-[0_0_32px_rgba(212,132,122,0.35)]"
                aria-label="Stop recording"
              >
                <Square className="h-5 w-5" fill="currentColor" />
              </button>
              <p className="text-sm text-[var(--text-muted)]">
                Tap when you&apos;re done
              </p>
            </>
          )}

          {phase === "error" && (
            <button
              type="button"
              onClick={() => void begin()}
              className="btn-gold min-h-11 rounded-full px-6 text-sm"
            >
              Try again
            </button>
          )}

          <button
            type="button"
            onClick={() => void cancel()}
            className="min-h-11 px-4 text-sm text-[var(--text-muted)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
