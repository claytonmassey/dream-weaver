import { DreamComposer } from "@/components/dreams/DreamComposer";
import { DreamCard } from "@/components/dreams/DreamCard";
import { EmptyDreamState } from "@/components/dreams/EmptyDreamState";
import { ensureSeeded } from "@/lib/db/ensure-seed";
import { dreamRepository } from "@/lib/db/dream-repository";
import { localDb } from "@/lib/db/local-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await localDb.getOrCreateDemoUser();
  await ensureSeeded(user.id);
  const dreams = await dreamRepository.list(user.id);
  const recent = dreams.slice(0, 4);

  return (
    <div className="mx-auto max-w-4xl space-y-14">
      <DreamComposer />

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Recent dreams</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Your visual memory timeline
            </p>
          </div>
        </div>

        {recent.length === 0 ? (
          <EmptyDreamState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {recent.map((dream) => (
              <DreamCard key={dream.id} dream={dream} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
