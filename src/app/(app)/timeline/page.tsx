import { DreamTimeline } from "@/components/dreams/DreamTimeline";
import { EmptyDreamState } from "@/components/dreams/EmptyDreamState";
import { requirePageUser } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { ensureSeeded } from "@/lib/db/ensure-seed";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const user = await requirePageUser();
  await ensureSeeded(user.id);
  const dreams = await dreamRepository.list(user.id);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-3xl">Recent</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Your dream journal
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
