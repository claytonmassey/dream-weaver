"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Keyboard, Mic, Pencil, RotateCcw, Square } from "lucide-react";
import { WebAudioRecorder } from "@/features/recorder/web-recorder";
import type { ConversationMessage } from "@/types/conversation";

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function DreamConversation({
  transcript,
  preferText = false,
  onReady,
  onBack,
  onStartOver,
}: {
  transcript: string;
  preferText?: boolean;
  onReady: (enrichedTranscript: string) => void;
  onBack: () => void;
  onStartOver: () => void;
}) {
  const [phase, setPhase] = useState<"chat" | "review">("chat");
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [enriched, setEnriched] = useState(transcript);
  const [draft, setDraft] = useState("");
  const [showText, setShowText] = useState(preferText);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const recorderRef = useRef(new WebAudioRecorder());
  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history, loading, recording, transcribing, phase]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void askNext([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showText && phase === "chat") {
      textRef.current?.focus();
    }
  }, [showText, phase]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      setElapsed(recorderRef.current.getElapsedMs());
    }, 200);
    return () => clearInterval(id);
  }, [recording]);

  async function askNext(nextHistory: ConversationMessage[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dreams/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, history: nextHistory }),
      });
      const data = (await res.json()) as {
        message?: string;
        enrichedTranscript?: string;
        readyForDesign?: boolean;
        error?: string;
      };
      if (!res.ok || !data.message) {
        throw new Error(data.error || "Couldn't continue the conversation.");
      }

      setHistory([
        ...nextHistory,
        { role: "assistant", content: data.message },
      ]);
      const nextEnriched = data.enrichedTranscript || transcript;
      setEnriched(nextEnriched);

      if (data.readyForDesign && nextEnriched.trim()) {
        setPhase("review");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? "Couldn't continue just now. Try again."
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(answer: string) {
    const cleaned = answer.trim();
    if (!cleaned || loading || transcribing) return;
    const withUser: ConversationMessage[] = [
      ...history,
      { role: "user", content: cleaned },
    ];
    setHistory(withUser);
    setDraft("");
    await askNext(withUser);
  }

  async function startRecording() {
    setError(null);
    setShowText(false);
    try {
      await recorderRef.current.start();
      setRecording(true);
      setElapsed(0);
    } catch {
      setError("Microphone permission needed.");
    }
  }

  async function stopRecording() {
    try {
      const blob = await recorderRef.current.stop();
      setRecording(false);
      setTranscribing(true);
      const form = new FormData();
      form.append("audio", blob, "reply.webm");
      const res = await fetch("/api/dreams/transcribe", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        cleanedTranscript?: string;
        error?: string;
      };
      if (!res.ok || !data.cleanedTranscript?.trim()) {
        throw new Error(data.error || "Couldn't hear that.");
      }
      setTranscribing(false);
      await submitAnswer(data.cleanedTranscript);
    } catch (err) {
      setRecording(false);
      setTranscribing(false);
      setError(err instanceof Error ? err.message : "Couldn't add that.");
    }
  }

  const busy = loading || recording || transcribing;
  const canReview = enriched.trim().length > 0;

  if (phase === "review") {
    return (
      <div className="flex min-h-[70vh] flex-col gap-5">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setPhase("chat");
          }}
          className="flex items-center gap-1.5 self-start text-sm text-[var(--text-muted)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="max-w-[92%] rounded-2xl bg-[var(--bg-elevated)] px-4 py-3 text-[15px] leading-relaxed">
          Thanks, I&apos;ve captured your dream. Here&apos;s your transcript so
          far ✨
        </div>

        <div className="rounded-2xl border border-[var(--accent)]/35 bg-[var(--bg-elevated)]/80 p-4">
          <p className="mb-2 text-xs font-medium tracking-wide text-[var(--accent)] uppercase">
            Your Dream
          </p>
          {editing ? (
            <textarea
              value={enriched}
              onChange={(e) => setEnriched(e.target.value)}
              rows={8}
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none"
              aria-label="Edit dream transcript"
            />
          ) : (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text)]">
              {enriched}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <div className="mt-auto flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent text-sm font-medium"
          >
            <Pencil className="h-4 w-4" />
            {editing ? "Done editing" : "Edit transcript"}
          </button>
          <button
            type="button"
            disabled={!enriched.trim()}
            onClick={() => onReady(enriched.trim())}
            className="min-h-12 w-full rounded-full bg-[var(--accent)] text-sm font-medium text-[#1a1612] disabled:opacity-40"
          >
            Generate Image ✨
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="flex items-center justify-center gap-2 py-2 text-sm text-[var(--text-muted)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-sm text-[var(--text-muted)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex-1 space-y-3 overflow-y-auto pb-2">
        {history.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "assistant"
                ? "max-w-[92%] rounded-2xl bg-[var(--bg-elevated)] px-4 py-3 text-[15px] leading-relaxed"
                : "ml-auto max-w-[92%] rounded-2xl bg-[#5b4a78]/55 px-4 py-3 text-[15px] leading-relaxed"
            }
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-[var(--text-muted)]">Thinking…</p>
        )}
        {transcribing && (
          <p className="text-sm text-[var(--text-muted)]">Writing that down…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex flex-col items-center gap-4 pt-1">
        {showText ? (
          <div className="w-full space-y-2">
            <textarea
              ref={textRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Type what you remember…"
              disabled={busy}
              className="w-full resize-none rounded-2xl bg-[var(--bg-elevated)] px-4 py-3 text-base outline-none placeholder:text-[var(--text-muted)] disabled:opacity-60"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submitAnswer(draft);
                }
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy || !draft.trim()}
                onClick={() => void submitAnswer(draft)}
                className="min-h-11 flex-1 rounded-full bg-[var(--accent)] text-sm font-medium text-[#1a1612] disabled:opacity-40"
              >
                Send
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowText(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--accent)] disabled:opacity-40"
                aria-label="Switch to speak"
              >
                <Mic className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {recording ? (
              <>
                <p className="tabular-nums text-sm text-[var(--text-muted)]">
                  {formatTimer(elapsed)}
                </p>
                <button
                  type="button"
                  onClick={() => void stopRecording()}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--danger)] text-white shadow-[0_0_40px_rgba(212,132,122,0.35)]"
                  aria-label="Stop recording"
                >
                  <Square className="h-6 w-6" fill="currentColor" />
                </button>
                <p className="text-sm text-[var(--text-muted)]">Tap to finish</p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void startRecording()}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1612] shadow-[0_0_48px_rgba(196,168,130,0.45)] disabled:opacity-40"
                  aria-label="Tap to speak"
                >
                  <Mic className="h-7 w-7" />
                </button>
                <p className="text-sm text-[var(--text-muted)]">Tap to speak</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowText(true)}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] disabled:opacity-40"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  Or type instead
                </button>
              </>
            )}
          </>
        )}

        {canReview && !busy && history.some((m) => m.role === "user") && (
          <button
            type="button"
            onClick={() => setPhase("review")}
            className="pt-1 text-sm text-[var(--accent)]"
          >
            Generate image →
          </button>
        )}
      </div>
    </div>
  );
}
