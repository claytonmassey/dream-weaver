/**
 * AI provider factory.
 *
 * Plug in real providers here when you have API keys.
 * See docs/AI_PROVIDERS.md for the exact interfaces and env vars.
 */

import {
  MockDreamAnalysisProvider,
  MockTranscriptionProvider,
} from "@/lib/ai/providers/mock";
import { MockDreamImageProvider } from "@/lib/ai/providers/mock-image";
import type {
  DreamAnalysisProvider,
  DreamImageProvider,
  TranscriptionProvider,
} from "@/lib/ai/providers/types";

export function getTranscriptionProvider(): TranscriptionProvider {
  // Example:
  // if (process.env.AI_TRANSCRIPTION_API_KEY) {
  //   return new OpenAIWhisperProvider(process.env.AI_TRANSCRIPTION_API_KEY);
  // }
  return new MockTranscriptionProvider();
}

export function getDreamAnalysisProvider(): DreamAnalysisProvider {
  // Example:
  // if (process.env.AI_API_KEY) {
  //   return new OpenAIAnalysisProvider(process.env.AI_API_KEY);
  // }
  return new MockDreamAnalysisProvider();
}

export function getDreamImageProvider(): DreamImageProvider {
  // Example:
  // if (process.env.AI_IMAGE_API_KEY) {
  //   return new FalOrOpenAIImageProvider(process.env.AI_IMAGE_API_KEY);
  // }
  return new MockDreamImageProvider();
}

export * from "@/lib/ai/providers/types";
