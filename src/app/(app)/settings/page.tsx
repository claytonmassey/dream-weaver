"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-lg space-y-8 sm:max-w-2xl">
      <div>
        <h1 className="font-display text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Your dreams are private to this account.
        </p>
      </div>

      <section className="space-y-3 rounded-xl bg-[var(--bg-elevated)] p-5">
        <h2 className="text-sm text-[var(--text-muted)]">Account</h2>
        {session?.user ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--text)]">
              {session.user.name || "Dreamer"}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              {session.user.email}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Not signed in.</p>
        )}
        <div className="flex flex-wrap gap-3 pt-1">
          {!session?.user && (
            <button
              type="button"
              onClick={() => {
                window.location.href = "/login";
              }}
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

      {process.env.NEXT_PUBLIC_DEMO_TOOLS === "true" && (
      <section className="space-y-3 rounded-xl bg-[var(--bg-elevated)] p-5">
        <h2 className="text-sm text-[var(--text-muted)]">Demo data</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Reset with sample dreams.
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
          className="rounded-full bg-white/5 px-5 py-2.5 text-sm"
        >
          {loading ? "Seeding…" : "Reseed demo dreams"}
        </button>
      </section>
      )}

      <section className="space-y-3 rounded-xl bg-[var(--bg-elevated)] p-5">
        <h2 className="text-sm text-[var(--danger)]">Danger zone</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Delete your account and all dream data.
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
          className="text-sm text-[var(--danger)]"
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
