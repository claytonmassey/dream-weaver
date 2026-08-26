import { requireUserId } from "@/lib/auth/session";
import { localDb } from "@/lib/db/local-store";
import { buildSeedDreams } from "@/lib/db/seed-data";
import { NextResponse } from "next/server";

export async function POST() {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const dreams = buildSeedDreams(authResult.userId);
  await localDb.replaceAllDreams(authResult.userId, dreams);
  return NextResponse.json({ ok: true, count: dreams.length });
}
