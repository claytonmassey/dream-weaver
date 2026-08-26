import fs from "fs/promises";
import path from "path";
import { createId } from "@/lib/utils/id";
import { del, put } from "@vercel/blob";

export interface StorageProvider {
  save(input: {
    data: Buffer;
    filename: string;
    mimeType: string;
    folder: "audio" | "images" | "references";
  }): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
}

function safeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Local filesystem storage for development without Blob credentials.
 */
export class LocalStorageProvider implements StorageProvider {
  private root = path.join(process.cwd(), ".data", "uploads");

  async save(input: {
    data: Buffer;
    filename: string;
    mimeType: string;
    folder: "audio" | "images" | "references";
  }): Promise<{ url: string; key: string }> {
    const safeName = `${createId("file")}-${safeFilename(input.filename)}`;
    const key = path.join(input.folder, safeName);
    const fullPath = path.join(this.root, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, input.data);
    return {
      key: key.split(path.sep).join("/"),
      url: `/api/media/${key.split(path.sep).join("/")}`,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.root, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // ignore missing files
    }
  }
}

/**
 * Private Vercel Blob storage.
 * Files are not publicly reachable — served via authenticated /api/media.
 */
export class VercelBlobStorageProvider implements StorageProvider {
  constructor(private token?: string) {}

  async save(input: {
    data: Buffer;
    filename: string;
    mimeType: string;
    folder: "audio" | "images" | "references";
  }): Promise<{ url: string; key: string }> {
    const pathname = `${input.folder}/${createId("file")}-${safeFilename(input.filename)}`;

    const blob = await put(pathname, input.data, {
      access: "private",
      contentType: input.mimeType,
      addRandomSuffix: false,
      ...(this.token ? { token: this.token } : {}),
    });

    // Keep app URLs stable behind our auth proxy (pathname is the blob key).
    return {
      key: blob.pathname,
      url: `/api/media/${blob.pathname}`,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await del(key, this.token ? { token: this.token } : undefined);
    } catch {
      // ignore missing files
    }
  }
}

export function blobToken(): string | undefined {
  return (
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.STORAGE_TOKEN ||
    undefined
  );
}

export function useVercelBlob(): boolean {
  // On Vercel, always use Blob when a token exists — ignore local USE_VERCEL_BLOB=false.
  if (process.env.VERCEL === "1") {
    return Boolean(blobToken());
  }
  if (process.env.USE_VERCEL_BLOB === "false") return false;
  if (process.env.USE_VERCEL_BLOB === "true") return true;
  return Boolean(blobToken());
}

export function getStorageProvider(): StorageProvider {
  if (useVercelBlob()) {
    return new VercelBlobStorageProvider(blobToken());
  }
  // Vercel’s filesystem is read-only — local uploads only work in development.
  if (process.env.VERCEL === "1") {
    throw new Error(
      "Image storage isn’t configured. Create a Vercel Blob store and set BLOB_READ_WRITE_TOKEN.",
    );
  }
  return new LocalStorageProvider();
}
