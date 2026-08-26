import { requireUserId } from "@/lib/auth/session";
import { serviceTranscribe } from "@/server/dreams/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  try {
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json(
        { error: "Audio file required" },
        { status: 400 },
      );
    }
    const result = await serviceTranscribe(audio);
    if (!result.cleanedTranscript?.trim()) {
      return NextResponse.json(
        { error: "Nothing was heard. Try speaking again." },
        { status: 422 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Transcription error:", error);
    const message =
      error instanceof Error ? error.message : "Transcription failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
