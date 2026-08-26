import Image from "next/image";
import Link from "next/link";
import { MoodBadge } from "@/components/dreams/MoodBadge";
import { formatDreamDate } from "@/lib/utils/cn";
import type { DreamListItem } from "@/types/dream";
import { cn } from "@/lib/utils/cn";

export function DreamCard({
  dream,
  className,
}: {
  dream: DreamListItem;
  className?: string;
}) {
  return (
    <Link
      href={`/dream/${dream.id}`}
      className={cn(
        "group block overflow-hidden rounded-3xl bg-[var(--bg-elevated)] transition hover:bg-[var(--bg-soft)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#151820]">
        {dream.imageUrl ? (
          <Image
            src={dream.imageUrl}
            alt={dream.title}
            fill
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
            {dream.imageStatus === "failed"
              ? "Image pending retry"
              : "Rendering…"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <MoodBadge mood={dream.mood} />
        </div>
      </div>
      <div className="space-y-2 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-snug">{dream.title}</h3>
          <time className="shrink-0 text-xs text-[var(--text-muted)]">
            {formatDreamDate(dream.dreamDate)}
          </time>
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
          {dream.summary}
        </p>
        {dream.people.length > 0 && (
          <p className="text-xs text-[var(--accent)]">
            {dream.people.map((p) => p.name).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
