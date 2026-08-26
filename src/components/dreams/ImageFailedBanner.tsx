"use client";

import { useEffect, useState } from "react";
import { RetryImageButton } from "@/components/dreams/RetryImageButton";

export function ImageFailedBanner({ dreamId }: { dreamId: string }) {
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    const key = `dream-image-error:${dreamId}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      setDetail(stored);
      sessionStorage.removeItem(key);
    }
  }, [dreamId]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--danger)]/30 bg-[var(--bg-elevated)] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
      <div className="space-y-1">
        <p className="text-sm text-[var(--text-muted)]">
          Your dream was saved, but the image couldn&apos;t be created.
        </p>
        {detail ? (
          <p className="whitespace-pre-wrap text-xs text-[var(--danger)]">
            {detail}
          </p>
        ) : null}
      </div>
      <RetryImageButton dreamId={dreamId} />
    </div>
  );
}
