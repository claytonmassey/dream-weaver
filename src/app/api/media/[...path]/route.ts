import { requireUserId } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type Params = { params: Promise<{ path: string[] }> };

/**
 * Authenticated media proxy — reference photos and audio are not
 * exposed via predictable public static URLs.
 */
export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const { path: parts } = await params;
  const relative = parts.join("/");

  // Prevent path traversal
  if (relative.includes("..") || path.isAbsolute(relative)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const fullPath = path.join(process.cwd(), ".data", "uploads", relative);
  try {
    const data = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".webm"
              ? "audio/webm"
              : ext === ".mp3"
                ? "audio/mpeg"
                : "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
