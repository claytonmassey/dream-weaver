import { requireUserId } from "@/lib/auth/session";
import { auth } from "@/lib/auth";
import { userStore } from "@/lib/db/user-store";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z
  .object({
    currentPassword: z.string().min(1).max(100).optional(),
    newPassword: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const session = await auth();
    const email = session?.user?.email?.toLowerCase().trim();
    if (!email) {
      return NextResponse.json(
        { error: "No email on this account." },
        { status: 400 },
      );
    }

    const user = await userStore.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    if (user.passwordHash) {
      if (!parsed.currentPassword) {
        return NextResponse.json(
          { error: "Enter your current password." },
          { status: 400 },
        );
      }
      const ok = await bcrypt.compare(parsed.currentPassword, user.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 },
        );
      }
    }

    const passwordHash = await bcrypt.hash(parsed.newPassword, 10);
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
      const mismatch = error.issues.some((i) =>
        i.path.includes("confirmPassword"),
      );
      return NextResponse.json(
        {
          error: mismatch
            ? "Passwords do not match."
            : "Enter a password of at least 6 characters.",
        },
        { status: 400 },
      );
    }
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Couldn't update password." },
      { status: 500 },
    );
  }
}
