"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetryImageButton({ dreamId }: { dreamId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/dreams/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dreamId }),
        });
        setLoading(false);
        router.refresh();
      }}
      className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#1a1612] disabled:opacity-60"
    >
      {loading ? "Retrying…" : "Retry image"}
    </button>
  );
}
