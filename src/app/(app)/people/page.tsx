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
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-4xl">People</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Faces and names that return across your dreams. Continuity analytics
          will grow from this foundation.
        </p>
      </div>

      {people.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          No people detected yet. They&apos;ll appear here as you journal.
        </p>
      ) : (
        <ul className="space-y-3">
          {people.map((person) => {
            const ref = references.find(
              (r) => r.name.toLowerCase() === person.name.toLowerCase(),
            );
            return (
              <li
                key={person.name}
                className="flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-[var(--bg-elevated)] px-5 py-4"
              >
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {person.appearances} appearance
                    {person.appearances === 1 ? "" : "s"}
                    {person.relationship ? ` · ${person.relationship}` : ""}
                    {person.isRealPerson ? " · from your life" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {person.dreamIds.slice(0, 3).map((id) => (
                      <Link
                        key={id}
                        href={`/dream/${id}`}
                        className="text-xs text-[var(--accent)]"
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
