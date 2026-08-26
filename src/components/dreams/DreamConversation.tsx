"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ImagePlus,
  Mic,
  Pencil,
  RotateCcw,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { WebAudioRecorder } from "@/features/recorder/web-recorder";
import { DREAM_VISUAL_STYLES } from "@/types/conversation";
import type { ConversationMessage } from "@/types/conversation";
import type { DreamVisualStyle } from "@/types/dream";
import type { DreamChatReference } from "@/types/reference";
import { cn } from "@/lib/utils/cn";

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function createId() {
  return `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function DreamConversation({
  transcript,
  preferText = false,
  seedUserMessage = null,
  onReady,
  onBack,
  onStartOver,
}: {
  transcript: string;
  preferText?: boolean;
  /** First spoken/typed dream fragment — starts chat with this as the user turn */
  seedUserMessage?: string | null;
  onReady: (
    enrichedTranscript: string,
    references: DreamChatReference[],
    style: DreamVisualStyle,
  ) => void;
  onBack: () => void;
  onStartOver: () => void;
}) {
  const [phase, setPhase] = useState<"chat" | "review">("chat");
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [enriched, setEnriched] = useState(transcript);
  const [draft, setDraft] = useState("");
  const [showText, setShowText] = useState(preferText);
  const [editing, setEditing] = useState(false);
  const [selectedStyle, setSelectedStyle] =
    useState<DreamVisualStyle>("cinematic");
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [references, setReferences] = useState<DreamChatReference[]>([]);
  const started = useRef(false);
  const recorderRef = useRef(new WebAudioRecorder());
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history, loading, recording, transcribing, identifying, phase, references]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const seed = seedUserMessage?.trim();
    if (seed) {
      const withUser: ConversationMessage[] = [
        { role: "user", content: seed },
      ];
      setHistory(withUser);
      setEnriched(seed);
      void askNext(withUser);
    } else {
      void askNext([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (preferText) setShowText(true);
  }, [preferText]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      setElapsed(recorderRef.current.getElapsedMs());
    }, 200);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => {
    return () => {
      for (const ref of references) {
        URL.revokeObjectURL(ref.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } catch {
      setError("Couldn't continue just now. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(answer: string) {
    const cleaned = answer.trim();
    if (!cleaned || loading || transcribing || identifying) return;
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
    } catch {
      setRecording(false);
      setTranscribing(false);
      setError("Couldn't add that.");
    }
  }

  async function handlePhotoSelected(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image.");
      return;
    }
    setIdentifying(true);
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    try {
      const form = new FormData();
      form.append("photo", file, file.name || "reference.jpg");
      form.append("transcript", enriched || transcript);
      form.append("history", JSON.stringify(history));
      const res = await fetch("/api/dreams/identify-reference", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        isPerson?: boolean;
        personName?: string | null;
        relationship?: string | null;
        note?: string;
        error?: string;
      };
      if (!res.ok || !data.note) {
        throw new Error(data.error || "Couldn't read that photo.");
      }

      const ref: DreamChatReference = {
        id: createId(),
        file,
        previewUrl,
        isPerson: Boolean(data.isPerson),
        personName: data.personName ?? null,
        relationship: data.relationship ?? null,
        note: data.note,
      };
      setReferences((prev) => [...prev, ref]);
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.note!,
        },
      ]);
    } catch {
      URL.revokeObjectURL(previewUrl);
      setError("Couldn't use that photo. Try another.");
    } finally {
      setIdentifying(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeReference(id: string) {
    setReferences((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((r) => r.id !== id);
    });
  }

  const busy = loading || recording || transcribing || identifying;
  const canGenerate =
    enriched.trim().length > 0 && history.some((m) => m.role === "user");

  const referenceStrip =
    references.length > 0 ? (
      <div className="flex flex-wrap gap-2 px-1">
        {references.map((ref) => (
          <div key={ref.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ref.previewUrl}
              alt={ref.personName || "Reference"}
              className="h-14 w-14 rounded-xl object-cover ring-1 ring-[var(--accent)]/30"
            />
            {ref.personName && (
              <span className="absolute inset-x-0 bottom-0 truncate rounded-b-xl bg-black/65 px-1 py-0.5 text-center text-[10px] text-white">
                {ref.personName}
              </span>
            )}
            <button
              type="button"
              onClick={() => removeReference(ref.id)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full glass text-[var(--text-muted)] ring-1 ring-white/10"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    ) : null;

  if (phase === "review") {
    return (
      <div className="flex h-[calc(100dvh-11.5rem)] flex-col gap-4 lg:h-[calc(100dvh-5rem)]">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setPhase("chat");
          }}
          className="flex shrink-0 items-center gap-1.5 self-start text-sm text-[var(--accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-2 [-webkit-overflow-scrolling:touch]">
          <div className="flex items-end gap-2.5">
            <BrandAvatar />
            <div className="max-w-[85%] rounded-2xl glass px-4 py-3 text-[15px] leading-relaxed text-[var(--text)]">
              Thanks, I&apos;ve captured your dream. Pick a style, then I&apos;ll
              paint it ✨
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--accent)]/40 glass p-4">
            <p className="mb-2 text-xs font-medium tracking-[0.18em] text-[var(--accent)] uppercase">
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

          <div className="rounded-2xl border border-white/10 glass p-4">
            <p className="mb-3 text-xs font-medium tracking-[0.18em] text-[var(--accent)] uppercase">
              Select a Style
            </p>
            <div className="flex flex-col gap-2">
              {DREAM_VISUAL_STYLES.map((style) => {
                const active = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "flex min-h-14 flex-col items-start justify-center rounded-2xl px-4 py-3 text-left transition",
                      active
                        ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/60"
                        : "border border-white/10 bg-black/20 active:bg-white/5",
                    )}
                  >
                    <span className="text-sm font-medium text-[var(--text)]">
                      {style.label}
                    </span>
                    <span className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {style.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {referenceStrip}
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 glass text-sm font-medium"
          >
            <Pencil className="h-4 w-4" />
            {editing ? "Done editing" : "Edit transcript"}
          </button>
          <button
            type="button"
            disabled={!enriched.trim() || identifying || !selectedStyle}
            onClick={() =>
              onReady(enriched.trim(), references, selectedStyle)
            }
            className="btn-gold flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            Generate Dream Image
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
    <div className="flex h-[calc(100dvh-11.5rem)] flex-col gap-3 lg:h-[calc(100dvh-5rem)]">
      <button
        type="button"
        onClick={onBack}
        className="flex shrink-0 items-center gap-1.5 self-start text-sm text-[var(--accent)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-3 [-webkit-overflow-scrolling:touch]">
        {history.map((message, index) =>
          message.role === "assistant" ? (
            <div key={`a-${index}`} className="flex items-end gap-2.5">
              <BrandAvatar />
              <div className="max-w-[82%] rounded-2xl rounded-bl-md glass px-4 py-3 text-[15px] leading-relaxed text-[var(--text)]">
                {message.content}
              </div>
            </div>
          ) : (
            <div
              key={`u-${index}`}
              className="ml-auto max-w-[82%] rounded-2xl rounded-br-md px-4 py-3 text-[15px] leading-relaxed"
              style={{ background: "var(--bubble-user)" }}
            >
              {message.content}
            </div>
          ),
        )}
        {loading && (
          <p className="pl-11 text-sm text-[var(--text-muted)]">Thinking…</p>
        )}
        {transcribing && (
          <p className="pl-11 text-sm text-[var(--text-muted)]">
            Writing that down…
          </p>
        )}
        {identifying && (
          <p className="pl-11 text-sm text-[var(--text-muted)]">
            Looking at your photo…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex shrink-0 flex-col items-center gap-3 border-t border-white/5 pt-3">
        {referenceStrip}
        {error && <p className="w-full text-sm text-[var(--danger)]">{error}</p>}

        {recording ? (
          <>
            <p className="tabular-nums text-sm text-[var(--accent)]">
              {formatTimer(elapsed)}
            </p>
            <button
              type="button"
              onClick={() => void stopRecording()}
              className="flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full bg-[var(--danger)] text-white shadow-[0_0_40px_rgba(212,132,122,0.4)]"
              aria-label="Stop recording"
            >
              <Square className="h-6 w-6" fill="currentColor" />
            </button>
            <p className="text-sm text-[var(--text-muted)]">
              Tap when you&apos;re done
            </p>
          </>
        ) : (
          <>
            <div className="mic-orb-wrap h-[5.5rem] w-[5.5rem]">
              <span aria-hidden className="mic-orb-halo" />
              <span aria-hidden className="mic-orb-ring mic-orb-ring--outer" />
              <span aria-hidden className="mic-orb-ring" />
              <button
                type="button"
                disabled={busy}
                onClick={() => void startRecording()}
                className="mic-orb h-[4.75rem] w-[4.75rem]"
                aria-label="Tap to speak"
              >
                <Mic className="h-7 w-7" strokeWidth={1.75} />
              </button>
            </div>
            <p className="text-sm font-medium tracking-wide text-[#f0e2c8]">
              Tap to speak
            </p>
          </>
        )}

        <div className="glass flex w-full items-center gap-2 rounded-full border border-white/10 px-2 py-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handlePhotoSelected(file);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-xs text-[var(--text-muted)] disabled:opacity-40"
          >
            <ImagePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add photo</span>
          </button>
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setShowText(true);
            }}
            placeholder="Share more details…"
            disabled={busy || recording}
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submitAnswer(draft);
              }
            }}
          />
          <button
            type="button"
            disabled={busy || recording || !draft.trim()}
            onClick={() => void submitAnswer(draft)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bubble-user)] text-[var(--text)] disabled:opacity-35"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        {canGenerate && !busy && (
          <button
            type="button"
            onClick={() => setPhase("review")}
            className="btn-gold flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm"
          >
            <Sparkles className="h-4 w-4" />
            Generate Dream Image
          </button>
        )}
      </div>
    </div>
  );
}

function BrandAvatar() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/icon.png"
      alt=""
      className="mb-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-[var(--accent)]/35"
    />
  );
}
