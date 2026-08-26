import type {
  DreamAnalysis,
  DreamVisualStyle,
  GeneratedDreamImage,
} from "@/types/dream";

export interface TranscriptionProvider {
  transcribe(audio: File | Blob): Promise<string>;
}

export interface DreamAnalysisProvider {
  analyze(transcript: string): Promise<DreamAnalysis>;
  cleanupTranscript(rawTranscript: string): Promise<string>;
}

export interface DreamImageProvider {
  generateDreamImage(input: {
    prompt: string;
    referenceImages?: string[];
    style?: DreamVisualStyle;
  }): Promise<GeneratedDreamImage>;
}
