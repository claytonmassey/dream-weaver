import type { DreamVisualStyle } from "@/types/dream";

export type ConversationMessage = {
  role: "assistant" | "user";
  content: string;
};

export type ConversationTurnResult = {
  message: string;
  /** True when enough detail has been gathered to review / generate */
  readyForDesign: boolean;
  /** Dream text enriched with answers from the conversation */
  enrichedTranscript: string;
};

export const DREAM_VISUAL_STYLES: Array<{
  id: DreamVisualStyle;
  label: string;
  hint: string;
}> = [
  { id: "cinematic", label: "Cinematic", hint: "Film still, dramatic light" },
  { id: "realistic", label: "Realistic", hint: "Like a photograph" },
  { id: "surreal", label: "Surreal", hint: "Strange and dreamlike" },
  { id: "illustrated", label: "Illustrated", hint: "Drawn storybook feel" },
  { id: "painting", label: "Painting", hint: "Brush and canvas" },
];
