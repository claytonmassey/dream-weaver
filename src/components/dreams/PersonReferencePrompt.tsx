"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { DreamPerson } from "@/types/dream";

export function ReferencePhotoUploader({
  onUploaded,
}: {
  onUploaded: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center transition hover:border-[var(--accent)]/40"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Reference preview"
            className="h-28 w-28 rounded-2xl object-cover"
          />
        ) : (
          <Upload className="h-6 w-6 text-[var(--accent)]" />
        )}
        <div>
          <p className="text-sm font-medium">Upload a photo</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Used only as a private visual reference for this dream
          </p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPreview(URL.createObjectURL(file));
          onUploaded(file);
        }}
      />
    </div>
  );
}

export function PersonReferencePrompt({
  people,
  onContinue,
  onSkip,
}: {
  people: DreamPerson[];
  onContinue: (photos: Record<string, File>) => void;
  onSkip: () => void;
}) {
  const [photos, setPhotos] = useState<Record<string, File>>({});
  const realPeople = people.filter((p) => p.isRealPerson);

  return (
    <div className="animate-fade-up space-y-8 rounded-[2rem] border border-white/5 bg-[var(--bg-elevated)] p-6 md:p-10">
      <div className="space-y-3">
        <h2 className="font-display text-3xl">
          Want them to look like the real person?
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
          Upload a photo and we&apos;ll use it as a visual reference for this
          dream. Photos stay private and are never required.
        </p>
      </div>

      <div className="space-y-6">
        {realPeople.map((person) => (
          <div key={person.id} className="space-y-3">
            <div>
              <p className="font-medium">{person.name}</p>
              {person.relationship && (
                <p className="text-xs capitalize text-[var(--text-muted)]">
                  {person.relationship}
                </p>
              )}
            </div>
            <ReferencePhotoUploader
              onUploaded={(file) =>
                setPhotos((prev) => ({ ...prev, [person.id]: file }))
              }
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onContinue(photos)}
          className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[#1a1612]"
        >
          Continue
          {Object.keys(photos).length > 0 ? " with photo" : ""}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-[var(--text-muted)]"
        >
          Continue without photo
        </button>
      </div>
    </div>
  );
}
