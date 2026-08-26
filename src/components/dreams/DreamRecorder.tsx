"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
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
}: {
  onRecordingReady: (blob: Blob) => void;
  onClear: () => void;
}) {
  const recorderRef = useRef(new WebAudioRecorder());
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      setElapsed(recorderRef.current.getElapsedMs());
    }, 200);
    return () => clearInterval(id);
  }, [recording]);

  async function start() {
    setError(null);
    try {
      await recorderRef.current.start();
      setRecording(true);
      setBlob(null);
      setElapsed(0);
    } catch {
      setError("Microphone access is needed to record your dream.");
    }
  }

  async function stop() {
    try {
      const result = await recorderRef.current.stop();
      setRecording(false);
      setBlob(result);
      onRecordingReady(result);
    } catch {
      setError("Could not finish recording.");
      setRecording(false);
    }
  }

  async function clear() {
    await recorderRef.current.cancel();
    setRecording(false);
    setBlob(null);
    setElapsed(0);
    onClear();
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/5 bg-[var(--bg-elevated)] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Voice recording</p>
          <p className="text-xs text-[var(--text-muted)]">
            Describe your dream out loud
          </p>
        </div>
        <span className="font-mono text-sm text-[var(--accent)]">
          {formatTimer(elapsed)}
        </span>
      </div>

      {recording && (
        <div className="flex h-12 items-end justify-center gap-1">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="recording-bar w-1.5 rounded-full bg-[var(--accent)]"
              style={{
                height: `${20 + ((i * 17) % 40)}px`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!recording && !blob && (
          <button
            type="button"
            onClick={() => void start()}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#1a1612]"
          >
            <Mic className="h-4 w-4" />
            Start recording
          </button>
        )}
        {recording && (
          <button
            type="button"
            onClick={() => void stop()}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--danger)] px-5 py-2.5 text-sm font-medium text-white"
          >
            <Square className="h-4 w-4" />
            Stop
          </button>
        )}
        {blob && (
          <button
            type="button"
            onClick={() => void clear()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-[var(--text-muted)]"
          >
            <Trash2 className="h-4 w-4" />
            Delete / re-record
          </button>
        )}
      </div>

      {blob && <AudioPlayback blob={blob} />}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
