"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";

type Mode = "signup" | "signin";

/**
 * Shown after a guest creates a dream image — invite them to keep it permanently.
 */
export function KeepDreamPrompt({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function claimGuest() {
    try {
      await fetch("/api/auth/claim-guest", { method: "POST" });
    } catch {
      // Non-fatal
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const normalizedEmail = email.toLowerCase().trim();

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            confirmPassword,
            name: name.trim() || undefined,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Couldn't create account.");
        }
      }

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });
      if (result?.error || !result?.ok) {
        throw new Error(
          mode === "signup"
            ? "Account created, but sign-in failed. Try signing in."
            : "Invalid email or password.",
        );
      }

      await claimGuest();
      onDismiss();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 px-4 pb-8 pt-16 sm:items-center sm:pb-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onDismiss}
      />
      <div className="glass relative z-10 w-full max-w-sm space-y-5 rounded-3xl border border-white/10 p-6 shadow-2xl">
        <div className="space-y-2 text-center">
          <h2 className="font-display text-2xl">Keep this dream?</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Create a free account to save it permanently. You can stay logged
            out, but this dream may be lost.
          </p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 outline-none placeholder:text-[var(--text-muted)]"
              autoComplete="name"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 outline-none placeholder:text-[var(--text-muted)]"
            autoComplete="email"
          />
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
          />
          {mode === "signup" && (
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          )}
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full rounded-full py-3 text-sm disabled:opacity-60"
          >
            {loading
              ? mode === "signup"
                ? "Creating…"
                : "Signing in…"
              : mode === "signup"
                ? "Create account & keep it"
                : "Sign in & keep it"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setConfirmPassword("");
            setMode((m) => (m === "signup" ? "signin" : "signup"));
          }}
          className="w-full text-sm text-[var(--text-muted)]"
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "Need an account? Create one"}
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full text-sm text-[var(--text-muted)]"
        >
          Continue without saving — I may lose this dream
        </button>
      </div>
    </div>
  );
}
