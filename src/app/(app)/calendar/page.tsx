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
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-3xl">Calendar</h1>
      </div>
      <DreamCalendar dreams={dreams} />
    </div>
  );
}
