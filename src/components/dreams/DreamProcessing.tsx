"use client";

import { useEffect, useState } from "react";

const STAGES = [
  "Remembering your dream...",
  "Finding the moments that mattered...",
  "Rebuilding the scene...",
  "Creating your dream...",
];

export function DreamProcessing({
  label,
}: {
  label?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % STAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-[var(--bg-elevated)] px-8 py-16 text-center">
      <div className="relative mb-8 h-24 w-24">
        <div className="absolute inset-0 rounded-full bg-[var(--accent-soft)] animate-pulse-soft" />
        <div className="absolute inset-3 rounded-full border border-[var(--accent)]/30" />
        <div className="absolute inset-6 rounded-full bg-[var(--accent)]/20 processing-shimmer" />
      </div>
      <p className="font-display text-2xl text-[var(--text)]">
        {label ?? STAGES[index]}
      </p>
      <p className="mt-3 max-w-sm text-sm text-[var(--text-muted)]">
        This usually takes a few moments. Your dream is being carefully held.
      </p>
    </div>
  );
}
