import { requireUserId } from "@/lib/auth/session";
import { converseAboutDream } from "@/lib/ai/dream-analysis";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const converseRequestSchema = z.object({
  transcript: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["assistant", "user"]),
        content: z.string(),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await request.json();
    const parsed = converseRequestSchema.parse(body);
    const result = await converseAboutDream(parsed);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Conversation error:", error);
    const message =
      error instanceof Error ? error.message : "Conversation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
