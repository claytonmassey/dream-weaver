"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mic, Upload } from "lucide-react";
import { DreamProcessing } from "@/components/dreams/DreamProcessing";
import { DreamRecorder } from "@/components/dreams/DreamRecorder";
import { PersonReferencePrompt } from "@/components/dreams/PersonReferencePrompt";
import { TranscriptEditor } from "@/components/dreams/TranscriptEditor";
import { toDateInputValue } from "@/lib/utils/cn";
import type { Dream, DreamAnalysis, DreamPerson } from "@/types/dream";

type Step =
  | "compose"
  | "transcribing"
  | "edit-transcript"
  | "analyzing"
  | "person-reference"
  | "saving"
  | "generating"
  | "error";

export function DreamComposer({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("compose");
  const [text, setText] = useState("");
  const [dreamDate, setDreamDate] = useState(toDateInputValue());
  const [retainAudio, setRetainAudio] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [pendingPeople, setPendingPeople] = useState<DreamPerson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedDreamId, setSavedDreamId] = useState<string | null>(null);

  async function handleTranscribe(blob: Blob) {
    setStep("transcribing");
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", blob, "dream.webm");
      const res = await fetch("/api/dreams/transcribe", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Transcription failed");
      const data = (await res.json()) as {
        transcript: string;
        cleanedTranscript: string;
      };
      setRawTranscript(data.transcript);
      setTranscript(data.cleanedTranscript);
      setStep("edit-transcript");
    } catch {
      setError("We couldn't transcribe that recording. Please try again.");
      setStep("compose");
    }
  }

  async function submitTextOrContinue() {
    setError(null);
    if (audioBlob && !transcript) {
      await handleTranscribe(audioBlob);
      return;
    }
    if (!text.trim() && !transcript.trim()) {
      setError("Write or record your dream first.");
      return;
    }
    if (text.trim() && !transcript) {
      setRawTranscript(text.trim());
      setTranscript(text.trim());
      setStep("edit-transcript");
      return;
    }
    setStep("edit-transcript");
  }

  async function confirmTranscript() {
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
        cleanedTranscript: string;
        analysis: DreamAnalysis;
      };
      setTranscript(data.cleanedTranscript);
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
      setError("Analysis failed. Please try again.");
      setStep("edit-transcript");
    }
  }

  async function saveAndGenerate(
    dreamAnalysis: DreamAnalysis,
    photos: Record<string, File>,
  ) {
    setStep("saving");
    setError(null);
    try {
      const referencePhotos: Array<{ personName: string; imageUrl: string }> =
        [];

      // Create dream first (without waiting on image)
      const createRes = await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamDate,
          rawTranscript: rawTranscript || transcript,
          cleanedTranscript: transcript,
          analysis: dreamAnalysis,
          retainAudio,
          visualStyle: "cinematic",
          referencePhotos,
        }),
      });
      if (!createRes.ok) throw new Error("Save failed");
      const { dream } = (await createRes.json()) as { dream: Dream };
      setSavedDreamId(dream.id);

      // Upload reference photos against saved person IDs
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
        body: JSON.stringify({ dreamId: dream.id, style: "cinematic" }),
      });

      // Even if image fails, dream is saved
      if (!imageRes.ok) {
        router.push(`/dream/${dream.id}?imageFailed=1`);
        return;
      }

      router.push(`/dream/${dream.id}`);
    } catch {
      setError(
        savedDreamId
          ? "Image generation failed, but your dream was saved."
          : "Something went wrong while saving your dream.",
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
      transcribing: "Listening carefully...",
      analyzing: "Finding the moments that mattered...",
      saving: "Remembering your dream...",
      generating: "Creating your dream...",
    };
    return <DreamProcessing label={labels[step]} />;
  }

  if (step === "person-reference" && analysis) {
    return (
      <PersonReferencePrompt
        people={pendingPeople}
        onContinue={(photos) => void saveAndGenerate(analysis, photos)}
        onSkip={() => void saveAndGenerate(analysis, {})}
      />
    );
  }

  if (step === "edit-transcript") {
    return (
      <div className="animate-fade-up space-y-6">
        <TranscriptEditor value={transcript} onChange={setTranscript} />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void confirmTranscript()}
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[#1a1612]"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => setStep("compose")}
            className="rounded-full border border-white/10 px-6 py-3 text-sm text-[var(--text-muted)]"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="space-y-4 rounded-3xl border border-[var(--danger)]/30 bg-[var(--bg-elevated)] p-8">
        <h2 className="font-display text-2xl">Something went wrong</h2>
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
        <div className="flex gap-3">
          {savedDreamId && (
            <button
              type="button"
              onClick={() => router.push(`/dream/${savedDreamId}`)}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#1a1612]"
            >
              View saved dream
            </button>
          )}
          <button
            type="button"
            onClick={() => setStep("compose")}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-6">
      {!compact && (
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Dreamline
          </p>
          <h1 className="font-display text-4xl md:text-5xl">
            What did you dream about?
          </h1>
          <p className="max-w-xl text-sm text-[var(--text-muted)] md:text-base">
            Type it, speak it, or upload a recording. We&apos;ll help you hold
            onto the moments that mattered.
          </p>
        </div>
      )}

      <div className="space-y-4 rounded-[2rem] border border-white/5 bg-[var(--bg-elevated)] p-5 md:p-7">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={compact ? 5 : 7}
          placeholder="I was walking through my childhood neighborhood late at night…"
          className="w-full resize-y bg-transparent text-base leading-relaxed outline-none placeholder:text-[var(--text-muted)]/70 md:text-lg"
        />

        <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() => setShowRecorder((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <Mic className="h-4 w-4" />
            Record
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            <Upload className="h-4 w-4" />
            Upload audio
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAudioBlob(file);
                  setShowRecorder(true);
                }
              }}
            />
          </label>

          <label className="ml-auto flex items-center gap-2 text-xs text-[var(--text-muted)]">
            Dream date
            <input
              type="date"
              value={dreamDate}
              onChange={(e) => setDreamDate(e.target.value)}
              className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-[var(--text)]"
            />
          </label>
        </div>

        {showRecorder && (
          <DreamRecorder
            onRecordingReady={(blob) => setAudioBlob(blob)}
            onClear={() => setAudioBlob(null)}
          />
        )}

        {audioBlob && !showRecorder && (
          <p className="text-xs text-[var(--accent)]">Audio ready to submit</p>
        )}

        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={retainAudio}
            onChange={(e) => setRetainAudio(e.target.checked)}
            className="rounded"
          />
          Keep original audio after transcription
        </label>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <button
          type="button"
          onClick={() => void submitTextOrContinue()}
          className="w-full rounded-full bg-[var(--accent)] py-3.5 text-sm font-medium text-[#1a1612] transition hover:brightness-110 md:w-auto md:px-8"
        >
          Remember My Dream
        </button>
      </div>
    </div>
  );
}
