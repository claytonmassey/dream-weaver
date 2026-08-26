import { DreamTimeline } from "@/components/dreams/DreamTimeline";
import { EmptyDreamState } from "@/components/dreams/EmptyDreamState";
import { dreamRepository } from "@/lib/db/dream-repository";
import { ensureSeeded } from "@/lib/db/ensure-seed";
import { localDb } from "@/lib/db/local-store";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const user = await localDb.getOrCreateDemoUser();
  await ensureSeeded(user.id);
  const dreams = await dreamRepository.list(user.id);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-3xl">Timeline</h1>
      </div>
      {dreams.length === 0 ? (
        <EmptyDreamState />
      ) : (
        <DreamTimeline dreams={dreams} />
      )}
    </div>
  );
}
