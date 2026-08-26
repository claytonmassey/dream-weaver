"use client";

import { useEffect, useRef, useState } from "react";
import { Square, Trash2 } from "lucide-react";
import { AudioPlayback } from "@/components/dreams/AudioPlayback";
import { WebAudioRecorder } from "@/features/recorder/web-recorder";

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function DreamRecorder({
  onRecordingReady,
  onClear,
  autoStart = false,
}: {
  onRecordingReady: (blob: Blob) => void;
  onClear: () => void;
  autoStart?: boolean;
}) {
  const recorderRef = useRef(new WebAudioRecorder());
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didAutoStart = useRef(false);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      setElapsed(recorderRef.current.getElapsedMs());
    }, 200);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => {
    if (!autoStart || didAutoStart.current || blob) return;
    didAutoStart.current = true;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function start() {
    setError(null);
    try {
      await recorderRef.current.start();
      setRecording(true);
      setBlob(null);
      setElapsed(0);
    } catch {
      setError("Microphone permission needed.");
    }
  }

  async function stop() {
    try {
      const result = await recorderRef.current.stop();
      setRecording(false);
      setBlob(result);
      onRecordingReady(result);
    } catch {
      setError("Couldn't finish listening.");
      setRecording(false);
    }
  }

  async function clear() {
    await recorderRef.current.cancel();
    setRecording(false);
    setBlob(null);
    setElapsed(0);
    didAutoStart.current = false;
    onClear();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5">
      <div
        className={`flex h-28 w-28 items-center justify-center rounded-full ${
          recording
            ? "bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/40"
            : "bg-[var(--bg-elevated)]"
        }`}
      >
        {recording ? (
          <div className="flex h-10 items-end gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="recording-bar w-1.5 rounded-full bg-[var(--accent)]"
                style={{
                  height: `${14 + ((i * 9) % 20)}px`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <span className="tabular-nums text-lg text-[var(--text-muted)]">
            {formatTimer(elapsed)}
          </span>
        )}
      </div>

      {recording && (
        <p className="tabular-nums text-sm text-[var(--text-muted)]">
          {formatTimer(elapsed)}
        </p>
      )}

      {blob && !recording && (
        <div className="flex items-center gap-3">
          <AudioPlayback blob={blob} />
          <button
            type="button"
            onClick={() => void clear()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)]"
            aria-label="Re-record"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {recording && (
        <button
          type="button"
          onClick={() => void stop()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger)] text-white"
          aria-label="Stop"
        >
          <Square className="h-5 w-5" fill="currentColor" />
        </button>
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
