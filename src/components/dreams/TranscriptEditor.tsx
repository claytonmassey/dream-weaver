"use client";

export function TranscriptEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-2xl">Your transcript</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Edit freely — this becomes the written memory of your dream.
        </p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="w-full resize-y rounded-3xl border border-white/5 bg-[var(--bg-elevated)] px-5 py-4 text-base leading-relaxed text-[var(--text)] outline-none ring-[var(--accent)]/40 placeholder:text-[var(--text-muted)] focus:ring-2"
        placeholder="What happened in the dream…"
      />
    </div>
  );
}
