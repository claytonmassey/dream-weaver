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
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  if (process.env.VERCEL === "1" && process.env.DEMO_STORE === "true") {
    return NextResponse.json(
      {
        error:
          "DEMO_STORE must be false on Vercel (dreams were saving to ephemeral memory, which causes 404s).",
      },
      { status: 500 },
    );
  }

  if (
    process.env.VERCEL === "1" &&
    !(
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL
    )
  ) {
    return NextResponse.json(
      {
        error:
          "DATABASE_URL is missing on Vercel. Add your Neon pooled connection string, then redeploy.",
      },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const parsed = createDreamRequestSchema.parse(body);
    const dream = await serviceCreateDream(authResult.userId, parsed);
    return NextResponse.json({ dream }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not save dream." },
      { status: 500 },
    );
  }
}
