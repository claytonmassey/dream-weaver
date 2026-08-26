import { requireUserId } from "@/lib/auth/session";
import { readStoredMedia } from "@/lib/storage/read-media";
import { NextResponse } from "next/server";
import path from "path";

type Params = { params: Promise<{ path: string[] }> };

/**
 * Authenticated media proxy — private Blob (or local) files are not
 * exposed via predictable public static URLs.
 */
export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const { path: parts } = await params;
  const relative = parts.map((p) => decodeURIComponent(p)).join("/");

  if (relative.includes("..") || path.isAbsolute(relative)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const media = await readStoredMedia(relative);
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
