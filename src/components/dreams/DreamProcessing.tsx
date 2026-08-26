"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { DREAM_FACTS, nextDreamFactIndex } from "@/lib/dreams/facts";

const STAGES = [
  "Remembering your dream...",
  "Finding the moments that mattered...",
  "Rebuilding the scene...",
  "Creating your dream image...",
];

export function DreamProcessing({ label }: { label?: string }) {
  const [index, setIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * DREAM_FACTS.length),
  );
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % STAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let outTimer: number | undefined;
    const id = window.setInterval(() => {
      setPhase("out");
      outTimer = window.setTimeout(() => {
        setFactIndex((i) => nextDreamFactIndex(i));
        setPhase("in");
      }, 700);
    }, 5200);
    return () => {
      window.clearInterval(id);
      if (outTimer != null) window.clearTimeout(outTimer);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 92 ? 92 : p + Math.random() * 6));
    }, 800);
    return () => clearInterval(id);
  }, []);

  const isGenerating = label?.toLowerCase().includes("image");
  const fact = DREAM_FACTS[factIndex];

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-7 px-4 py-16 text-center">
      <p className="font-display text-xl text-[var(--text)] sm:text-2xl">
        {label ?? STAGES[index]}
      </p>

      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        <div
          key={factIndex}
          className={`dream-pending-fact w-full ${
            phase === "in" ? "dream-pending-fact-in" : "dream-pending-fact-out"
          }`}
        >
          <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
            <Sparkles className="h-3 w-3" />
            Dream fact
          </p>
          <p className="text-pretty text-base leading-relaxed text-[#d4c8e4]">
            {fact}
          </p>
        </div>

        {isGenerating ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#7c6a9a] transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : (
          <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse-soft" />
        )}
      </div>
    </div>
  );
}
