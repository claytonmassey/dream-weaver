import Image from "next/image";
import { formatDreamDate } from "@/lib/utils/cn";
import type { Dream } from "@/types/dream";

export function DreamHero({ dream }: { dream: Dream }) {
  return (
    <section className="space-y-4">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[var(--bg-elevated)] sm:aspect-[16/10]">
        {dream.imageUrl ? (
          <Image
            src={dream.imageUrl}
            alt={dream.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
            {dream.imageStatus === "failed"
              ? "Image could not be generated"
              : "Image pending"}
          </div>
        )}
      </div>
      <div className="space-y-2 px-0.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--text-muted)]">
          <time>{formatDreamDate(dream.dreamDate)}</time>
          <span>{dream.mood}</span>
        </div>
        <h1 className="font-display text-2xl leading-tight sm:text-3xl">
          {dream.title}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
          {dream.summary}
        </p>
      </div>
    </section>
  );
}
