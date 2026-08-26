import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { requirePageUser } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { ensureSeeded } from "@/lib/db/ensure-seed";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ date: string }>;
};

export default async function CalendarDayPage({ params }: Props) {
  const { date } = await params;
  const day = parseISO(date);
  if (!isValid(day) || date !== format(day, "yyyy-MM-dd")) {
    notFound();
  }

  const user = await requirePageUser();
  await ensureSeeded(user.id);
  const dreams = await dreamRepository.list(user.id);
  const dayDreams = dreams.filter(
    (d) => format(new Date(d.dreamDate), "yyyy-MM-dd") === date,
  );

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-3">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Calendar
        </Link>
        <h1 className="font-display text-3xl">{format(day, "MMMM d, yyyy")}</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {dayDreams.length === 0
            ? "No dreams recorded for this day."
            : `${dayDreams.length} dream${dayDreams.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {dayDreams.length === 0 ? (
        <div className="glass rounded-2xl border border-white/10 px-5 py-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Nothing captured yet.
          </p>
          <Link
            href="/"
            className="btn-gold mt-5 inline-flex min-h-11 items-center rounded-full px-5 text-sm"
          >
            Record a dream
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {dayDreams.map((dream) => (
            <li key={dream.id}>
              <Link
                href={`/dream/${dream.id}`}
                className="glass flex gap-3 overflow-hidden rounded-2xl border border-white/10 transition active:scale-[0.99]"
              >
                <div className="relative h-24 w-24 shrink-0 bg-black/30 sm:h-28 sm:w-28">
                  {dream.imageUrl ? (
                    <Image
                      src={dream.imageUrl}
                      alt={dream.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      {dream.imageStatus === "pending" ? "Painting…" : "No image"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 py-3 pr-4">
                  <p className="truncate font-display text-lg leading-snug">
                    {dream.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                    {dream.summary}
                  </p>
                  {dream.mood && (
                    <p className="mt-2 text-xs text-[var(--accent)]">
                      {dream.mood}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
