import {
  canExposeResetLink,
  createPasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/auth/password-reset";
import { usePrisma } from "@/lib/db/prisma";
import { userStore } from "@/lib/db/user-store";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    if (process.env.VERCEL === "1" && !usePrisma()) {
      return NextResponse.json(
        {
          error:
            "Password reset needs Postgres. Set DATABASE_URL on Vercel and redeploy.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { email } = schema.parse(body);
    const normalized = email.toLowerCase().trim();

    // Always return a generic success response to avoid email enumeration.
    const generic = {
      ok: true,
      message:
        "If an account exists for that email, you’ll get a reset link shortly.",
    };

    const user = await userStore.findByEmail(normalized);
    // Allow Google-only accounts to set a password via reset.
    if (!user) {
      return NextResponse.json(generic);
    }

    const { resetUrl } = await createPasswordResetToken(normalized, request);
    const emailResult = await sendPasswordResetEmail({
      email: normalized,
      resetUrl,
    });

    if (!emailResult.sent && emailResult.reason === "email_not_configured") {
      if (canExposeResetLink()) {
        return NextResponse.json({
          ...generic,
          resetUrl,
          emailConfigured: false,
          message:
            "Email isn’t configured — use this reset link (dev). Add RESEND_API_KEY on Vercel for real email.",
        });
      }
      return NextResponse.json(
        {
          error:
            "Password reset email isn’t configured. Add RESEND_API_KEY and EMAIL_FROM on Vercel, set AUTH_URL=https://www.dreamweava.com, then redeploy.",
        },
        { status: 503 },
      );
    }

    if (!emailResult.sent) {
      if (canExposeResetLink()) {
        return NextResponse.json({
          ...generic,
          resetUrl,
          emailConfigured: false,
          message: "Email send failed — use this reset link (dev).",
        });
      }
      return NextResponse.json(
        {
          error:
            "Couldn't send the reset email. Check RESEND_API_KEY / EMAIL_FROM, then try again.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ...generic,
      emailConfigured: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Couldn't start password reset." },
      { status: 500 },
    );
  }
}
