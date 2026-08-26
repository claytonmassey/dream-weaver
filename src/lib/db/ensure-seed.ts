import { localDb } from "@/lib/db/local-store";
import { buildSeedDreams } from "@/lib/db/seed-data";

/**
 * Seeds demo dreams once per local store so the timeline looks complete.
 */
export async function ensureSeeded(userId: string): Promise<void> {
  const dreams = await localDb.listDreams(userId);
  if (dreams.length > 0) return;
  await localDb.replaceAllDreams(userId, buildSeedDreams(userId));
}
