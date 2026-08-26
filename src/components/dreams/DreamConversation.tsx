"use client";

import { useEffect, useRef, useState } from "react";
import type { ConversationMessage } from "@/types/conversation";

export function DreamConversation({
  transcript,
  onReady,
  onBack,
}: {
  transcript: string;
  onReady: (enrichedTranscript: string) => void;
  onBack: () => void;
}) {
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [enriched, setEnriched] = useState(transcript);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history, loading]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void askNext([]);
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
        readyForDesign?: boolean;
        enrichedTranscript?: string;
        error?: string;
      };
      if (!res.ok || !data.message) {
        throw new Error(data.error || "Couldn't continue the conversation.");
      }

      const withAssistant: ConversationMessage[] = [
        ...nextHistory,
        { role: "assistant", content: data.message },
      ];
      setHistory(withAssistant);
      const nextEnriched = data.enrichedTranscript || transcript;
      setEnriched(nextEnriched);

      if (data.readyForDesign) {
        setReady(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function sendAnswer() {
    const answer = draft.trim();
    if (!answer || loading) return;
    const withUser: ConversationMessage[] = [
      ...history,
      { role: "user", content: answer },
    ];
    setHistory(withUser);
    setDraft("");
    await askNext(withUser);
  }

  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {history.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "assistant"
                ? "max-w-[92%] rounded-2xl bg-[var(--bg-elevated)] px-4 py-3 text-[15px] leading-relaxed"
                : "ml-auto max-w-[92%] rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-[15px] leading-relaxed text-[var(--text)]"
            }
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-[var(--text-muted)]">Thinking…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {ready ? (
        <button
          type="button"
          onClick={() => onReady(enriched)}
          className="min-h-11 w-full rounded-full bg-[var(--accent)] text-sm font-medium text-[#1a1612]"
        >
          Choose a style
        </button>
      ) : (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Answer…"
            disabled={loading}
            className="w-full resize-none rounded-xl bg-[var(--bg-elevated)] px-4 py-3 text-base outline-none placeholder:text-[var(--text-muted)] disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendAnswer();
              }
            }}
          />
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={loading || !draft.trim()}
              onClick={() => void sendAnswer()}
              className="min-h-11 flex-1 rounded-full bg-[var(--accent)] text-sm font-medium text-[#1a1612] disabled:opacity-50"
            >
              Send
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onReady(enriched)}
              className="text-sm text-[var(--text-muted)]"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-[var(--text-muted)]"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
