"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * While a dream image is painting in the background, refresh until ready/failed.
 */
export function DreamImagePoller({
  dreamId,
  imageStatus,
}: {
  dreamId: string;
  imageStatus: "pending" | "ready" | "failed";
}) {
  const router = useRouter();
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (imageStatus !== "pending") return;

    const id = window.setInterval(() => {
      setTicks((t) => t + 1);
      router.refresh();
    }, 4000);

    return () => window.clearInterval(id);
  }, [dreamId, imageStatus, router]);

  if (imageStatus !== "pending") return null;

  return (
    <p className="text-sm text-[var(--text-muted)]" aria-live="polite">
      Painting your dream…{ticks > 0 ? ` (${ticks * 4}s)` : ""}
    </p>
  );
}
