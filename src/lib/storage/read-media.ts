import fs from "fs/promises";
import path from "path";

/**
 * Resolve a stored /api/media/... URL (or absolute path key) to bytes on disk.
 */
export async function readStoredMedia(
  urlOrKey: string,
): Promise<{ data: Buffer; mimeType: string; filename: string } | null> {
  let key = urlOrKey;
  if (key.startsWith("/api/media/")) {
    key = key.slice("/api/media/".length);
  }
  key = key.replace(/^\/+/, "").split("?")[0] ?? key;
  if (!key || key.includes("..")) return null;

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
            : "image/jpeg";
    return { data, mimeType, filename: path.basename(key) };
  } catch {
    return null;
  }
}
