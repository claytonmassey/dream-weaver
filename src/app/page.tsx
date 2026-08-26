import { DreamComposer } from "@/components/dreams/DreamComposer";
import { DreamCard } from "@/components/dreams/DreamCard";
import { EmptyDreamState } from "@/components/dreams/EmptyDreamState";
import { ensureSeeded } from "@/lib/db/ensure-seed";
import { dreamRepository } from "@/lib/db/dream-repository";
import { localDb } from "@/lib/db/local-store";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await localDb.getOrCreateDemoUser();
  await ensureSeeded(user.id);
  const dreams = await dreamRepository.list(user.id);
  const recent = dreams.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-md space-y-12">
      <DreamComposer />

      <section className="space-y-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm text-[var(--text-muted)]">Recent</h2>
          {recent.length > 0 && (
            <Link href="/timeline" className="text-sm text-[var(--text-muted)]">
              All
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyDreamState />
        ) : (
          <div className="flex flex-col gap-8">
            {recent.map((dream) => (
              <DreamCard key={dream.id} dream={dream} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
