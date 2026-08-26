import { isDemoMode, requireUserId } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { buildSeedDreams } from "@/lib/db/seed-data";
import { NextResponse } from "next/server";

export async function POST() {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  if (!isDemoMode()) {
    return NextResponse.json(
      { error: "Seed is disabled outside demo mode." },
      { status: 403 },
    );
  }

  const dreams = buildSeedDreams(authResult.userId);
  await dreamRepository.replaceAllDreams(authResult.userId, dreams);
  return NextResponse.json({ ok: true, count: dreams.length });
}
