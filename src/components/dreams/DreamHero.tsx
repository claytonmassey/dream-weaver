import Image from "next/image";
import { MoodBadge } from "@/components/dreams/MoodBadge";
import { formatDreamDate } from "@/lib/utils/cn";
import type { Dream } from "@/types/dream";

export function DreamHero({ dream }: { dream: Dream }) {
  return (
    <section className="animate-fade-up overflow-hidden rounded-[2rem] bg-[var(--bg-elevated)]">
      <div className="relative aspect-[16/9] w-full bg-[#151820] md:aspect-[21/9]">
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
          <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
            {dream.imageStatus === "failed"
              ? "Image could not be generated"
              : "Image pending"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-[#0c0d10]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <time className="text-sm text-white/70">
              {formatDreamDate(dream.dreamDate)}
            </time>
            <MoodBadge mood={dream.mood} />
          </div>
          <h1 className="max-w-3xl font-display text-3xl leading-tight md:text-5xl">
            {dream.title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
            {dream.summary}
          </p>
        </div>
      </div>
    </section>
  );
}
