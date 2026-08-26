import { requireUserId } from "@/lib/auth/session";
import { getStorageProvider } from "@/lib/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Upload a reference image (scene or unmatched person) for dream generation.
 */
export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  try {
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof Blob)) {
      return NextResponse.json({ error: "photo required" }, { status: 400 });
    }

    const buffer = Buffer.from(await photo.arrayBuffer());
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Photo must be under 8MB." },
        { status: 400 },
      );
    }

    const storage = getStorageProvider();
    const saved = await storage.save({
      data: buffer,
      filename: (photo as File).name || "reference.jpg",
      mimeType: photo.type || "image/jpeg",
      folder: "references",
    });

    return NextResponse.json({ url: saved.url, key: saved.key });
  } catch (error) {
    console.error("Upload reference error:", error);
    return NextResponse.json(
      { error: "Couldn't upload that photo." },
      { status: 500 },
    );
  }
}
