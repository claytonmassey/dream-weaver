import Link from "next/link";
import { notFound } from "next/navigation";
import { DreamEventList } from "@/components/dreams/DreamEventList";
import { DreamHero } from "@/components/dreams/DreamHero";
import { ImageFailedBanner } from "@/components/dreams/ImageFailedBanner";
import { DeleteDreamButton } from "@/components/dreams/DeleteDreamButton";
import { requirePageUser } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { ensureSeeded } from "@/lib/db/ensure-seed";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ imageFailed?: string }>;
};

export default async function DreamDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { imageFailed } = await searchParams;
  const user = await requirePageUser();
  await ensureSeeded(user.id);
  const dream = await dreamRepository.get(user.id, id);
  if (!dream) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-8 sm:space-y-10 lg:max-w-5xl lg:space-y-12">
      {(imageFailed || dream.imageStatus === "failed") && (
        <ImageFailedBanner dreamId={dream.id} />
      )}

      <DreamHero dream={dream} />

      <section className="space-y-3 sm:space-y-4">
        <h2 className="font-display text-xl sm:text-2xl">Your Dream</h2>
        <p className="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-[var(--text-muted)] sm:text-base">
          {dream.cleanedTranscript}
        </p>
      </section>

      <section className="space-y-4 sm:space-y-6">
        <h2 className="font-display text-xl sm:text-2xl">Key Moments</h2>
        <DreamEventList events={dream.events} />
      </section>

      {(dream.locations.length > 0 ||
        dream.objects.length > 0 ||
        dream.people.length > 0) && (
        <section className="grid gap-4 rounded-xl bg-[var(--bg-elevated)] p-4 sm:grid-cols-3 sm:p-5">
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
              Places
            </h3>
            <p className="text-sm">{dream.locations.join(", ") || "—"}</p>
          </div>
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
              Objects
            </h3>
            <p className="text-sm">{dream.objects.join(", ") || "—"}</p>
          </div>
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
              People
            </h3>
            <p className="text-sm">
              {dream.people.map((p) => p.name).join(", ") || "—"}
            </p>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-white/5 pt-6 sm:flex-row sm:flex-wrap sm:pt-8">
        <Link
          href="/timeline"
          className="flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm text-[var(--text-muted)]"
        >
          Back to timeline
        </Link>
        <DeleteDreamButton dreamId={dream.id} />
      </div>
    </div>
  );
}
