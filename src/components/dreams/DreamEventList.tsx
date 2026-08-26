import type { DreamEvent } from "@/types/dream";

export function DreamEventList({ events }: { events: DreamEvent[] }) {
  const sorted = [...events].sort((a, b) => a.order - b.order);

  return (
    <ol className="space-y-6">
      {sorted.map((event) => (
        <li key={event.id} className="flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm text-[var(--accent)]">
            {event.order}
          </div>
          <div className="space-y-1 pt-0.5">
            <h3 className="font-display text-xl">{event.title}</h3>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              {event.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
