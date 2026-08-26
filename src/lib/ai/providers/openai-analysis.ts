import OpenAI from "openai";
import {
  DREAM_ANALYSIS_SYSTEM_PROMPT,
  DREAM_CONVERSATION_SYSTEM_PROMPT,
  TRANSCRIPT_CLEANUP_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import { normalizeDreamAnalysis } from "@/lib/ai/normalize-analysis";
import type { DreamAnalysisProvider } from "@/lib/ai/providers/types";
import type { DreamAnalysis } from "@/types/dream";
import type {
  ConversationMessage,
  ConversationTurnResult,
} from "@/types/conversation";
import { z } from "zod";

const conversationResultSchema = z.object({
  message: z.string().min(1),
  readyForDesign: z.boolean().default(false),
  enrichedTranscript: z.string().default(""),
});

/**
 * OpenAI LLM for grammar cleanup, conversation, and structured dream analysis.
 */
export class OpenAIAnalysisProvider implements DreamAnalysisProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async cleanupTranscript(rawTranscript: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: TRANSCRIPT_CLEANUP_SYSTEM_PROMPT },
        { role: "user", content: rawTranscript },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim();
    return text && text.length > 0 ? text : rawTranscript;
  }

  async converse(input: {
    transcript: string;
    history: ConversationMessage[];
  }): Promise<ConversationTurnResult> {
    const historyText =
      input.history.length === 0
        ? "(Conversation just starting — ask your first question.)"
        : input.history
            .map((m) => `${m.role === "assistant" ? "You" : "Dreamer"}: ${m.content}`)
            .join("\n");

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DREAM_CONVERSATION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Dream so far (may be empty if just starting):\n${input.transcript.trim() || "(nothing yet)"}\n\nConversation so far:\n${historyText}\n\nContinue the conversation. Return JSON only.`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty conversation response from OpenAI");
    }

    const parsed = conversationResultSchema.parse(JSON.parse(raw));
    const enriched =
      parsed.enrichedTranscript.trim() || input.transcript.trim() || "";
    return {
      message: parsed.message,
      readyForDesign: Boolean(parsed.readyForDesign && enriched),
      enrichedTranscript: enriched,
    };
  }

  async analyze(transcript: string): Promise<DreamAnalysis> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DREAM_ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this dream. Return JSON matching the required schema exactly.\n\nDream:\n${transcript}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty analysis response from OpenAI");
    }

    const parsed: unknown = JSON.parse(raw);
    return normalizeDreamAnalysis(parsed);
  }
}
