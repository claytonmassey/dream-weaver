import fs from "fs/promises";
import path from "path";
import { get } from "@vercel/blob";
import { blobToken, useVercelBlob } from "@/lib/storage";

async function streamToBuffer(
  stream: ReadableStream<Uint8Array>,
): Promise<Buffer> {
  const ab = await new Response(stream).arrayBuffer();
  return Buffer.from(ab);
}

/**
 * Resolve a stored /api/media/... URL (or pathname) to bytes —
 * from private Vercel Blob or local disk.
 */
export async function readStoredMedia(
  urlOrKey: string,
): Promise<{ data: Buffer; mimeType: string; filename: string } | null> {
  let key = urlOrKey;
  if (key.startsWith("/api/media/")) {
    key = key.slice("/api/media/".length);
  }
  key = decodeURIComponent(key.replace(/^\/+/, "").split("?")[0] ?? key);
  if (!key || key.includes("..")) return null;

  if (useVercelBlob()) {
    try {
      const result = await get(key, {
        access: "private",
        ...(blobToken() ? { token: blobToken() } : {}),
      });
      if (!result || result.statusCode !== 200 || !result.stream) {
        return null;
      }
      const data = await streamToBuffer(result.stream);
      return {
        data,
        mimeType: result.blob.contentType || "application/octet-stream",
        filename: path.basename(key),
      };
    } catch {
      // Fall through to local for mixed environments
    }
  }

  const fullPath = path.join(process.cwd(), ".data", "uploads", key);
  try {
    const data = await fs.readFile(fullPath);
    const ext = path.extname(key).toLowerCase();
    const mimeType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : ext === ".webm"
              ? "audio/webm"
              : "image/jpeg";
    return { data, mimeType, filename: path.basename(key) };
  } catch {
    return null;
  }
}
