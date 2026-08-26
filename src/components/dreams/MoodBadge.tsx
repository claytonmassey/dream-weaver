import { cn } from "@/lib/utils/cn";

export function MoodBadge({
  mood,
  className,
}: {
  mood: string;
  className?: string;
}) {
  return (
    <span className={cn("text-xs text-[var(--text-muted)]", className)}>
      {mood}
    </span>
  );
}
