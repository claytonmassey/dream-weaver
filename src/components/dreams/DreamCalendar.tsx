"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  const selectedDreams = selectedKey ? (dreamsByDay.get(selectedKey) ?? []) : [];

  return (
    <div className="mx-auto grid w-full max-w-lg gap-6 lg:max-w-5xl lg:grid-cols-[1.2fr_1fr] lg:gap-8">
      <div className="rounded-xl bg-[var(--bg-elevated)] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">
            {format(cursor, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCursor((d) => addMonths(d, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)]"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCursor((d) => addMonths(d, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)]"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] uppercase tracking-wider text-[var(--text-muted)] sm:mb-2 sm:gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="py-1">
              <span className="sm:hidden">{d}</span>
              <span className="hidden sm:inline">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayDreams = dreamsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const isSelected = selected && isSameDay(day, selected);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(day)}
                className={cn(
                  "relative flex min-h-11 flex-col items-center justify-start rounded-xl p-1 text-xs transition active:scale-95 sm:min-h-0 sm:aspect-square sm:rounded-2xl",
                  inMonth ? "text-[var(--text)]" : "text-[var(--text-muted)]/40",
                  isSelected && "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/40",
                  !isSelected && "hover:bg-white/5",
                )}
              >
                <span className="leading-none">{format(day, "d")}</span>
                {dayDreams[0]?.imageUrl && (
                  <span className="relative mt-0.5 h-4 w-4 overflow-hidden rounded sm:mt-1 sm:h-5 sm:w-5 sm:rounded-md">
                    <Image
                      src={dayDreams[0].imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                )}
                {!dayDreams[0]?.imageUrl && dayDreams.length > 0 && (
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <h3 className="font-display text-lg sm:text-xl">
          {selected
            ? format(selected, "MMM d, yyyy")
            : "Select a day"}
        </h3>
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
                  className="flex gap-3 overflow-hidden rounded-2xl bg-[var(--bg-elevated)] transition active:scale-[0.99] hover:bg-[var(--bg-soft)]"
                >
                  <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 bg-[#151820] sm:h-20 sm:w-24">
                    {dream.imageUrl && (
                      <Image
                        src={dream.imageUrl}
                        alt={dream.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
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
