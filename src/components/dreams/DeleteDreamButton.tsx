"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteDreamButton({ dreamId }: { dreamId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full border border-[var(--danger)]/40 px-5 py-2.5 text-sm text-[var(--danger)]"
      >
        Delete dream
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-[var(--text-muted)]">Delete forever?</span>
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          await fetch(`/api/dreams/${dreamId}`, { method: "DELETE" });
          router.push("/timeline");
          router.refresh();
        }}
        className="rounded-full bg-[var(--danger)] px-4 py-2 text-sm text-white"
      >
        {loading ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full border border-white/10 px-4 py-2 text-sm"
      >
        Cancel
      </button>
    </div>
  );
}
