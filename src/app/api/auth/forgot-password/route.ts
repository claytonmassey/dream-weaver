import {
  canExposeResetLink,
  createPasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/auth/password-reset";
import { userStore } from "@/lib/db/user-store";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
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
    if (!user?.passwordHash) {
      return NextResponse.json(generic);
    }

    const { resetUrl } = await createPasswordResetToken(normalized);
    const emailResult = await sendPasswordResetEmail({
      email: normalized,
      resetUrl,
    });

    if (canExposeResetLink() && !emailResult.sent) {
      return NextResponse.json({
        ...generic,
        resetUrl,
        emailConfigured: false,
      });
    }

    return NextResponse.json({
      ...generic,
      emailConfigured: emailResult.sent,
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
