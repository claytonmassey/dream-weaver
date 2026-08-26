import { requireUserId } from "@/lib/auth/session";
import { databaseUrl } from "@/lib/db/prisma";
import {
  serviceCreateDream,
  serviceListDreams,
} from "@/server/dreams/service";
import { createDreamRequestSchema } from "@/types/validation";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

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

  if (process.env.VERCEL === "1" && !databaseUrl()) {
    return NextResponse.json(
      {
        error:
          "DATABASE_URL is missing on Vercel. Add your Neon pooled connection string for Production, then Redeploy.",
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
    console.error("Create dream error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid dream payload." },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Could not save dream.";
    // Prisma often prefixes with helpful codes
    return NextResponse.json(
      {
        error: message.includes("Foreign key")
          ? "Your account isn’t linked to the database yet. Sign out, sign in again, then retry."
          : message.slice(0, 300),
      },
      { status: 500 },
    );
  }
}
