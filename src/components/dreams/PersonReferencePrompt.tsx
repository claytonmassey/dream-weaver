"use client";

import { useRef, useState } from "react";
import type { DreamPerson } from "@/types/dream";

export function ReferencePhotoUploader({
  onUploaded,
}: {
  onUploaded: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-3 rounded-xl bg-[var(--bg-elevated)] px-4 py-3 text-left"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Reference preview"
            className="h-12 w-12 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-xs text-[var(--text-muted)]">
            Photo
          </span>
        )}
        <span className="text-sm text-[var(--text-muted)]">
          {preview ? "Added" : "Add photo"}
        </span>
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl leading-tight">
          Look like them?
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Optional photo reference.
        </p>
      </div>

      <div className="space-y-4">
        {realPeople.map((person) => (
          <div key={person.id} className="space-y-2">
            <p className="text-sm">{person.name}</p>
            <ReferencePhotoUploader
              onUploaded={(file) =>
                setPhotos((prev) => ({ ...prev, [person.id]: file }))
              }
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => onContinue(photos)}
          className="min-h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[#1a1612]"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 px-3 text-sm text-[var(--text-muted)]"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
