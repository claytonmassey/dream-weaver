import type { AudioRecorder } from "@/features/recorder/types";

/**
 * Web MediaRecorder implementation.
 * Expo can later provide ExpoAudioRecorder behind the same interface.
 */
export class WebAudioRecorder implements AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startedAt: number | null = null;

  async start(): Promise<void> {
    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : undefined;
    this.mediaRecorder = new MediaRecorder(
      this.stream,
      mimeType ? { mimeType } : undefined,
    );
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.mediaRecorder.start(100);
    this.startedAt = Date.now();
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("Not recording"));
        return;
      }
      this.mediaRecorder.onstop = () => {
        const type = this.mediaRecorder?.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type });
        this.cleanup();
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  async cancel(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.cleanup();
    this.chunks = [];
  }

  getElapsedMs(): number {
    if (!this.startedAt) return 0;
    return Date.now() - this.startedAt;
  }

  private cleanup() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.mediaRecorder = null;
    this.startedAt = null;
  }
}
