import { requireUserId } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { blobToken } from "@/lib/storage";
import { serviceGenerateDreamImage } from "@/server/dreams/service";
import { generateImageRequestSchema } from "@/types/validation";
import { after, NextResponse } from "next/server";
import { ZodError } from "zod";

export const runtime = "nodejs";
/** gpt-image-1 often takes 30–60s; keep this high on Pro / Fluid. */
export const maxDuration = 120;

function envDiagnostics() {
  return {
    hasDatabaseUrl: Boolean(
      process.env.DATABASE_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL_UNPOOLED,
    ),
    databaseUrlKeys: [
      process.env.DATABASE_URL ? "DATABASE_URL" : null,
      process.env.POSTGRES_PRISMA_URL ? "POSTGRES_PRISMA_URL" : null,
      process.env.POSTGRES_URL ? "POSTGRES_URL" : null,
      process.env.DATABASE_URL_UNPOOLED ? "DATABASE_URL_UNPOOLED" : null,
    ].filter(Boolean),
    hasBlobToken: Boolean(
      process.env.BLOB_READ_WRITE_TOKEN || process.env.STORAGE_TOKEN,
    ),
    hasAiImageKey: Boolean(
      process.env.AI_IMAGE_API_KEY || process.env.AI_API_KEY,
    ),
    demoStore: process.env.DEMO_STORE ?? "(unset)",
    demoMode: process.env.DEMO_MODE ?? "(unset)",
    useVercelBlob: process.env.USE_VERCEL_BLOB ?? "(unset)",
    vercel: process.env.VERCEL === "1",
  };
}

function imageErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return "Invalid image request.";
  }
  if (error && typeof error === "object") {
    const e = error as {
      message?: string;
      error?: { message?: string };
    };
    if (e.error?.message) return e.error.message;
    if (typeof e.message === "string" && e.message) return e.message;
  }
  if (error instanceof Error) return error.message;
  return "Image generation failed. Your dream was saved — you can retry.";
}

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const diagnostics = envDiagnostics();

  try {
    if (process.env.VERCEL === "1" && !diagnostics.hasDatabaseUrl) {
      return NextResponse.json(
        {
          error:
            "No Postgres URL on Vercel. Set DATABASE_URL (Neon pooled URL) under Project Settings → Environment Variables for Production, then Redeploy. Without it, dreams are saved in memory and disappear.",
          diagnostics,
        },
        { status: 500 },
      );
    }

    if (process.env.DEMO_STORE === "true") {
      return NextResponse.json(
        {
          error:
            "DEMO_STORE is true on Vercel. Set DEMO_STORE=false so dreams use Postgres.",
          diagnostics,
        },
        { status: 500 },
      );
    }

    if (process.env.USE_VERCEL_BLOB === "false") {
      return NextResponse.json(
        {
          error:
            "USE_VERCEL_BLOB is false on Vercel. Set it to true (or remove it) so images save to Blob.",
          diagnostics,
        },
        { status: 500 },
      );
    }

    if (!blobToken()) {
      return NextResponse.json(
        {
          error:
            "BLOB_READ_WRITE_TOKEN is missing. Add it under Vercel → Settings → Environment Variables, then redeploy.",
          diagnostics,
        },
        { status: 500 },
      );
    }

    if (!process.env.AI_IMAGE_API_KEY && !process.env.AI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "AI_IMAGE_API_KEY (or AI_API_KEY) is missing on Vercel. Add your OpenAI key, then redeploy.",
          diagnostics,
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const parsed = generateImageRequestSchema.parse(body);

    const existing = await dreamRepository.get(
      authResult.userId,
      parsed.dreamId,
    );
    if (!existing) {
      return NextResponse.json(
        { error: "Dream not found", diagnostics },
        { status: 404 },
      );
    }

    // Mark pending and return immediately — waiting inline times out on Vercel.
    await dreamRepository.updateImage(
      authResult.userId,
      parsed.dreamId,
      existing.imageUrl ?? "",
      "pending",
    );

    const userId = authResult.userId;
    try {
      after(async () => {
        try {
          await serviceGenerateDreamImage(
            userId,
            parsed.dreamId,
            parsed.style,
            parsed.referenceImageUrls,
          );
        } catch (error) {
          console.error("Background image generation error:", error);
        }
      });
    } catch (error) {
      // Some runtimes reject after() — fall back to inline generation.
      console.error("after() unavailable, running inline:", error);
      await serviceGenerateDreamImage(
        userId,
        parsed.dreamId,
        parsed.style,
        parsed.referenceImageUrls,
      );
      const dream = await dreamRepository.get(userId, parsed.dreamId);
      return NextResponse.json({ ok: true, pending: false, dream });
    }

    return NextResponse.json({
      ok: true,
      pending: true,
      dreamId: parsed.dreamId,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: imageErrorMessage(error), diagnostics },
      { status: 500 },
    );
  }
}
