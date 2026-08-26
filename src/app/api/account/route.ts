import { requireUserId } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { NextResponse } from "next/server";

export async function DELETE() {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  await dreamRepository.deleteAccount(authResult.userId);
  return NextResponse.json({ ok: true });
}
