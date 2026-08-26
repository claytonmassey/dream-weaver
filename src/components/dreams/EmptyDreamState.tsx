import Link from "next/link";

export function EmptyDreamState() {
  return (
    <div className="py-12 text-center">
      <h2 className="font-display text-xl">No dreams yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-muted)]">
        Record your first dream to start your timeline.
      </p>
      <Link
        href="/dream/new"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[#1a1612]"
      >
        Add a dream
      </Link>
    </div>
  );
}
