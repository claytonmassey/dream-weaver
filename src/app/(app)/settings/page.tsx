"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Privacy controls for a journal that may hold intimate memories.
        </p>
      </div>

      <section className="space-y-4 rounded-[2rem] border border-white/5 bg-[var(--bg-elevated)] p-6">
        <h2 className="font-display text-xl">Account</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {session?.user?.email
            ? `Signed in as ${session.user.email}`
            : "Using demo mode (demo@dreamline.app). Sign in to bind dreams to your account."}
        </p>
        <div className="flex flex-wrap gap-3">
          {!session?.user && (
            <button
              type="button"
              onClick={() => void signIn(undefined, { callbackUrl: "/" })}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#1a1612]"
            >
              Sign in
            </button>
          )}
          {session?.user && (
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm"
            >
              Sign out
            </button>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-[2rem] border border-white/5 bg-[var(--bg-elevated)] p-6">
        <h2 className="font-display text-xl">Demo data</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Reset the local demo store with five sample dreams.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await fetch("/api/seed", { method: "POST" });
            setMessage("Seed data restored.");
            setLoading(false);
            router.refresh();
          }}
          className="rounded-full border border-white/10 px-5 py-2.5 text-sm"
        >
          {loading ? "Seeding…" : "Reseed demo dreams"}
        </button>
      </section>

      <section className="space-y-4 rounded-[2rem] border border-[var(--danger)]/20 bg-[var(--bg-elevated)] p-6">
        <h2 className="font-display text-xl text-[var(--danger)]">
          Danger zone
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Delete your account and all associated dreams, audio, images, and
          reference photos from this environment.
        </p>
        <button
          type="button"
          onClick={async () => {
            if (
              !confirm(
                "Permanently delete your account and all dream data?",
              )
            ) {
              return;
            }
            await fetch("/api/account", { method: "DELETE" });
            await signOut({ callbackUrl: "/login" });
          }}
          className="rounded-full border border-[var(--danger)]/40 px-5 py-2.5 text-sm text-[var(--danger)]"
        >
          Delete account
        </button>
      </section>

      {message && (
        <p className="text-sm text-[var(--success)]">{message}</p>
      )}
    </div>
  );
}
