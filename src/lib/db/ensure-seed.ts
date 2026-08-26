import { dreamRepository } from "@/lib/db/dream-repository";
import { buildSeedDreams } from "@/lib/db/seed-data";
import { isDemoMode } from "@/lib/auth/session";

/**
 * Optionally seeds sample dreams for empty demo accounts.
 * Never runs for real (non-demo) accounts — they start empty and private.
 */
export async function ensureSeeded(userId: string): Promise<void> {
  if (!isDemoMode()) return;
  if (process.env.SEED_DEMO_DREAMS === "false") return;

  const dreams = await dreamRepository.list(userId);
  if (dreams.length > 0) return;
  await dreamRepository.replaceAllDreams(userId, buildSeedDreams(userId));
}
