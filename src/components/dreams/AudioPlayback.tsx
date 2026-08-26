"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function AudioPlayback({
  blob,
  url,
}: {
  blob?: Blob | null;
  url?: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState<string | null>(url ?? null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    if (url) setSrc(url);
  }, [blob, url]);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const el = audioRef.current;
          if (!el) return;
          if (el.paused) {
            void el.play();
            setPlaying(true);
          } else {
            el.pause();
            setPlaying(false);
          }
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1612]"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </button>
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </>
  );
}
