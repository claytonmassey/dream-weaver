import { consumePasswordResetToken } from "@/lib/auth/password-reset";
import { userStore } from "@/lib/db/user-store";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z
  .object({
    token: z.string().min(20),
    password: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    const email = await consumePasswordResetToken(parsed.token);
    if (!email) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    const user = await userStore.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const updated = await userStore.updatePassword(email, passwordHash);
    if (!updated) {
      return NextResponse.json(
        { error: "Couldn't update password." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const mismatch = error.issues.some((i) => i.path.includes("confirmPassword"));
      return NextResponse.json(
        {
          error: mismatch
            ? "Passwords do not match."
            : "Enter a password of at least 6 characters.",
        },
        { status: 400 },
      );
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Couldn't reset password." },
      { status: 500 },
    );
  }
}
