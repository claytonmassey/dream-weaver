"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setName(session?.user?.name ?? "");
  }, [session?.user?.name]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });
      const data = (await res.json()) as { error?: string; user?: { name?: string | null } };
      if (!res.ok) throw new Error(data.error || "Couldn't update profile.");
      await update({ name: data.user?.name ?? (name.trim() || null) });
      setMessage("Profile updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangingPassword(true);
    setError(null);
    setMessage(null);
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword,
          confirmPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Couldn't update password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update password.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 sm:max-w-2xl">
      <div>
        <h1 className="font-display text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Your dreams are private to this account.
        </p>
      </div>

      {session?.user ? (
        <form
          onSubmit={(e) => void saveProfile(e)}
          className="space-y-4 rounded-xl bg-[var(--bg-elevated)] p-5"
        >
          <h2 className="text-sm text-[var(--text-muted)]">Edit profile</h2>
          <div className="space-y-2">
            <label htmlFor="profile-name" className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Name
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="auth-input w-full"
              autoComplete="name"
              maxLength={80}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Email
            </p>
            <p className="text-sm text-[var(--text)]">{session.user.email}</p>
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#1a1612] disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </form>
      ) : (
        <section className="space-y-3 rounded-xl bg-[var(--bg-elevated)] p-5">
          <p className="text-sm text-[var(--text-muted)]">Not signed in.</p>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#1a1612]"
          >
            Sign in
          </button>
        </section>
      )}

      {session?.user && (
        <form
          onSubmit={(e) => void changePassword(e)}
          className="space-y-4 rounded-xl bg-[var(--bg-elevated)] p-5"
        >
          <div>
            <h2 className="text-sm text-[var(--text-muted)]">Password</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Set or change a password for email sign-in. Google accounts can add
              one here too.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="current-password" className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Current password
            </label>
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Leave blank if you signed up with Google"
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
              New password
            </label>
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Confirm new password
            </label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {changingPassword ? "Updating…" : "Update password"}
          </button>
        </form>
      )}

      {session?.user && (
        <section className="space-y-3 rounded-xl bg-[var(--bg-elevated)] p-5">
          <h2 className="text-sm text-[var(--text-muted)]">Session</h2>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm"
          >
            Sign out
          </button>
        </section>
      )}

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

      {session?.user && (
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
      )}

      {message && <p className="text-sm text-[var(--success)]">{message}</p>}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
