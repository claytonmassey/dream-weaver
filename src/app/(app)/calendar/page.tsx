import { DreamCalendar } from "@/components/dreams/DreamCalendar";
import { dreamRepository } from "@/lib/db/dream-repository";
import { ensureSeeded } from "@/lib/db/ensure-seed";
import { localDb } from "@/lib/db/local-store";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await localDb.getOrCreateDemoUser();
  await ensureSeeded(user.id);
  const dreams = await dreamRepository.list(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-4xl">Calendar</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Days with dreams glow with a thumbnail. Tap a date to revisit them.
        </p>
      </div>
      <DreamCalendar dreams={dreams} />
    </div>
  );
}
