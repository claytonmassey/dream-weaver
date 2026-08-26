import Link from "next/link";
import { dreamRepository } from "@/lib/db/dream-repository";
import { ensureSeeded } from "@/lib/db/ensure-seed";
import { localDb } from "@/lib/db/local-store";
import { DeleteReferenceButton } from "@/components/dreams/DeleteReferenceButton";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const user = await localDb.getOrCreateDemoUser();
  await ensureSeeded(user.id);
  const people = await dreamRepository.listPeople(user.id);
  const references = await dreamRepository.listPersonReferences(user.id);

  return (
    <div className="mx-auto max-w-lg space-y-6 lg:max-w-2xl">
      <div>
        <h1 className="font-display text-3xl">People</h1>
      </div>

      {people.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          No people detected yet.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {people.map((person) => {
            const ref = references.find(
              (r) => r.name.toLowerCase() === person.name.toLowerCase(),
            );
            return (
              <li
                key={person.name}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-sm font-medium">{person.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {person.appearances} appearance
                    {person.appearances === 1 ? "" : "s"}
                    {person.relationship ? ` · ${person.relationship}` : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {person.dreamIds.slice(0, 2).map((id) => (
                      <Link
                        key={id}
                        href={`/dream/${id}`}
                        className="text-xs text-[var(--text-muted)] underline-offset-2 hover:underline"
                      >
                        View dream
                      </Link>
                    ))}
                  </div>
                </div>
                {ref && <DeleteReferenceButton referenceId={ref.id} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
