"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const STAGES = [
  "Remembering your dream...",
  "Finding the moments that mattered...",
  "Rebuilding the scene...",
  "Creating your dream image...",
];

export function DreamProcessing({ label }: { label?: string }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % STAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 92 ? 92 : p + Math.random() * 6));
    }, 800);
    return () => clearInterval(id);
  }, []);

  const isGenerating = label?.toLowerCase().includes("image");

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="font-display text-xl text-[var(--text)]">
        {label ?? STAGES[index]}
      </p>

      {isGenerating ? (
        <div className="w-full max-w-xs space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-sm text-[var(--text-muted)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            Almost there...
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#7c6a9a] transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse-soft" />
      )}
    </div>
  );
}
