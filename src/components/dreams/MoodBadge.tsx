import { cn } from "@/lib/utils/cn";

export function MoodBadge({
  mood,
  className,
}: {
  mood: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs tracking-wide text-[var(--accent)]",
        className,
      )}
    >
      {mood}
    </span>
  );
}
