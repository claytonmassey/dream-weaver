"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

type ChatLine = {
  role: "assistant" | "user";
  content: string;
};

/**
 * Soft morning Realtime voice conversation over WebRTC.
 */
export function RealtimeDreamVoice({
  transcript,
  onTranscriptUpdate,
  onReady,
  onEdit,
  onBack,
}: {
  transcript: string;
  onTranscriptUpdate: (enriched: string) => void;
  onReady: () => void;
  onEdit: () => void;
  onBack: () => void;
}) {
  const [status, setStatus] = useState<"connecting" | "live" | "error">(
    "connecting",
  );
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [listening, setListening] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const assistantBuffer = useRef("");
  const userExtras = useRef<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines, status]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void connect();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function rebuildEnriched() {
    const extras = userExtras.current.filter(Boolean);
    const enriched =
      extras.length > 0
        ? `${transcript}\n\nMore from our morning chat:\n${extras.join("\n")}`
        : transcript;
    onTranscriptUpdate(enriched);
  }

  function cleanup() {
    try {
      dcRef.current?.close();
    } catch {
      // ignore
    }
    try {
      pcRef.current?.close();
    } catch {
      // ignore
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    dcRef.current = null;
    pcRef.current = null;
    streamRef.current = null;
  }

  function handleRealtimeEvent(raw: string) {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = String(event.type ?? "");

    if (type === "input_audio_buffer.speech_started") {
      setListening(true);
    }
    if (type === "input_audio_buffer.speech_stopped") {
      setListening(false);
    }

    // Assistant audio transcript streaming
    if (type === "response.output_audio_transcript.delta") {
      const delta = String(event.delta ?? "");
      assistantBuffer.current += delta;
    }
    if (
      type === "response.output_audio_transcript.done" ||
      type === "response.audio_transcript.done"
    ) {
      const text =
        String(event.transcript ?? assistantBuffer.current).trim() ||
        assistantBuffer.current.trim();
      assistantBuffer.current = "";
      if (text) {
        setLines((prev) => [...prev, { role: "assistant", content: text }]);
      }
    }

    // User speech transcription
    if (
      type === "conversation.item.input_audio_transcription.completed"
    ) {
      const text = String(event.transcript ?? "").trim();
      if (text) {
        userExtras.current.push(text);
        setLines((prev) => [...prev, { role: "user", content: text }]);
        rebuildEnriched();
      }
    }

    if (type === "error") {
      const err = event.error as { message?: string } | undefined;
      setError(err?.message || "Realtime voice error");
    }
  }

  async function connect() {
    setStatus("connecting");
    setError(null);
    try {
      const tokenRes = await fetch("/api/dreams/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const tokenData = (await tokenRes.json()) as {
        clientSecret?: string;
        error?: string;
      };
      if (!tokenRes.ok || !tokenData.clientSecret) {
        throw new Error(tokenData.error || "Couldn't start soft voice.");
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audioEl = audioRef.current;
      if (audioEl) {
        audioEl.autoplay = true;
      }
      pc.ontrack = (e) => {
        if (audioEl) {
          audioEl.srcObject = e.streams[0];
          void audioEl.play().catch(() => {
            // Autoplay may require a gesture; connection still works
          });
        }
      };

      const mic = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = mic;
      mic.getTracks().forEach((track) => pc.addTrack(track, mic));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => handleRealtimeEvent(String(e.data));
      dc.onopen = () => {
        // Nudge a soft greeting if the model hasn't spoken yet
        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "Greet them very softly for the morning, acknowledge their dream in one gentle sentence, then ask one soft follow-up question.",
            },
          }),
        );
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp ?? "",
      });

      if (!sdpRes.ok) {
        const failText = await sdpRes.text();
        throw new Error(failText || "Realtime connection failed.");
      }

      const answer = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
      setStatus("live");
    } catch (err) {
      cleanup();
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't start voice.");
    }
  }

  return (
    <div className="flex min-h-[65vh] flex-col gap-5">
      <audio ref={audioRef} className="hidden" />

      <div className="flex flex-col items-center gap-3 pt-4">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full ${
            status === "live"
              ? listening
                ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/30"
                : "bg-[var(--bg-elevated)]"
              : "bg-[var(--bg-elevated)]"
          }`}
        >
          <Mic
            className={`h-7 w-7 ${
              listening ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
            }`}
          />
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          {status === "connecting" && "Waking a soft morning voice…"}
          {status === "live" &&
            (listening ? "Listening…" : "Speak whenever you're ready")}
          {status === "error" && "Voice unavailable"}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {lines.map((line, index) => (
          <div
            key={`${line.role}-${index}`}
            className={
              line.role === "assistant"
                ? "max-w-[92%] rounded-2xl bg-[var(--bg-elevated)] px-4 py-3 text-base leading-relaxed"
                : "ml-auto max-w-[92%] rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-base leading-relaxed"
            }
          >
            {line.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {status === "error" && (
        <button
          type="button"
          onClick={() => {
            cleanup();
            void connect();
          }}
          className="min-h-11 rounded-full bg-[var(--bg-elevated)] text-sm"
        >
          Try soft voice again
        </button>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={status === "connecting"}
          onClick={() => {
            rebuildEnriched();
            cleanup();
            onReady();
          }}
          className="min-h-12 w-full rounded-full bg-[var(--accent)] text-sm font-medium text-[#1a1612] disabled:opacity-40"
        >
          Generate image
        </button>
        <button
          type="button"
          onClick={() => {
            rebuildEnriched();
            cleanup();
            onEdit();
          }}
          className="min-h-11 w-full rounded-full bg-white/[0.06] text-sm"
        >
          Keep editing
        </button>
        <button
          type="button"
          onClick={() => {
            cleanup();
            onBack();
          }}
          className="py-2 text-sm text-[var(--text-muted)]"
        >
          Back
        </button>
      </div>
    </div>
  );
}
