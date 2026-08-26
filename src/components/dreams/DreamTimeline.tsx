import Image from "next/image";
import Link from "next/link";
import { MoodBadge } from "@/components/dreams/MoodBadge";
import { formatDreamDate, formatMonthYear } from "@/lib/utils/cn";
import type { DreamListItem } from "@/types/dream";
import { cn } from "@/lib/utils/cn";

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
    <div className="space-y-12">
      {groups.map(([month, items]) => (
        <section key={month}>
          <h2 className="mb-6 font-display text-xl text-[var(--text-muted)]">
            {month}
          </h2>
          <div className="relative space-y-8 md:space-y-12">
            <div className="absolute bottom-0 left-4 top-0 hidden w-px bg-white/10 md:left-1/2 md:block" />
            {items.map((dream, index) => (
              <DreamTimelineItem
                key={dream.id}
                dream={dream}
                alternate={index % 2 === 1}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function DreamTimelineItem({
  dream,
  alternate,
}: {
  dream: DreamListItem;
  alternate?: boolean;
}) {
  return (
    <Link
      href={`/dream/${dream.id}`}
      className={cn(
        "relative grid gap-4 md:grid-cols-2 md:gap-10",
        alternate && "md:[&>*:first-child]:order-2",
      )}
    >
      <div
        className={cn(
          "relative z-10 hidden md:block",
          alternate ? "text-left" : "text-right",
        )}
      >
        <div
          className={cn(
            "absolute top-8 h-3 w-3 rounded-full bg-[var(--accent)]",
            alternate ? "-left-[1.4rem]" : "-right-[1.4rem]",
          )}
        />
      </div>

      <article className="group overflow-hidden rounded-3xl bg-[var(--bg-elevated)] transition hover:bg-[var(--bg-soft)] md:col-span-2 md:grid md:grid-cols-2 md:gap-0">
        <div className="relative aspect-[16/11] bg-[#151820] md:aspect-auto md:min-h-[220px]">
          {dream.imageUrl ? (
            <Image
              src={dream.imageUrl}
              alt={dream.title}
              fill
              className="object-cover transition duration-700 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center text-sm text-[var(--text-muted)]">
              No image yet
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center space-y-3 px-5 py-5 md:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <time className="text-xs text-[var(--text-muted)]">
              {formatDreamDate(dream.dreamDate)}
            </time>
            <MoodBadge mood={dream.mood} />
          </div>
          <h3 className="font-display text-2xl leading-tight">{dream.title}</h3>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            {dream.summary}
          </p>
          {dream.people.length > 0 && (
            <p className="text-xs text-[var(--accent)]">
              {dream.people.map((p) => p.name).join(" · ")}
            </p>
          )}
          {dream.emotions.length > 0 && (
            <p className="text-xs capitalize text-[var(--text-muted)]">
              {dream.emotions.slice(0, 3).join(" · ")}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
