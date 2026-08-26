"use client";

import { useEffect, useState } from "react";
import { KeepDreamPrompt } from "@/components/auth/KeepDreamPrompt";

export function GuestKeepDreamBanner({
  autoOpen = false,
}: {
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  if (dismissed) return null;

  return (
    <>
      {!open && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--accent)]/35 bg-[var(--accent-soft)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-[var(--text)]">
            You’re browsing as a guest. Create an account to keep this dream —
            or continue and risk losing it.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-gold shrink-0 rounded-full px-4 py-2.5 text-sm"
          >
            Keep this dream
          </button>
        </div>
      )}
      <KeepDreamPrompt
        open={open}
        onDismiss={() => {
          setOpen(false);
          setDismissed(true);
        }}
      />
    </>
  );
}
