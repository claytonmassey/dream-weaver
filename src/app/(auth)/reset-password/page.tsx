"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PasswordInput } from "@/components/auth/PasswordInput";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : "This reset link is missing or invalid.",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Couldn't reset password.");
      }
      router.replace("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
          <h1 className="font-display text-2xl">Choose a new password</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Enter and confirm your new password.
          </p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
            minLength={6}
            autoComplete="new-password"
            disabled={!token}
          />
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength={6}
            autoComplete="new-password"
            disabled={!token}
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={loading || !token}
            className="btn-gold w-full rounded-full py-3 text-sm disabled:opacity-60"
          >
            {loading ? "Saving…" : "Update password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
