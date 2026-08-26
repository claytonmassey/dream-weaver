"use client";

import { useEffect, useState } from "react";

const STAGES = [
  "Remembering your dream...",
  "Finding the moments that mattered...",
  "Rebuilding the scene...",
  "Creating your dream...",
];

export function DreamProcessing({ label }: { label?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % STAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-5 h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse-soft" />
      <p className="font-display text-xl text-[var(--text)]">
        {label ?? STAGES[index]}
      </p>
    </div>
  );
}
