import { requireUserId } from "@/lib/auth/session";
import { serviceGenerateDreamImage } from "@/server/dreams/service";
import { generateImageRequestSchema } from "@/types/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await request.json();
    const parsed = generateImageRequestSchema.parse(body);
    const dream = await serviceGenerateDreamImage(
      authResult.userId,
      parsed.dreamId,
      parsed.style,
      parsed.referenceImageUrls,
    );
    return NextResponse.json({ dream });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Image generation failed. Your dream was saved — you can retry.",
      },
      { status: 500 },
    );
  }
}
