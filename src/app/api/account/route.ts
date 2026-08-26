import { requireUserId } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { userStore } from "@/lib/db/user-store";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name can’t be empty.")
    .max(80)
    .optional()
    .nullable(),
});

export async function PATCH(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await request.json();
    const parsed = profileSchema.parse(body);
    const updated = await userStore.updateProfile(authResult.userId, {
      name: parsed.name === undefined ? undefined : parsed.name,
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Couldn't update profile." },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        image: updated.image,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid profile data." },
        { status: 400 },
      );
    }
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Couldn't update profile." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  await dreamRepository.deleteAccount(authResult.userId);
  return NextResponse.json({ ok: true });
}
