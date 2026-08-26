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
  const active =
    DREAM_VISUAL_STYLES.find((s) => s.id === selected) ?? DREAM_VISUAL_STYLES[0];

  return (
    <div className="dream-review flex flex-col gap-8 pt-2">
      <header className="dream-review-enter space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
          Ready to paint
        </p>
        <h2 className="font-display text-2xl leading-tight sm:text-3xl">
          How should this dream look?
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {active?.mood ?? "Pick a style, then I'll start painting."}
        </p>
      </header>

      <div
        className="dream-review-enter dream-review-enter-delay-1 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-5 sm:overflow-visible"
        role="listbox"
        aria-label="Visual style"
      >
        {DREAM_VISUAL_STYLES.map((style) => {
          const isActive = selected === style.id;
          return (
            <button
              key={style.id}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => onSelect(style.id)}
              className={cn(
                "dream-style-chip min-w-[7.25rem] shrink-0 rounded-2xl px-3.5 py-3.5 text-left transition sm:min-w-0",
                isActive ? "dream-style-chip-active" : "dream-style-chip-idle",
              )}
            >
              <span className="block text-sm font-medium text-[var(--text)]">
                {style.label}
              </span>
              <span className="mt-1 block text-[0.7rem] leading-snug text-[var(--text-muted)]">
                {style.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div className="dream-review-enter dream-review-enter-delay-2 flex items-center gap-4">
        <button
          type="button"
          disabled={!selected}
          onClick={onContinue}
          className="btn-gold min-h-11 flex-1 rounded-full text-sm font-medium disabled:opacity-40"
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
