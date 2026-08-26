import type {
  DreamAnalysis,
  DreamVisualStyle,
  GeneratedDreamImage,
} from "@/types/dream";
import type {
  ConversationMessage,
  ConversationTurnResult,
} from "@/types/conversation";

export interface TranscriptionProvider {
  transcribe(audio: File | Blob): Promise<string>;
}

export interface DreamAnalysisProvider {
  analyze(transcript: string): Promise<DreamAnalysis>;
  cleanupTranscript(rawTranscript: string): Promise<string>;
  converse(input: {
    transcript: string;
    history: ConversationMessage[];
  }): Promise<ConversationTurnResult>;
}

export interface DreamImageProvider {
  generateDreamImage(input: {
    prompt: string;
    referenceImages?: string[];
    style?: DreamVisualStyle;
  }): Promise<GeneratedDreamImage>;
}
