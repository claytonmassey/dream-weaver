import Image from "next/image";
import Link from "next/link";
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
      className={cn("group block active:opacity-80", className)}
    >
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-[var(--bg-elevated)]">
        {dream.imageUrl ? (
          <Image
            src={dream.imageUrl}
            alt={dream.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 400px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
            {dream.imageStatus === "failed" ? "Image pending" : "…"}
          </div>
        )}
      </div>
      <div className="space-y-1 px-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg leading-snug">{dream.title}</h3>
          <time className="shrink-0 text-xs text-[var(--text-muted)]">
            {formatDreamDate(dream.dreamDate)}
          </time>
        </div>
        <p className="line-clamp-2 text-sm text-[var(--text-muted)]">
          {dream.summary}
        </p>
      </div>
    </Link>
  );
}
