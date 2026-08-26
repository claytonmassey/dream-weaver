import { getDreamAnalysisProvider } from "@/lib/ai/providers";
import { dreamAnalysisSchema } from "@/types/validation";
import type { DreamAnalysis } from "@/types/dream";

export async function cleanupDreamTranscript(
  rawTranscript: string,
): Promise<string> {
  const provider = getDreamAnalysisProvider();
  return provider.cleanupTranscript(rawTranscript);
}

export async function analyzeDream(
  transcript: string,
): Promise<DreamAnalysis> {
  const provider = getDreamAnalysisProvider();
  const raw = await provider.analyze(transcript);
  return dreamAnalysisSchema.parse(raw);
}
