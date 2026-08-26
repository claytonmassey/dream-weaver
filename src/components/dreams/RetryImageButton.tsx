"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetryImageButton({ dreamId }: { dreamId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            const res = await fetch("/api/dreams/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dreamId }),
            });
            if (!res.ok) {
              const body = (await res.json().catch(() => ({}))) as {
                error?: string;
              };
              setError(body.error || "Retry failed.");
              return;
            }
            router.replace(`/dream/${dreamId}`);
            router.refresh();
          } catch {
            setError("Retry failed.");
          } finally {
            setLoading(false);
          }
        }}
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#1a1612] disabled:opacity-60"
      >
        {loading ? "Retrying…" : "Retry image"}
      </button>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
