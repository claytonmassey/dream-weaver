import { getDreamAnalysisProvider } from "@/lib/ai/providers";
import { normalizeDreamAnalysis } from "@/lib/ai/normalize-analysis";
import type { DreamAnalysis } from "@/types/dream";
import type {
  ConversationMessage,
  ConversationTurnResult,
} from "@/types/conversation";

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
  return normalizeDreamAnalysis(raw);
}

export async function converseAboutDream(input: {
  transcript: string;
  history: ConversationMessage[];
}): Promise<ConversationTurnResult> {
  const provider = getDreamAnalysisProvider();
  return provider.converse(input);
}
