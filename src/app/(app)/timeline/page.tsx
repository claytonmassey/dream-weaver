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
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-4xl">Timeline</h1>
        <p className="text-sm text-[var(--text-muted)]">
          A visual history of the dreams you&apos;ve remembered
        </p>
      </div>
      {dreams.length === 0 ? (
        <EmptyDreamState />
      ) : (
        <DreamTimeline dreams={dreams} />
      )}
    </div>
  );
}
