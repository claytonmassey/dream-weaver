"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
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
    <AuthShell
      title="New password"
      subtitle="Choose something you’ll remember."
      footer={
        <p className="auth-switch">
          <Link href="/login">Back to sign in</Link>
        </p>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
        <AuthField id="reset-password" label="New password">
          <PasswordInput
            id="reset-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
            disabled={!token}
          />
        </AuthField>
        <AuthField id="reset-confirm" label="Confirm password">
          <PasswordInput
            id="reset-confirm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
            minLength={6}
            autoComplete="new-password"
            disabled={!token}
          />
        </AuthField>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="submit"
          disabled={loading || !token}
          className="btn-gold w-full rounded-full py-3.5 text-[1.02rem] disabled:opacity-60"
        >
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
