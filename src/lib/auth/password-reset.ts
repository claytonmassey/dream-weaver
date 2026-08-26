import { createHash, randomBytes } from "crypto";
import { prisma, usePrisma } from "@/lib/db/prisma";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_PREFIX = "password-reset:";

type MemoryToken = { identifier: string; token: string; expires: Date };
const memoryTokens = new Map<string, MemoryToken>();

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Prefer AUTH_URL, then the incoming request host, then Vercel URL. */
export function appBaseUrl(request?: Request): string {
  const fromEnv =
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (request) {
    const host =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") ? "http" : "https");
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export async function createPasswordResetToken(
  email: string,
  request?: Request,
): Promise<{
  rawToken: string;
  resetUrl: string;
}> {
  const normalized = email.toLowerCase().trim();
  const identifier = `${RESET_PREFIX}${normalized}`;
  const rawToken = randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expires = new Date(Date.now() + RESET_TTL_MS);

  if (usePrisma()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: { identifier, token, expires },
    });
  } else {
    for (const [key, value] of memoryTokens) {
      if (value.identifier === identifier) memoryTokens.delete(key);
    }
    memoryTokens.set(token, { identifier, token, expires });
  }

  const resetUrl = `${appBaseUrl(request)}/reset-password?token=${encodeURIComponent(rawToken)}`;
  return { rawToken, resetUrl };
}

export async function consumePasswordResetToken(
  rawToken: string,
): Promise<string | null> {
  const token = hashToken(rawToken.trim());
  const now = new Date();

  if (usePrisma()) {
    const row = await prisma.verificationToken.findUnique({ where: { token } });
    if (!row || row.expires < now || !row.identifier.startsWith(RESET_PREFIX)) {
      return null;
    }
    await prisma.verificationToken.delete({ where: { token } });
    return row.identifier.slice(RESET_PREFIX.length);
  }

  const row = memoryTokens.get(token);
  if (!row || row.expires < now || !row.identifier.startsWith(RESET_PREFIX)) {
    return null;
  }
  memoryTokens.delete(token);
  return row.identifier.slice(RESET_PREFIX.length);
}

export async function sendPasswordResetEmail(input: {
  email: string;
  resetUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM || "dreamweava <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      `[password-reset] RESEND_API_KEY not set. Reset link for ${input.email}: ${input.resetUrl}`,
    );
    return { sent: false, reason: "email_not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.email],
        subject: "Reset your dreamweava password",
        html: `
          <p>We received a request to reset your dreamweava password.</p>
          <p><a href="${input.resetUrl}">Choose a new password</a></p>
          <p>This link expires in one hour. If you didn’t ask for this, you can ignore the email.</p>
        `,
        text: `Reset your dreamweava password:\n${input.resetUrl}\n\nThis link expires in one hour.`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[password-reset] Resend failed:", detail);
      return { sent: false, reason: "send_failed" };
    }

    return { sent: true };
  } catch (error) {
    console.error("[password-reset] Resend error:", error);
    return { sent: false, reason: "send_failed" };
  }
}

export function canExposeResetLink(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.DEMO_MODE === "true" ||
    process.env.EXPOSE_RESET_LINK === "true"
  );
}
