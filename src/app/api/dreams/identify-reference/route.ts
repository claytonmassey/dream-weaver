import { requireUserId } from "@/lib/auth/session";
import { identifyReferencePhoto } from "@/lib/ai/identify-reference";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const historySchema = z
  .array(
    z.object({
      role: z.enum(["assistant", "user"]),
      content: z.string(),
    }),
  )
  .default([]);

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  try {
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof Blob)) {
      return NextResponse.json({ error: "photo required" }, { status: 400 });
    }

    const transcript = String(form.get("transcript") ?? "");
    let history = historySchema.parse([]);
    const historyRaw = form.get("history");
    if (typeof historyRaw === "string" && historyRaw.trim()) {
      history = historySchema.parse(JSON.parse(historyRaw));
    }

    const buffer = Buffer.from(await photo.arrayBuffer());
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Photo must be under 8MB." },
        { status: 400 },
      );
    }

    const mimeType = photo.type || "image/jpeg";
    const result = await identifyReferencePhoto({
      imageBase64: buffer.toString("base64"),
      mimeType,
      transcript,
      history,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Identify reference error:", error);
    const message =
      error instanceof Error ? error.message : "Couldn't read that photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
