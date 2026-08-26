import OpenAI from "openai";
import { IDENTIFY_REFERENCE_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { ConversationMessage } from "@/types/conversation";
import type { IdentifyReferenceResult } from "@/types/reference";
import { z } from "zod";

const identifySchema = z.object({
  isPerson: z.boolean(),
  personName: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
  note: z.string().min(1),
});

function mockIdentify(input: {
  transcript: string;
  history: ConversationMessage[];
}): IdentifyReferenceResult {
  const text = [input.transcript, ...input.history.map((m) => m.content)]
    .join(" ")
    .toLowerCase();
  if (text.includes("dad") || text.includes("father")) {
    return {
      isPerson: true,
      personName: "Dad",
      relationship: "father",
      note: "Looks like this could be your dad — I'll use this photo when painting him.",
    };
  }
  if (text.includes("mom") || text.includes("mother")) {
    return {
      isPerson: true,
      personName: "Mom",
      relationship: "mother",
      note: "This seems like your mom — I'll keep their likeness for the dream image.",
    };
  }
  return {
    isPerson: true,
    personName: null,
    relationship: null,
    note: "Got it — I'll use this as a visual reference when painting your dream.",
  };
}

export async function identifyReferencePhoto(input: {
  imageBase64: string;
  mimeType: string;
  transcript: string;
  history: ConversationMessage[];
}): Promise<IdentifyReferenceResult> {
  const key =
    process.env.AI_API_KEY || process.env.AI_TRANSCRIPTION_API_KEY || undefined;

  if (!key) {
    return mockIdentify(input);
  }

  const client = new OpenAI({ apiKey: key });
  const historyText =
    input.history.length === 0
      ? "(No conversation yet.)"
      : input.history
          .map((m) => `${m.role === "assistant" ? "You" : "Dreamer"}: ${m.content}`)
          .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: IDENTIFY_REFERENCE_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Dream so far:\n${input.transcript.trim() || "(nothing yet)"}\n\nConversation:\n${historyText}\n\nIdentify the uploaded photo. Return JSON only.`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${input.mimeType};base64,${input.imageBase64}`,
            },
          },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty identify response");
  }

  const parsed = identifySchema.parse(JSON.parse(raw));
  return {
    isPerson: parsed.isPerson,
    personName: parsed.personName?.trim() || null,
    relationship: parsed.relationship?.trim() || null,
    note: parsed.note.trim(),
  };
}
