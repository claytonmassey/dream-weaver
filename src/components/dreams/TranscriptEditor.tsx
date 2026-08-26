"use client";

export function TranscriptEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={10}
      className="w-full resize-none bg-transparent text-lg leading-relaxed outline-none"
      aria-label="Dream transcript"
      placeholder="Your dream"
    />
  );
}
