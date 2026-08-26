import { requireUserId } from "@/lib/auth/session";
import { serviceAnalyze } from "@/server/dreams/service";
import { analyzeDreamRequestSchema } from "@/types/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await request.json();
    const parsed = analyzeDreamRequestSchema.parse(body);
    const result = await serviceAnalyze(parsed.transcript);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Dream analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
