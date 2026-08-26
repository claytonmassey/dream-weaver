"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@dreamline.app");
  const [password, setPassword] = useState("dreamline");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    window.location.href = result?.url ?? "/";
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <Link href="/" className="font-display text-2xl">
            Dreamline
          </Link>
          <p className="text-sm text-[var(--text-muted)]">Sign in</p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl bg-[var(--bg-elevated)] px-4 py-3 outline-none"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl bg-[var(--bg-elevated)] px-4 py-3 outline-none"
            required
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--accent)] py-3 text-sm font-medium text-[#1a1612]"
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>

        <button
          type="button"
          onClick={() =>
            void signIn("google", { callbackUrl: "/" }).catch(() =>
              setError("Google sign-in is not configured."),
            )
          }
          className="w-full py-2 text-sm text-[var(--text-muted)]"
        >
          Continue with Google
        </button>

        <p className="text-center text-xs text-[var(--text-muted)]">
          Demo: demo@dreamline.app / dreamline
        </p>
      </div>
    </div>
  );
}
