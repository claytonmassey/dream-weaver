import { dreamRepository } from "@/lib/db/dream-repository";
import { buildSeedDreams } from "@/lib/db/seed-data";
import { usePrisma } from "@/lib/db/prisma";

/**
 * Optionally seeds sample dreams for empty demo accounts.
 * Skipped when using Postgres with DEMO_MODE=false (real accounts start empty).
 */
export async function ensureSeeded(userId: string): Promise<void> {
  if (usePrisma() && process.env.DEMO_MODE === "false") {
    return;
  }
  if (process.env.SEED_DEMO_DREAMS === "false") {
    return;
  }

  const dreams = await dreamRepository.list(userId);
  if (dreams.length > 0) return;
  await dreamRepository.replaceAllDreams(userId, buildSeedDreams(userId));
}
