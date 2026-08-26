"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Mic, Pencil } from "lucide-react";
import { DreamConversation } from "@/components/dreams/DreamConversation";
import { DreamProcessing } from "@/components/dreams/DreamProcessing";
import { PersonReferencePrompt } from "@/components/dreams/PersonReferencePrompt";
import { toDateInputValue } from "@/lib/utils/cn";
import type { Dream, DreamAnalysis, DreamPerson } from "@/types/dream";

type Step =
  | "choose"
  | "converse"
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
  const [preferText, setPreferText] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<Record<string, File>>({});
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [pendingPeople, setPendingPeople] = useState<DreamPerson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedDreamId, setSavedDreamId] = useState<string | null>(null);

  function startOver() {
    setError(null);
    setTranscript("");
    setRawTranscript("");
    setPreferText(false);
    setPendingPhotos({});
    setAnalysis(null);
    setPendingPeople([]);
    setSavedDreamId(null);
    setStep("choose");
  }

  async function beginPainting(finalTranscript: string) {
    const value = finalTranscript.trim();
    if (!value) {
      setError("Add a bit more before painting.");
      return;
    }
    setTranscript(value);
    setRawTranscript((prev) => prev || value);
    setStep("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/dreams/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: value }),
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
        await saveAndGenerate(value, data.analysis, {});
      }
    } catch {
      setError("Something went wrong. Try again.");
      setStep("converse");
    }
  }

  async function saveAndGenerate(
    finalTranscript: string,
    dreamAnalysis: DreamAnalysis,
    photos: Record<string, File>,
  ) {
    const style = "cinematic";
    setPendingPhotos(photos);
    setStep("saving");
    setError(null);
    try {
      const createRes = await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamDate,
          rawTranscript: rawTranscript || finalTranscript,
          cleanedTranscript: finalTranscript,
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
    step === "analyzing" ||
    step === "saving" ||
    step === "generating"
  ) {
    const labels: Partial<Record<Step, string>> = {
      analyzing: "Gathering the details...",
      saving: "Preparing the canvas...",
      generating: "Creating your dream image...",
    };
    return <DreamProcessing label={labels[step]} />;
  }

  if (step === "person-reference" && analysis) {
    return (
      <PersonReferencePrompt
        people={pendingPeople}
        onContinue={(photos) =>
          void saveAndGenerate(transcript, analysis, photos)
        }
        onSkip={() => void saveAndGenerate(transcript, analysis, pendingPhotos)}
      />
    );
  }

  if (step === "converse") {
    return (
      <DreamConversation
        transcript={transcript}
        preferText={preferText}
        onReady={(enriched) => void beginPainting(enriched)}
        onBack={startOver}
        onStartOver={startOver}
      />
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
            onClick={startOver}
            className="px-3 py-2.5 text-sm text-[var(--text-muted)]"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-6 pb-4 text-center">
      <div className="space-y-3">
        <h1 className="font-display text-[2rem] leading-tight tracking-tight sm:text-4xl">
          What did you dream?
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
          Tell me anything you remember. Even fragments are enough.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setTranscript("");
            setRawTranscript("");
            setPreferText(false);
            setStep("converse");
          }}
          className="flex h-[7.25rem] w-[7.25rem] items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1612] shadow-[0_0_56px_rgba(196,168,130,0.5)] transition active:scale-[0.97]"
          aria-label="Speak your dream"
        >
          <Mic className="h-9 w-9" />
        </button>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-[var(--text)]">
            Tap to remember
          </p>
          <p className="text-xs text-[var(--text-muted)]">Speak your dream.</p>
        </div>
      </div>

      <div className="flex w-full max-w-sm items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-[var(--text-muted)]">or</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setTranscript("");
          setRawTranscript("");
          setPreferText(true);
          setStep("converse");
        }}
        className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-[var(--bg-elevated)]/60 px-5 py-4 text-left transition active:bg-[var(--bg-soft)]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
          <Pencil className="h-4 w-4 text-[var(--accent)]" />
        </span>
        <span>
          <span className="block text-sm font-medium">Write my dream</span>
          <span className="block text-xs text-[var(--text-muted)]">
            Type it out.
          </span>
        </span>
      </button>

      <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Lock className="h-3 w-3" />
        Your dreams are private and encrypted.
      </p>
    </div>
  );
}
