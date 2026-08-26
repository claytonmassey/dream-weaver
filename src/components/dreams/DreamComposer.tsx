"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Keyboard, Mic } from "lucide-react";
import { DreamConversation } from "@/components/dreams/DreamConversation";
import { DreamProcessing } from "@/components/dreams/DreamProcessing";
import { DreamRecorder } from "@/components/dreams/DreamRecorder";
import { PersonReferencePrompt } from "@/components/dreams/PersonReferencePrompt";
import { StylePicker } from "@/components/dreams/StylePicker";
import { TranscriptEditor } from "@/components/dreams/TranscriptEditor";
import { TranscriptReadBack } from "@/components/dreams/TranscriptReadBack";
import { toDateInputValue } from "@/lib/utils/cn";
import type { Dream, DreamAnalysis, DreamPerson, DreamVisualStyle } from "@/types/dream";

type Step =
  | "choose"
  | "listen"
  | "type"
  | "transcribing"
  | "review"
  | "converse"
  | "design"
  | "analyzing"
  | "person-reference"
  | "saving"
  | "generating"
  | "error";

export function DreamComposer() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [dreamDate] = useState(toDateInputValue());
  const [transcript, setTranscript] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [fromVoice, setFromVoice] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<DreamVisualStyle | null>(
    null,
  );
  const [pendingPhotos, setPendingPhotos] = useState<Record<string, File>>({});
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [pendingPeople, setPendingPeople] = useState<DreamPerson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedDreamId, setSavedDreamId] = useState<string | null>(null);

  async function handleRecordingReady(blob: Blob) {
    setStep("transcribing");
    setError(null);
    setFromVoice(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "dream.webm");
      const res = await fetch("/api/dreams/transcribe", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        transcript?: string;
        cleanedTranscript?: string;
        error?: string;
      };
      if (!res.ok || !data.cleanedTranscript) {
        throw new Error(data.error || "Transcription failed");
      }
      setRawTranscript(data.transcript || data.cleanedTranscript);
      setTranscript(data.cleanedTranscript);
      setStep("review");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't hear that clearly.";
      setError(message);
      setStep("listen");
    }
  }

  function submitTypedDream() {
    const value = transcript.trim();
    if (!value) {
      setError("Write a little about your dream first.");
      return;
    }
    setError(null);
    setFromVoice(false);
    setRawTranscript(value);
    setTranscript(value);
    setStep("converse");
  }

  function confirmReview() {
    const value = transcript.trim();
    if (!value) {
      setError("Add a bit more before continuing.");
      return;
    }
    setError(null);
    setTranscript(value);
    setStep("converse");
  }

  async function beginPainting() {
    if (!selectedStyle) return;
    setStep("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/dreams/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = (await res.json()) as {
        analysis: DreamAnalysis;
      };
      setAnalysis(data.analysis);

      const realPeople = data.analysis.people.filter((p) => p.isRealPerson);
      if (realPeople.length > 0) {
        setPendingPeople(
          realPeople.map((p, i) => ({
            id: `temp_${i}`,
            dreamId: "",
            name: p.name,
            description: p.description ?? null,
            relationship: p.relationship ?? null,
            isRealPerson: true,
            referenceImageUrl: null,
          })),
        );
        setStep("person-reference");
      } else {
        await saveAndGenerate(data.analysis, {});
      }
    } catch {
      setError("Something went wrong. Try again.");
      setStep("design");
    }
  }

  async function saveAndGenerate(
    dreamAnalysis: DreamAnalysis,
    photos: Record<string, File>,
  ) {
    const style = selectedStyle ?? "cinematic";
    setPendingPhotos(photos);
    setStep("saving");
    setError(null);
    try {
      const createRes = await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamDate,
          rawTranscript: rawTranscript || transcript,
          cleanedTranscript: transcript,
          analysis: dreamAnalysis,
          retainAudio: false,
          visualStyle: style,
          referencePhotos: [],
        }),
      });
      if (!createRes.ok) throw new Error("Save failed");
      const { dream } = (await createRes.json()) as { dream: Dream };
      setSavedDreamId(dream.id);

      for (const [tempId, file] of Object.entries(photos)) {
        const tempPerson = pendingPeople.find((p) => p.id === tempId);
        if (!tempPerson) continue;
        const person = dream.people.find(
          (p) => p.name.toLowerCase() === tempPerson.name.toLowerCase(),
        );
        if (!person) continue;
        const form = new FormData();
        form.append("personId", person.id);
        form.append("photo", file);
        await fetch(`/api/dreams/${dream.id}/reference-photo`, {
          method: "POST",
          body: form,
        });
      }

      setStep("generating");
      const imageRes = await fetch("/api/dreams/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dreamId: dream.id, style }),
      });

      if (!imageRes.ok) {
        router.push(`/dream/${dream.id}?imageFailed=1`);
        return;
      }

      router.push(`/dream/${dream.id}`);
    } catch {
      setError(
        savedDreamId
          ? "Painting failed, but your dream was saved."
          : "Couldn't save your dream.",
      );
      setStep("error");
    }
  }

  if (
    step === "transcribing" ||
    step === "analyzing" ||
    step === "saving" ||
    step === "generating"
  ) {
    const labels: Partial<Record<Step, string>> = {
      transcribing: "Writing it down...",
      analyzing: "Gathering the details...",
      saving: "Preparing the canvas...",
      generating: "Painting your dream...",
    };
    return <DreamProcessing label={labels[step]} />;
  }

  if (step === "person-reference" && analysis) {
    return (
      <PersonReferencePrompt
        people={pendingPeople}
        onContinue={(photos) => void saveAndGenerate(analysis, photos)}
        onSkip={() => void saveAndGenerate(analysis, pendingPhotos)}
      />
    );
  }

  if (step === "design") {
    return (
      <StylePicker
        selected={selectedStyle}
        onSelect={setSelectedStyle}
        onContinue={() => void beginPainting()}
        onBack={() => setStep("converse")}
      />
    );
  }

  if (step === "converse") {
    return (
      <DreamConversation
        transcript={transcript}
        onReady={(enriched) => {
          setTranscript(enriched);
          setStep("design");
        }}
        onBack={() => setStep(fromVoice ? "review" : "type")}
      />
    );
  }

  if (step === "review") {
    return (
      <div className="flex flex-col gap-5">
        <TranscriptEditor value={transcript} onChange={setTranscript} />
        {fromVoice && <TranscriptReadBack text={transcript} autoPlay />}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={confirmReview}
            className="min-h-11 flex-1 rounded-full bg-[var(--accent)] text-sm font-medium text-[#1a1612]"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setFromVoice(false);
              setStep("choose");
            }}
            className="text-sm text-[var(--text-muted)]"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
        <div className="flex gap-3">
          {savedDreamId && (
            <button
              type="button"
              onClick={() => router.push(`/dream/${savedDreamId}`)}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#1a1612]"
            >
              View dream
            </button>
          )}
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="px-3 py-2.5 text-sm text-[var(--text-muted)]"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  if (step === "listen") {
    return (
      <div className="flex flex-col items-center gap-8 pt-8">
        <DreamRecorder
          onRecordingReady={(blob) => void handleRecordingReady(blob)}
          onClear={() => setError(null)}
          autoStart
        />
        {error && (
          <p className="text-center text-sm text-[var(--danger)]">{error}</p>
        )}
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep("choose");
          }}
          className="text-sm text-[var(--text-muted)]"
        >
          Back
        </button>
      </div>
    );
  }

  if (step === "type") {
    return (
      <div className="flex flex-col gap-4">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={10}
          autoFocus
          placeholder="What did you dream about?"
          className="w-full flex-1 resize-none bg-transparent text-lg leading-relaxed outline-none placeholder:text-[var(--text-muted)]"
          aria-label="Type your dream"
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={submitTypedDream}
            className="min-h-11 flex-1 rounded-full bg-[var(--accent)] text-sm font-medium text-[#1a1612]"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              setTranscript("");
              setError(null);
              setStep("choose");
            }}
            className="text-sm text-[var(--text-muted)]"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-2">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setTranscript("");
          setFromVoice(false);
          setSelectedStyle(null);
          setStep("listen");
        }}
        className="flex min-h-16 items-center gap-4 rounded-2xl bg-[var(--bg-elevated)] px-5 py-4 text-left active:bg-[var(--bg-soft)]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1612]">
          <Mic className="h-5 w-5" />
        </span>
        <span className="font-display text-xl">Speak</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setTranscript("");
          setFromVoice(false);
          setSelectedStyle(null);
          setStep("type");
        }}
        className="flex min-h-16 items-center gap-4 rounded-2xl bg-[var(--bg-elevated)] px-5 py-4 text-left active:bg-[var(--bg-soft)]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[var(--text)]">
          <Keyboard className="h-5 w-5" />
        </span>
        <span className="font-display text-xl">Type</span>
      </button>
    </div>
  );
}
