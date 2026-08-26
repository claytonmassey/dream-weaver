"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";

function GoogleIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.5.4-2.9 2.2C5 19.7 8.2 21.6 12 21.6c2.4 0 4.4-.8 5.9-2.1l-3.1-2.4c-.8.6-1.9.9-2.8.9-2.2 0-4-1.5-4.7-3.5z"
      />
      <path
        fill="#4A90E2"
        d="M3.2 7.1C2.4 8.6 2 10.2 2 12s.4 3.4 1.2 4.9l3.4-2.6C6.2 13.5 6 12.8 6 12s.2-1.5.5-2.2L3.2 7.1z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.4c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.4 2.7 14.4 2 12 2 8.2 2 5 3.9 3.2 7.1l3.4 2.6C7.9 6.9 9.8 5.4 12 5.4z"
      />
    </svg>
  );
}

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
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (configError) {
      return "Server storage isn’t configured. Set DATABASE_URL and AUTH_SECRET in Vercel.";
    }
    if (authError === "OAuthAccountNotLinked") {
      return "That Google email already has a password account. Sign in with email, or use Forgot password.";
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

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((providers: Record<string, unknown>) => {
        if (!cancelled) setGoogleAvailable(Boolean(providers.google));
      })
      .catch(() => {
        if (!cancelled) setGoogleAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function callbackDest() {
    const callback = searchParams.get("callbackUrl");
    return callback && callback.startsWith("/") && !callback.startsWith("//")
      ? callback
      : "/";
  }

  async function finishSignIn(normalizedEmail: string) {
    const result = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
      callbackUrl: callbackDest(),
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

    window.location.assign(callbackDest());
  }

  async function onGoogle() {
    setLoading(true);
    setError(null);
    await signIn("google", { callbackUrl: callbackDest() });
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
      <div className="space-y-5">
        {googleAvailable && (
          <div className="space-y-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => void onGoogle()}
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] py-3.5 text-[0.95rem] font-medium text-[var(--text)] transition hover:bg-white/[0.1] disabled:opacity-60"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                or email
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </div>
        )}

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
      </div>
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
