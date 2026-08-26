"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";

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
        emailConfigured?: boolean;
      };
      if (!res.ok) {
        throw new Error(data.error || "Couldn't start password reset.");
      }
      setMessage(
        data.message ||
          "If an account exists for that email, you’ll get a reset link shortly.",
      );
      if (data.resetUrl) setResetUrl(data.resetUrl);
      if (data.emailConfigured === false && !data.resetUrl) {
        setError(
          "Email sending isn’t configured on the server. Add RESEND_API_KEY in Vercel.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your email and we’ll send a reset link."
      footer={
        <p className="auth-switch">
          Remembered it?{" "}
          <Link href="/login">Back to sign in</Link>
        </p>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
        <AuthField id="forgot-email" label="Email">
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="auth-input"
            required
            autoComplete="email"
          />
        </AuthField>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {message && <p className="text-sm text-[var(--success)]">{message}</p>}
        {resetUrl && (
          <p className="break-all rounded-2xl border border-white/15 bg-white/5 p-3 text-left text-sm text-[var(--accent)]">
            Dev reset link:{" "}
            <Link href={resetUrl} className="underline">
              Open reset page
            </Link>
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full rounded-full py-3.5 text-[1.02rem] disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
