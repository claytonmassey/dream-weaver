"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DreamListItem } from "@/types/dream";

export function DreamCalendar({ dreams }: { dreams: DreamListItem[] }) {
  const router = useRouter();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());

  const dreamsByDay = useMemo(() => {
    const map = new Map<string, DreamListItem[]>();
    for (const dream of dreams) {
      const key = format(new Date(dream.dreamDate), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(dream);
      map.set(key, list);
    }
    return map;
  }, [dreams]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor)),
    end: endOfWeek(endOfMonth(cursor)),
  });

  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : null;
  const selectedDreams = selectedKey
    ? (dreamsByDay.get(selectedKey) ?? [])
    : [];

  function openDay(day: Date) {
    const key = format(day, "yyyy-MM-dd");
    setSelected(day);
    router.push(`/calendar/${key}`);
  }

  return (
    <div className="mx-auto grid w-full max-w-lg gap-6 lg:max-w-5xl lg:grid-cols-[1.2fr_1fr] lg:gap-8">
      <div className="glass relative overflow-hidden rounded-2xl border border-white/10 p-4 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 top-2 h-24 w-24 rounded-full bg-[var(--accent)]/15 blur-2xl"
        />

        <div className="relative mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl sm:text-2xl">
            {format(cursor, "MMMM yyyy")}
          </h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setCursor((d) => addMonths(d, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCursor((d) => addMonths(d, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs tracking-wider text-[var(--text-muted)]">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayDreams = dreamsByDay.get(key) ?? [];
            const hasDream = dayDreams.length > 0;
            const thumb = dayDreams.find((d) => d.imageUrl)?.imageUrl;
            const inMonth = isSameMonth(day, cursor);
            const isSelected = selected && isSameDay(day, selected);

            return (
              <button
                key={key}
                type="button"
                onClick={() => openDay(day)}
                className={cn(
                  "relative flex min-h-[3.25rem] flex-col items-center rounded-xl px-0.5 pb-1 pt-1.5 text-xs transition active:scale-95 sm:min-h-[4.25rem]",
                  inMonth ? "text-[var(--text)]" : "text-[var(--text-muted)]/35",
                  isSelected &&
                    "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/50",
                  !isSelected && hasDream && "bg-white/[0.04]",
                  !isSelected && "hover:bg-white/5",
                )}
                aria-label={
                  hasDream
                    ? `${format(day, "MMMM d")}, ${dayDreams.length} dream${dayDreams.length === 1 ? "" : "s"}`
                    : format(day, "MMMM d")
                }
              >
                <span className="leading-none">{format(day, "d")}</span>

                {hasDream && thumb && (
                  <span className="relative mt-1 h-6 w-6 overflow-hidden rounded-md ring-1 ring-white/15 sm:h-7 sm:w-7">
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                )}

                {hasDream && !thumb && (
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(224,184,122,0.7)]" />
                )}

                {hasDream && dayDreams.length > 1 && (
                  <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg sm:text-xl">
            {selected ? format(selected, "MMM d, yyyy") : "Select a day"}
          </h3>
          {selected && (
            <Link
              href={`/calendar/${format(selected, "yyyy-MM-dd")}`}
              className="text-sm text-[var(--accent)]"
            >
              Open day
            </Link>
          )}
        </div>

        {selectedDreams.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No dreams recorded for this day.
          </p>
        ) : (
          <ul className="space-y-2.5 sm:space-y-3">
            {selectedDreams.map((dream) => (
              <li key={dream.id}>
                <Link
                  href={`/dream/${dream.id}`}
                  className="glass flex gap-3 overflow-hidden rounded-2xl border border-white/10 transition active:scale-[0.99]"
                >
                  <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 bg-black/30 sm:h-20 sm:w-24">
                    {dream.imageUrl ? (
                      <Image
                        src={dream.imageUrl}
                        alt={dream.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-2.5 pr-3 sm:py-3">
                    <p className="truncate font-medium">{dream.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                      {dream.summary}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
