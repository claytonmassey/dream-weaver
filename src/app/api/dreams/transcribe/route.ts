import { requireUserId } from "@/lib/auth/session";
import { serviceTranscribe } from "@/server/dreams/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  try {
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "Audio file required" },
        { status: 400 },
      );
    }
    const result = await serviceTranscribe(audio);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 500 },
    );
  }
}
