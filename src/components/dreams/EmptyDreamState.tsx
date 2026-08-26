import Link from "next/link";
import { Moon } from "lucide-react";

export function EmptyDreamState() {
  return (
    <div className="animate-fade-up rounded-3xl border border-white/5 bg-[var(--bg-elevated)] px-8 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]">
        <Moon className="h-7 w-7 text-[var(--accent)]" />
      </div>
      <h2 className="font-display text-2xl text-[var(--text)]">
        Your timeline is waiting
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
        Record your first dream — type it, speak it, or upload audio — and
        Dreamline will help you remember how it felt.
      </p>
      <Link
        href="/dream/new"
        className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[#1a1612] transition hover:brightness-110"
      >
        Remember my first dream
      </Link>
    </div>
  );
}
