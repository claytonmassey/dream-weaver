import Image from "next/image";
import Link from "next/link";
import { formatDreamDate, formatMonthYear } from "@/lib/utils/cn";
import type { DreamListItem } from "@/types/dream";

function groupByMonth(dreams: DreamListItem[]) {
  const groups = new Map<string, DreamListItem[]>();
  for (const dream of dreams) {
    const key = formatMonthYear(dream.dreamDate);
    const list = groups.get(key) ?? [];
    list.push(dream);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

export function DreamTimeline({ dreams }: { dreams: DreamListItem[] }) {
  const groups = groupByMonth(dreams);

  return (
    <div className="mx-auto w-full max-w-lg space-y-8 lg:max-w-2xl">
      {groups.map(([month, items]) => (
        <section key={month} className="space-y-4">
          <h2 className="text-sm text-[var(--text-muted)]">{month}</h2>
          <div className="space-y-5">
            {items.map((dream) => (
              <DreamTimelineItem key={dream.id} dream={dream} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function DreamTimelineItem({ dream }: { dream: DreamListItem }) {
  return (
    <Link href={`/dream/${dream.id}`} className="block active:opacity-80">
      <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-xl bg-[var(--bg-elevated)]">
        {dream.imageUrl ? (
          <Image
            src={dream.imageUrl}
            alt={dream.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 640px"
            unoptimized
          />
        ) : (
          <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-[var(--text-muted)]">
            No image yet
          </div>
        )}
      </div>
      <div className="space-y-1 px-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl leading-tight">{dream.title}</h3>
          <time className="shrink-0 text-xs text-[var(--text-muted)]">
            {formatDreamDate(dream.dreamDate)}
          </time>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{dream.mood}</p>
        <p className="line-clamp-2 text-sm text-[var(--text-muted)]">
          {dream.summary}
        </p>
      </div>
    </Link>
  );
}
