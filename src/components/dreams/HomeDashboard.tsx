import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, Mic, Sparkles } from "lucide-react";
import { formatDreamDate } from "@/lib/utils/cn";
import type { DreamListItem } from "@/types/dream";

function greetingForHour(hour: number): string {
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(name?: string | null): string | null {
  if (!name?.trim()) return null;
  return name.trim().split(/\s+/)[0] ?? null;
}

function isSameMonth(iso: string, now = new Date()): boolean {
  const d = new Date(iso);
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function HomeDashboard({
  userName,
  dreams,
}: {
  userName?: string | null;
  dreams: DreamListItem[];
}) {
  const hour = new Date().getHours();
  const greet = greetingForHour(hour);
  const name = firstName(userName);
  const recent = dreams.slice(0, 4);
  const monthCount = dreams.filter((d) => isSameMonth(d.dreamDate)).length;
  const featured = recent[0];

  return (
    <div className="mx-auto w-full max-w-lg space-y-8 pb-4 lg:max-w-2xl">
      <header className="space-y-1">
        <p className="text-sm text-[var(--text-muted)]">
          {greet}
          {name ? `, ${name}` : ""}
        </p>
        <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          Your dream space
        </h1>
      </header>

      <Link
        href="/dream/new"
        className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-white/10 px-5 py-5 transition active:scale-[0.99]"
        style={{
          background:
            "linear-gradient(135deg, rgba(224,184,122,0.18) 0%, rgba(28,18,48,0.55) 55%, rgba(18,12,32,0.65) 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[var(--accent)]/20 blur-2xl transition group-hover:bg-[var(--accent)]/30"
        />
        <span className="mic-orb-wrap relative h-16 w-16 shrink-0">
          <span aria-hidden className="mic-orb-halo" style={{ inset: "-35%" }} />
          <span className="mic-orb h-14 w-14 mic-orb--static shadow-[0_0_24px_rgba(224,184,122,0.45)]">
            <Mic className="h-6 w-6" strokeWidth={1.75} />
          </span>
        </span>
        <span className="relative min-w-0 flex-1 text-left">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[#f0e2c8]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            Capture a dream
          </span>
          <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
            Speak or write what you remember.
          </span>
        </span>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/timeline"
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 transition active:bg-white/5"
        >
          <BookOpen className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <span>
            <span className="block text-sm font-medium">Dreams</span>
            <span className="block text-xs text-[var(--text-muted)]">
              {dreams.length === 0
                ? "Journal"
                : `${dreams.length} saved`}
            </span>
          </span>
        </Link>
        <Link
          href="/calendar"
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 transition active:bg-white/5"
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <span>
            <span className="block text-sm font-medium">Calendar</span>
            <span className="block text-xs text-[var(--text-muted)]">
              {monthCount === 0
                ? "This month"
                : `${monthCount} this month`}
            </span>
          </span>
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl">Recent</h2>
          {dreams.length > 0 && (
            <Link
              href="/timeline"
              className="text-xs text-[var(--accent)]"
            >
              See all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Nothing here yet — tap the + button to record your first dream.
          </p>
        ) : (
          <div className="space-y-4">
            {featured && (
              <Link
                href={`/dream/${featured.id}`}
                className="block active:opacity-85"
              >
                <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-2xl bg-[var(--bg-elevated)]">
                  {featured.imageUrl ? (
                    <Image
                      src={featured.imageUrl}
                      alt={featured.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 640px"
                      unoptimized
                      priority
                    />
                  ) : (
                    <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-[var(--text-muted)]">
                      {featured.imageStatus === "failed"
                        ? "Image pending"
                        : "…"}
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10">
                    <p className="font-display text-lg leading-tight text-white">
                      {featured.title}
                    </p>
                    <p className="mt-0.5 text-xs text-white/70">
                      {formatDreamDate(featured.dreamDate)}
                      {featured.mood ? ` · ${featured.mood}` : ""}
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {recent.length > 1 && (
              <ul className="space-y-3">
                {recent.slice(1).map((dream) => (
                  <li key={dream.id}>
                    <Link
                      href={`/dream/${dream.id}`}
                      className="flex items-center gap-3 active:opacity-80"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-elevated)]">
                        {dream.imageUrl ? (
                          <Image
                            src={dream.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
                            —
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium leading-snug">
                          {dream.title}
                        </p>
                        <p className="truncate text-xs text-[var(--text-muted)]">
                          {formatDreamDate(dream.dreamDate)}
                          {dream.mood ? ` · ${dream.mood}` : ""}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
