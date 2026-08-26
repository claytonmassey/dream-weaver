import { requireUserId } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { blobToken } from "@/lib/storage";
import { serviceGenerateDreamImage } from "@/server/dreams/service";
import { generateImageRequestSchema } from "@/types/validation";
import { after, NextResponse } from "next/server";

export const runtime = "nodejs";
/** gpt-image-1 often takes 30–60s; keep this high on Pro / Fluid. */
export const maxDuration = 120;

function imageErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as {
      message?: string;
      error?: { message?: string };
      status?: number;
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

  try {
    const body = await request.json();
    const parsed = generateImageRequestSchema.parse(body);

    // Fail fast before kicking off a long OpenAI call.
    if (process.env.VERCEL === "1" && !blobToken()) {
      return NextResponse.json(
        {
          error:
            "BLOB_READ_WRITE_TOKEN is missing on Vercel. Open Storage → Blob, then copy the token into Project Settings → Environment Variables (Production) and redeploy. You do not need a custom blob route — /api/media already serves private files.",
        },
        { status: 500 },
      );
    }

    const existing = await dreamRepository.get(
      authResult.userId,
      parsed.dreamId,
    );
    if (!existing) {
      return NextResponse.json({ error: "Dream not found" }, { status: 404 });
    }

    // Mark pending and return immediately — waiting inline times out on Vercel.
    await dreamRepository.updateImage(
      authResult.userId,
      parsed.dreamId,
      existing.imageUrl ?? "",
      "pending",
    );

    const userId = authResult.userId;
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

    return NextResponse.json({
      ok: true,
      pending: true,
      dreamId: parsed.dreamId,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: imageErrorMessage(error) },
      { status: 500 },
    );
  }
}
