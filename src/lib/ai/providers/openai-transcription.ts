import OpenAI from "openai";
import type { TranscriptionProvider } from "@/lib/ai/providers/types";

/**
 * OpenAI Whisper transcription.
 * Uses AI_TRANSCRIPTION_API_KEY (or AI_API_KEY).
 */
export class OpenAITranscriptionProvider implements TranscriptionProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audio: File | Blob): Promise<string> {
    const file =
      audio instanceof File
        ? audio
        : new File([audio], "dream.webm", {
            type: audio.type || "audio/webm",
          });

    const result = await this.client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      // Keep punctuation; cleanup prompt handles grammar lightly afterward
      response_format: "text",
    });

    // SDK may return string for text format, or object with text
    if (typeof result === "string") {
      return result.trim();
    }
    if (
      result &&
      typeof result === "object" &&
      "text" in result &&
      typeof (result as { text: unknown }).text === "string"
    ) {
      return (result as { text: string }).text.trim();
    }
    return String(result).trim();
  }
}
