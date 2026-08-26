"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";

function LoginForm() {
  const searchParams = useSearchParams();
  const configError = searchParams.get("error") === "config";
  const authError = searchParams.get("error");
  const resetOk = searchParams.get("reset") === "1";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    if (configError) {
      return "Server storage isn’t configured. Set DATABASE_URL and AUTH_SECRET in Vercel.";
    }
    if (authError && authError !== "config") {
      return "Sign-in failed. Check your email and password, then try again.";
    }
    return null;
  });
  const [info, setInfo] = useState<string | null>(
    resetOk ? "Password updated. Sign in with your new password." : null,
  );
  const [loading, setLoading] = useState(false);

  async function finishSignIn(normalizedEmail: string) {
    const result = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    if (result?.error || !result?.ok) {
      throw new Error(
        mode === "signup"
          ? "Account created, but sign-in failed. Try signing in."
          : "Invalid email or password.",
      );
    }

    const nextUrl = result.url ?? "/";
    if (nextUrl.includes("/api/auth/error") || /[?&]error=/.test(nextUrl)) {
      throw new Error(
        mode === "signup"
          ? "Account created, but sign-in failed. Try signing in."
          : "Sign-in failed. Please try again.",
      );
    }

    // Hard navigation so the session cookie is included on the next request.
    const callback = searchParams.get("callbackUrl");
    const dest =
      callback && callback.startsWith("/") && !callback.startsWith("//")
        ? callback
        : "/";
    window.location.assign(dest);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

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
        await finishSignIn(normalizedEmail);
        return;
      }

      await finishSignIn(normalizedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={mode === "signin" ? "Welcome back" : "Create account"}
      subtitle={
        mode === "signin"
          ? "Sign in to your private dream journal."
          : "A quiet place for the dreams you want to keep."
      }
      footer={
        <p className="auth-switch">
          {mode === "signin" ? "Need an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setInfo(null);
              setConfirmPassword("");
              setMode((m) => (m === "signin" ? "signup" : "signin"));
            }}
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
        {mode === "signup" && (
          <AuthField id="auth-name" label="Name" hint="(optional)">
            <input
              id="auth-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="auth-input"
              autoComplete="name"
            />
          </AuthField>
        )}
        <AuthField id="auth-email" label="Email">
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="auth-input"
            required
            autoComplete="email"
          />
        </AuthField>
        <AuthField id="auth-password" label="Password">
          <PasswordInput
            id="auth-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
          />
        </AuthField>
        {mode === "signup" && (
          <AuthField id="auth-confirm" label="Confirm password">
            <PasswordInput
              id="auth-confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </AuthField>
        )}

        {mode === "signin" && (
          <div className="-mt-1 flex justify-end">
            <Link href="/forgot-password" className="auth-link text-sm">
              Forgot password?
            </Link>
          </div>
        )}

        {info && <p className="text-sm text-[var(--success)]">{info}</p>}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-gold mt-1 w-full rounded-full py-3.5 text-[1.02rem] disabled:opacity-60"
        >
          {loading
            ? mode === "signup"
              ? "Creating…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <LoginForm />
    </Suspense>
  );
}
