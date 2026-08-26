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
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md space-y-8 rounded-[2rem] border border-white/5 bg-[var(--bg-elevated)] p-8">
        <div className="space-y-2 text-center">
          <Link href="/" className="font-display text-3xl">
            Dreamline
          </Link>
          <p className="text-sm text-[var(--text-muted)]">
            A private place for the dreams you want to keep
          </p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="text-[var(--text-muted)]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              required
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="text-[var(--text-muted)]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              required
            />
          </label>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--accent)] py-3 text-sm font-medium text-[#1a1612]"
          >
            {loading ? "Signing in…" : "Continue with email"}
          </button>
        </form>

        <button
          type="button"
          onClick={() =>
            void signIn("google", { callbackUrl: "/" }).catch(() =>
              setError(
                "Google sign-in requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
              ),
            )
          }
          className="w-full rounded-full border border-white/10 py-3 text-sm"
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
