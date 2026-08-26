import { getTranscriptionProvider } from "@/lib/ai/providers";

export async function transcribeAudio(audio: File | Blob): Promise<string> {
  const provider = getTranscriptionProvider();
  return provider.transcribe(audio);
}
