import fs from "fs/promises";
import path from "path";
import { createId } from "@/lib/utils/id";

export interface StorageProvider {
  save(input: {
    data: Buffer;
    filename: string;
    mimeType: string;
    folder: "audio" | "images" | "references";
  }): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
}

/**
 * Local filesystem storage for development.
 * Replace with Vercel Blob (or S3) in production — see docs/STORAGE.md.
 */
export class LocalStorageProvider implements StorageProvider {
  private root = path.join(process.cwd(), ".data", "uploads");

  async save(input: {
    data: Buffer;
    filename: string;
    mimeType: string;
    folder: "audio" | "images" | "references";
  }): Promise<{ url: string; key: string }> {
    const safeName = `${createId("file")}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const key = path.join(input.folder, safeName);
    const fullPath = path.join(this.root, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, input.data);
    // Served via authenticated /api/media/[...path] — not a public predictable URL
    return {
      key,
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
 * Stub for Vercel Blob — plug in when STORAGE_TOKEN / BLOB_READ_WRITE_TOKEN is available.
 */
export class VercelBlobStorageProvider implements StorageProvider {
  constructor(private token: string) {}

  async save(input: {
    data: Buffer;
    filename: string;
    mimeType: string;
    folder: "audio" | "images" | "references";
  }): Promise<{ url: string; key: string }> {
    // Placeholder: integrate @vercel/blob put() here using this.token
    void this.token;
    const local = new LocalStorageProvider();
    return local.save(input);
  }

  async delete(key: string): Promise<void> {
    const local = new LocalStorageProvider();
    return local.delete(key);
  }
}

export function getStorageProvider(): StorageProvider {
  const token = process.env.STORAGE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  if (token && process.env.USE_VERCEL_BLOB === "true") {
    return new VercelBlobStorageProvider(token);
  }
  return new LocalStorageProvider();
}
