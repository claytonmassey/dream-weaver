import { DreamCalendar } from "@/components/dreams/DreamCalendar";
import { requirePageUser } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { ensureSeeded } from "@/lib/db/ensure-seed";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await requirePageUser();
  await ensureSeeded(user.id);
  const dreams = await dreamRepository.list(user.id);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-3xl">Calendar</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Tap a day to see what you dreamed.
        </p>
      </div>
      <DreamCalendar dreams={dreams} />
    </div>
  );
}
