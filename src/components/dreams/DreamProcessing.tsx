"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const STAGES = [
  "Remembering your dream...",
  "Finding the moments that mattered...",
  "Rebuilding the scene...",
  "Creating your dream image...",
];

/** Short, familiar dream factoids shown while processing. */
const DREAM_FACTS = [
  "Falling dreams are one of the most common dreams in the world.",
  "Dreams about teeth falling out often track stress or feeling powerless.",
  "Being chased in a dream usually mirrors something you’re avoiding awake.",
  "Flying dreams are linked to freedom, control, or a sudden lift in mood.",
  "Showing up unprepared (or naked) often echoes social anxiety.",
  "Most people forget about 95% of a dream within a few minutes of waking.",
  "You typically dream four to six times a night — most of it vanishes by morning.",
  "Dreaming happens in every sleep stage, not only REM.",
  "Recurring dreams often point to something unfinished in waking life.",
  "Familiar faces in dreams are often mental composites, not exact people.",
  "Keeping a dream journal can make recall sharper within a week.",
  "Nightmares can be the brain rehearsing threat in a safe setting.",
  "Smell and taste rarely appear in dreams; sight and emotion usually lead.",
  "Lucid dreamers catch the glitch — clocks, text, or light that won’t behave.",
  "Water in dreams often tracks emotion: calm seas vs. rising floods.",
  "Losing your way (halls, cities, doors) often maps feeling lost or stuck.",
  "Animals in dreams frequently stand in for instinct, fear, or protection.",
  "Colorful dreams are normal — true black-and-white dreams are less common.",
];

export function DreamProcessing({ label }: { label?: string }) {
  const [index, setIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * DREAM_FACTS.length),
  );
  const [factVisible, setFactVisible] = useState(true);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % STAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let fadeTimer: number | undefined;
    const id = window.setInterval(() => {
      setFactVisible(false);
      fadeTimer = window.setTimeout(() => {
        setFactIndex((i) => {
          let next = Math.floor(Math.random() * DREAM_FACTS.length);
          if (DREAM_FACTS.length > 1 && next === i) {
            next = (i + 1) % DREAM_FACTS.length;
          }
          return next;
        });
        setFactVisible(true);
      }, 280);
    }, 4500);
    return () => {
      window.clearInterval(id);
      if (fadeTimer != null) window.clearTimeout(fadeTimer);
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
          className={`w-full transition-opacity duration-300 ${
            factVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
            <Sparkles className="h-3 w-3" />
            Dream fact
          </p>
          <p className="text-pretty text-[15px] leading-relaxed text-[#d4c8e4]">
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
