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
  mood: string;
}> = [
  {
    id: "cinematic",
    label: "Cinematic",
    hint: "Film still, dramatic light",
    mood: "Wide · lit like a movie",
  },
  {
    id: "realistic",
    label: "Realistic",
    hint: "Like a photograph",
    mood: "Natural · documentary",
  },
  {
    id: "surreal",
    label: "Surreal",
    hint: "Strange and dreamlike",
    mood: "Uncanny · soft logic",
  },
  {
    id: "illustrated",
    label: "Illustrated",
    hint: "Drawn storybook feel",
    mood: "Ink · storybook",
  },
  {
    id: "painting",
    label: "Painting",
    hint: "Brush and canvas",
    mood: "Oils · gallery light",
  },
];
