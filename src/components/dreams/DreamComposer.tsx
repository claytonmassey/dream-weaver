"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Lock, Mic, Pencil } from "lucide-react";
import { DreamConversation } from "@/components/dreams/DreamConversation";
import { DreamProcessing } from "@/components/dreams/DreamProcessing";
import { PersonReferencePrompt } from "@/components/dreams/PersonReferencePrompt";
import { SpeakFocus } from "@/components/dreams/SpeakFocus";
import { toDateInputValue } from "@/lib/utils/cn";
import type { Dream, DreamAnalysis, DreamPerson, DreamVisualStyle } from "@/types/dream";
import type { DreamChatReference } from "@/types/reference";

type Step =
  | "choose"
  | "listen"
  | "transcribing"
  | "converse"
  | "analyzing"
  | "person-reference"
  | "saving"
  | "generating"
  | "error";

function namesMatch(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

/** Map person display name → photo file */
type PhotosByName = Record<string, File>;

export function DreamComposer() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [dreamDate] = useState(toDateInputValue());
  const [transcript, setTranscript] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [preferText, setPreferText] = useState(false);
  const [seedUserMessage, setSeedUserMessage] = useState<string | null>(null);
  const [landingFading, setLandingFading] = useState(false);
  const [chatReferences, setChatReferences] = useState<DreamChatReference[]>(
    [],
  );
  const [photosByName, setPhotosByName] = useState<PhotosByName>({});
  const [visualStyle, setVisualStyle] = useState<DreamVisualStyle>("cinematic");
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [pendingPeople, setPendingPeople] = useState<DreamPerson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedDreamId, setSavedDreamId] = useState<string | null>(null);
  const speakLaunchTimer = useRef<number | null>(null);

  useEffect(() => {
    const focus =
      landingFading || step === "listen" || step === "transcribing";
    if (focus) {
      document.body.classList.add("dream-focus-mode");
    } else {
      document.body.classList.remove("dream-focus-mode");
    }
    return () => {
      document.body.classList.remove("dream-focus-mode");
    };
  }, [landingFading, step]);

  useEffect(() => {
    return () => {
      if (speakLaunchTimer.current != null) {
        window.clearTimeout(speakLaunchTimer.current);
      }
    };
  }, []);

  function startOver() {
    setError(null);
    setTranscript("");
    setRawTranscript("");
    setPreferText(false);
    setSeedUserMessage(null);
    setLandingFading(false);
    setChatReferences([]);
    setPhotosByName({});
    setVisualStyle("cinematic");
    setAnalysis(null);
    setPendingPeople([]);
    setSavedDreamId(null);
    setStep("choose");
  }

  async function handleSpeakReady(blob: Blob) {
    setStep("transcribing");
    setError(null);
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
      if (!res.ok || !data.cleanedTranscript?.trim()) {
        throw new Error(data.error || "Couldn't hear that clearly.");
      }
      const cleaned = data.cleanedTranscript.trim();
      setRawTranscript(data.transcript || cleaned);
      setTranscript(cleaned);
      setSeedUserMessage(cleaned);
      setPreferText(false);
      setLandingFading(false);
      setStep("converse");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't hear that clearly.",
      );
      setLandingFading(false);
      setStep("choose");
    }
  }

  function beginSpeak() {
    setError(null);
    setTranscript("");
    setRawTranscript("");
    setSeedUserMessage(null);
    setPreferText(false);
    setLandingFading(true);
    // Brief pause so the tap burst is visible before listen UI mounts.
    // Mic start still happens promptly in SpeakFocus (already async from gesture).
    if (speakLaunchTimer.current != null) {
      window.clearTimeout(speakLaunchTimer.current);
    }
    speakLaunchTimer.current = window.setTimeout(() => {
      speakLaunchTimer.current = null;
      setStep("listen");
    }, 420);
  }

  function matchPhotosToPeople(
    people: DreamPerson[],
    refs: DreamChatReference[],
  ): PhotosByName {
    const photos: PhotosByName = {};
    const used = new Set<string>();

    for (const person of people) {
      const match = refs.find(
        (ref) =>
          !used.has(ref.id) &&
          ref.isPerson &&
          ref.personName &&
          namesMatch(person.name, ref.personName),
      );
      if (match) {
        photos[person.name] = match.file;
        used.add(match.id);
      }
    }
    return photos;
  }

  async function beginPainting(
    finalTranscript: string,
    references: DreamChatReference[],
    style: DreamVisualStyle,
  ) {
    const value = finalTranscript.trim();
    if (!value) {
      setError("Add a bit more before painting.");
      return;
    }
    setTranscript(value);
    setRawTranscript((prev) => prev || value);
    setChatReferences(references);
    setVisualStyle(style);
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

      const realPeople = data.analysis.people
        .filter((p) => p.isRealPerson)
        .map((p, i) => ({
          id: `temp_${i}`,
          dreamId: "",
          name: p.name,
          description: p.description ?? null,
          relationship: p.relationship ?? null,
          isRealPerson: true,
          referenceImageUrl: null,
        }));

      const matched = matchPhotosToPeople(realPeople, references);
      setPhotosByName(matched);

      const missing = realPeople.filter((p) => !matched[p.name]);
      if (missing.length > 0) {
        setPendingPeople(missing);
        setStep("person-reference");
      } else {
        await saveAndGenerate(value, data.analysis, matched, references, style);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setStep("converse");
    }
  }

  async function saveAndGenerate(
    finalTranscript: string,
    dreamAnalysis: DreamAnalysis,
    photos: PhotosByName,
    references: DreamChatReference[] = chatReferences,
    style: DreamVisualStyle = visualStyle,
  ) {
    setPhotosByName(photos);
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
      const createPayload = (await createRes.json()) as {
        dream?: Dream;
      };
      if (!createRes.ok || !createPayload.dream) {
        throw new Error("Save failed");
      }
      const dream = createPayload.dream;
      setSavedDreamId(dream.id);

      const attachedFiles = new Set<File>();

      for (const [personName, file] of Object.entries(photos)) {
        const person = dream.people.find((p) =>
          namesMatch(p.name, personName),
        );
        if (!person) continue;
        const form = new FormData();
        form.append("personId", person.id);
        form.append("photo", file);
        await fetch(`/api/dreams/${dream.id}/reference-photo`, {
          method: "POST",
          body: form,
        });
        attachedFiles.add(file);
      }

      for (const ref of references) {
        if (!ref.isPerson || !ref.personName || attachedFiles.has(ref.file)) {
          continue;
        }
        const person = dream.people.find((p) =>
          namesMatch(p.name, ref.personName!),
        );
        if (!person) continue;
        const form = new FormData();
        form.append("personId", person.id);
        form.append("photo", ref.file);
        await fetch(`/api/dreams/${dream.id}/reference-photo`, {
          method: "POST",
          body: form,
        });
        attachedFiles.add(ref.file);
      }

      const extraUrls: string[] = [];
      for (const ref of references) {
        if (attachedFiles.has(ref.file)) continue;
        const form = new FormData();
        form.append("photo", ref.file);
        const uploadRes = await fetch("/api/dreams/upload-reference", {
          method: "POST",
          body: form,
        });
        if (!uploadRes.ok) continue;
        const uploaded = (await uploadRes.json()) as { url?: string };
        if (uploaded.url) extraUrls.push(uploaded.url);
      }

      setStep("generating");
      const imageRes = await fetch("/api/dreams/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamId: dream.id,
          style,
          referenceImageUrls: extraUrls,
        }),
      });

      if (!imageRes.ok) {
        try {
          const errBody = (await imageRes.json()) as {
            error?: string;
            diagnostics?: Record<string, unknown>;
          };
          const bits = [errBody.error, errBody.diagnostics && JSON.stringify(errBody.diagnostics)]
            .filter(Boolean)
            .join(" ");
          if (bits) {
            sessionStorage.setItem(`dream-image-error:${dream.id}`, bits);
          }
        } catch {
          // ignore parse errors
        }
        router.push(`/dream/${dream.id}?imageFailed=1`);
        return;
      }

      // Image paints in the background; the dream page polls until ready.
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

  if (step === "listen") {
    return (
      <SpeakFocus
        onReady={(blob) => void handleSpeakReady(blob)}
        onCancel={() => {
          setLandingFading(false);
          setStep("choose");
        }}
      />
    );
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
      generating: "Creating your dream image...",
    };
    return <DreamProcessing label={labels[step]} />;
  }

  if (step === "person-reference" && analysis) {
    return (
      <PersonReferencePrompt
        people={pendingPeople}
        onContinue={(photosById) => {
          const merged: PhotosByName = { ...photosByName };
          for (const [id, file] of Object.entries(photosById)) {
            const person = pendingPeople.find((p) => p.id === id);
            if (person) merged[person.name] = file;
          }
          void saveAndGenerate(
            transcript,
            analysis,
            merged,
            chatReferences,
            visualStyle,
          );
        }}
        onSkip={() =>
          void saveAndGenerate(
            transcript,
            analysis,
            photosByName,
            chatReferences,
            visualStyle,
          )
        }
      />
    );
  }

  if (step === "converse") {
    return (
      <DreamConversation
        transcript={transcript}
        preferText={preferText}
        seedUserMessage={seedUserMessage}
        onReady={(enriched, refs, style) =>
          void beginPainting(enriched, refs, style)
        }
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
    <div className="flex h-[calc(100dvh-11.75rem)] min-h-0 flex-col items-center justify-between gap-3 overflow-hidden py-1 text-center sm:justify-center sm:gap-6 sm:py-4 lg:h-[calc(100dvh-4rem)]">
      <div
        className={`shrink-0 space-y-2 transition-all duration-[400ms] ease-out ${
          landingFading
            ? "translate-y-2 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-[var(--text)] sm:text-4xl">
          What did you dream?
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
          Tell me anything you remember. Even fragments are enough.
        </p>
      </div>

      <div
        className={`relative flex shrink-0 flex-col items-center gap-2.5 transition-all duration-500 ease-out ${
          landingFading ? "scale-110" : "scale-100"
        }`}
      >
        <div className="relative flex h-28 w-28 items-center justify-center sm:h-[7.25rem] sm:w-[7.25rem]">
          {landingFading && (
            <>
              <span
                aria-hidden
                className="animate-mic-ring absolute inset-0 rounded-full border border-[var(--accent)]/60"
              />
              <span
                aria-hidden
                className="animate-mic-ring absolute inset-0 rounded-full border border-[var(--accent)]/35 [animation-delay:90ms]"
              />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-[var(--accent)]/25 animate-ping [animation-duration:0.7s]"
              />
            </>
          )}
          <div className="mic-orb-wrap h-full w-full">
            {!landingFading && (
              <>
                <span aria-hidden className="mic-orb-halo" />
                <span aria-hidden className="mic-orb-ring mic-orb-ring--outer" />
                <span aria-hidden className="mic-orb-ring" />
              </>
            )}
            <button
              type="button"
              disabled={landingFading}
              onClick={beginSpeak}
              className={`mic-orb relative z-10 h-[85%] w-[85%] disabled:opacity-100 ${
                landingFading ? "animate-mic-launch" : ""
              }`}
              aria-label="Speak your dream"
            >
              <Mic className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div
          className={`space-y-0.5 transition-opacity duration-300 ${
            landingFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="text-sm font-medium text-[var(--accent)]">
            Tap to remember
          </p>
          <p className="text-xs text-[var(--text-muted)]">Speak your dream.</p>
        </div>
      </div>

      <div
        className={`flex w-full max-w-sm shrink-0 flex-col items-center gap-4 transition-all duration-[400ms] ease-out sm:gap-6 ${
          landingFading
            ? "pointer-events-none translate-y-3 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="flex w-full items-center gap-3">
          <span className="h-px flex-1 bg-white/15" />
          <span className="text-xs text-[var(--text-muted)]">or</span>
          <span className="h-px flex-1 bg-white/15" />
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setTranscript("");
            setRawTranscript("");
            setSeedUserMessage(null);
            setPreferText(true);
            setStep("converse");
          }}
          className="glass flex w-full items-center gap-3 rounded-2xl border border-white/10 px-5 py-3.5 text-left transition active:bg-white/5 sm:py-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]">
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

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
