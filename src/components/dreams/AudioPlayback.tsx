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
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
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
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1612]"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="flex-1">
        <p className="text-sm">Playback</p>
        <p className="text-xs text-[var(--text-muted)]">
          Listen before submitting
        </p>
      </div>
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
}
