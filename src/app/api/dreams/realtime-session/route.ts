import { requireUserId } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  transcript: z.string().min(1),
});

function buildSoftMorningInstructions(transcript: string): string {
  return `You are Dreamline — a quiet morning companion helping someone remember a dream.

Tone:
- It is morning. Keep your voice and wording very soft, calm, and unhurried.
- Speak gently, like you don't want to wake the house.
- Short sentences. Warm. Never clinical. Never mystical or dramatic.
- One gentle question at a time.

Purpose:
- Help them recall more sensory detail from the dream: light, color, sound, feeling, place, people, what changed.
- Do not interpret the dream psychologically.
- Do not diagnose.
- Do not invent details they haven't said.

Their dream so far:
"""
${transcript}
"""

Start by softly acknowledging the dream in one short sentence, then ask one gentle follow-up question.
When they answer, thank them briefly and ask another soft question if useful.
After a couple of answers, you may softly say you have enough to start painting when they're ready.`;
}

/**
 * Mint an ephemeral Realtime client secret for browser WebRTC.
 * API key never leaves the server.
 */
export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const apiKey =
    process.env.AI_API_KEY || process.env.AI_TRANSCRIPTION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured." },
      { status: 503 },
    );
  }

  try {
    const parsed = bodySchema.parse(await request.json());

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Safety-Identifier": authResult.userId,
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model: "gpt-realtime",
            instructions: buildSoftMorningInstructions(parsed.transcript),
            audio: {
              output: {
                // Soft, gentle voice for morning
                voice: "shimmer",
              },
              input: {
                transcription: {
                  model: "gpt-4o-mini-transcribe",
                },
                turn_detection: {
                  type: "server_vad",
                  silence_duration_ms: 900,
                  threshold: 0.45,
                },
              },
            },
          },
        }),
      },
    );

    const data = (await response.json()) as {
      value?: string;
      expires_at?: number;
      session?: unknown;
      error?: { message?: string };
    };

    if (!response.ok || !data.value) {
      throw new Error(data.error?.message || "Failed to create realtime session");
    }

    return NextResponse.json({
      clientSecret: data.value,
      expiresAt: data.expires_at,
    });
  } catch (error) {
    console.error("Realtime session error:", error);
    const message =
      error instanceof Error ? error.message : "Realtime session failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
