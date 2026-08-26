/**
 * AI provider factory.
 *
 * Real OpenAI providers are used when API keys are set in env.
 * See docs/AI_PROVIDERS.md.
 */

import {
  MockDreamAnalysisProvider,
  MockTranscriptionProvider,
} from "@/lib/ai/providers/mock";
import { MockDreamImageProvider } from "@/lib/ai/providers/mock-image";
import { OpenAIAnalysisProvider } from "@/lib/ai/providers/openai-analysis";
import { OpenAIImageProvider } from "@/lib/ai/providers/openai-image";
import { OpenAITranscriptionProvider } from "@/lib/ai/providers/openai-transcription";
import type {
  DreamAnalysisProvider,
  DreamImageProvider,
  TranscriptionProvider,
} from "@/lib/ai/providers/types";

function transcriptionKey(): string | undefined {
  return (
    process.env.AI_TRANSCRIPTION_API_KEY ||
    process.env.AI_API_KEY ||
    undefined
  );
}

function analysisKey(): string | undefined {
  return process.env.AI_API_KEY || process.env.AI_TRANSCRIPTION_API_KEY || undefined;
}

function imageKey(): string | undefined {
  return (
    process.env.AI_IMAGE_API_KEY ||
    process.env.AI_API_KEY ||
    undefined
  );
}

export function getTranscriptionProvider(): TranscriptionProvider {
  const key = transcriptionKey();
  if (key) {
    return new OpenAITranscriptionProvider(key);
  }
  return new MockTranscriptionProvider();
}

export function getDreamAnalysisProvider(): DreamAnalysisProvider {
  const key = analysisKey();
  if (key) {
    return new OpenAIAnalysisProvider(key);
  }
  return new MockDreamAnalysisProvider();
}

export function getDreamImageProvider(): DreamImageProvider {
  const key = imageKey();
  if (key) {
    return new OpenAIImageProvider(key);
  }
  return new MockDreamImageProvider();
}

export * from "@/lib/ai/providers/types";
