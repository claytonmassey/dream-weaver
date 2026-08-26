import { requireUserId } from "@/lib/auth/session";
import {
  serviceCreateDream,
  serviceListDreams,
} from "@/server/dreams/service";
import { createDreamRequestSchema } from "@/types/validation";
import { NextResponse } from "next/server";

export async function GET() {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const dreams = await serviceListDreams(authResult.userId);
  return NextResponse.json({ dreams });
}

export async function POST(request: Request) {
  // Guests can create dreams; account prompt comes after the image is ready.
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await request.json();
    const parsed = createDreamRequestSchema.parse(body);
    const dream = await serviceCreateDream(authResult.userId, parsed);
    return NextResponse.json(
      { dream, isGuest: authResult.isGuest },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not save dream." },
      { status: 500 },
    );
  }
}
