"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteReferenceButton({
  referenceId,
}: {
  referenceId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch(`/api/people?referenceId=${referenceId}`, {
          method: "DELETE",
        });
        setLoading(false);
        router.refresh();
      }}
      className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs text-[var(--text-muted)]"
    >
      {loading ? "Removing…" : "Delete photo"}
    </button>
  );
}
