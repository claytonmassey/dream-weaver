"use client";

import { DREAM_VISUAL_STYLES } from "@/types/conversation";
import type { DreamVisualStyle } from "@/types/dream";
import { cn } from "@/lib/utils/cn";

export function StylePicker({
  selected,
  onSelect,
  onContinue,
  onBack,
}: {
  selected: DreamVisualStyle | null;
  onSelect: (style: DreamVisualStyle) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="space-y-2">
        <h2 className="font-display text-2xl leading-tight">
          How should it look?
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Pick a style, then I&apos;ll start painting your dream.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {DREAM_VISUAL_STYLES.map((style) => {
          const active = selected === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style.id)}
              className={cn(
                "flex min-h-16 flex-col items-start justify-center rounded-2xl px-5 py-4 text-left transition",
                active
                  ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/50"
                  : "bg-[var(--bg-elevated)] active:bg-[var(--bg-soft)]",
              )}
            >
              <span className="font-display text-lg">{style.label}</span>
              <span className="mt-0.5 text-xs text-[var(--text-muted)]">
                {style.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={!selected}
          onClick={onContinue}
          className="min-h-11 flex-1 rounded-full bg-[var(--accent)] text-sm font-medium text-[#1a1612] disabled:opacity-40"
        >
          Paint my dream
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[var(--text-muted)]"
        >
          Back
        </button>
      </div>
    </div>
  );
}
