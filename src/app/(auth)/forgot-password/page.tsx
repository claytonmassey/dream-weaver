"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetUrl(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        resetUrl?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Couldn't start password reset.");
      }
      setMessage(
        data.message ||
          "If an account exists for that email, you’ll get a reset link shortly.",
      );
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="glass w-full max-w-sm space-y-6 rounded-3xl border border-white/10 p-6 sm:p-8">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <BrandLogo linked={false} height={72} className="mx-auto" />
          </div>
          <h1 className="font-display text-2xl">Reset password</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Enter your email and we’ll send a reset link.
          </p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 outline-none placeholder:text-[var(--text-muted)]"
            required
            autoComplete="email"
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          {message && (
            <p className="text-sm text-[var(--success)]">{message}</p>
          )}
          {resetUrl && (
            <p className="break-all rounded-xl border border-white/10 bg-black/20 p-3 text-left text-sm text-[var(--accent)]">
              Dev reset link:{" "}
              <Link href={resetUrl} className="underline">
                Open reset page
              </Link>
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full rounded-full py-3 text-sm disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <Link
          href="/login"
          className="block w-full py-2 text-center text-sm text-[var(--text-muted)]"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
