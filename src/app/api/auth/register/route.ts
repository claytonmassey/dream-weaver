import { userStore } from "@/lib/db/user-store";
import { prisma, usePrisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
    name: z.string().min(1).max(80).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);
    const email = parsed.email.toLowerCase().trim();

    const existing = await userStore.findByEmail(email);
    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    if (existing) {
      if (usePrisma()) {
        await prisma.user.update({
          where: { email },
          data: {
            passwordHash,
            name: parsed.name ?? existing.name,
          },
        });
      } else {
        await userStore.updatePassword(email, passwordHash);
      }
    } else {
      await userStore.create({
        email,
        name: parsed.name,
        passwordHash,
      });
    }

    return NextResponse.json({ ok: true, email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const mismatch = error.issues.some((i) =>
        i.path.includes("confirmPassword"),
      );
      return NextResponse.json(
        {
          error: mismatch
            ? "Passwords do not match."
            : "Enter a valid email and a password of at least 6 characters.",
        },
        { status: 400 },
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Couldn't create account." },
      { status: 500 },
    );
  }
}
