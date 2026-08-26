"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { DREAM_FACTS, nextDreamFactIndex } from "@/lib/dreams/facts";

/**
 * Hero placeholder while the dream image is painting —
 * rotating facts with fade + blur, plus light polling for readiness.
 */
export function DreamImagePending({ dreamId }: { dreamId: string }) {
  const router = useRouter();
  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * DREAM_FACTS.length),
  );
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const poll = window.setInterval(() => {
      router.refresh();
    }, 4000);
    return () => window.clearInterval(poll);
  }, [dreamId, router]);

  useEffect(() => {
    let outTimer: number | undefined;
    const cycle = window.setInterval(() => {
      setPhase("out");
      outTimer = window.setTimeout(() => {
        setFactIndex((i) => nextDreamFactIndex(i));
        setPhase("in");
      }, 700);
    }, 5200);
    return () => {
      window.clearInterval(cycle);
      if (outTimer != null) window.clearTimeout(outTimer);
    };
  }, []);

  const fact = DREAM_FACTS[factIndex] ?? DREAM_FACTS[0];

  return (
    <div
      className="dream-pending relative flex h-full min-h-[inherit] w-full items-center justify-center overflow-hidden px-6 py-10 text-center sm:px-10"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="dream-pending-wash pointer-events-none absolute inset-0" />
      <div className="dream-pending-orb dream-pending-orb-a pointer-events-none absolute" />
      <div className="dream-pending-orb dream-pending-orb-b pointer-events-none absolute" />
      <div className="dream-pending-orb dream-pending-orb-c pointer-events-none absolute" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        <p className="dream-pending-label text-xs font-medium uppercase tracking-[0.22em] text-[var(--accent)]">
          Painting your dream
        </p>

        <div
          key={factIndex}
          className={`dream-pending-fact w-full ${
            phase === "in" ? "dream-pending-fact-in" : "dream-pending-fact-out"
          }`}
        >
          <p className="mb-3 flex items-center justify-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[#b8a4d4]/opacity-90">
            <Sparkles className="h-3 w-3" />
            Dream fact
          </p>
          <p className="font-display text-pretty text-lg leading-snug text-[#efe6f8] sm:text-xl sm:leading-snug">
            {fact}
          </p>
        </div>

        <div className="dream-pending-bar mt-1 h-0.5 w-24 overflow-hidden rounded-full bg-white/10">
          <div className="dream-pending-bar-fill h-full w-1/2 rounded-full bg-[var(--accent)]/80" />
        </div>
      </div>
    </div>
  );
}
