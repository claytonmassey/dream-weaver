import { HomeDashboard } from "@/components/dreams/HomeDashboard";
import { requirePageUser } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { ensureSeeded } from "@/lib/db/ensure-seed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requirePageUser();
  await ensureSeeded(user.id);
  const dreams = await dreamRepository.list(user.id);

  return <HomeDashboard userName={user.name} dreams={dreams} />;
}
