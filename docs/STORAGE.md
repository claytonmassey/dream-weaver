# Storage

## Interface

`src/lib/storage/index.ts` exports `StorageProvider`:

```ts
interface StorageProvider {
  save(input: {
    data: Buffer;
    filename: string;
    mimeType: string;
    folder: "audio" | "images" | "references";
  }): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
}
```

## Local (default)

Files land in `.data/uploads/{folder}/` and are served only through:

`GET /api/media/[...path]`

which requires an authenticated / demo session. This avoids predictable public URLs for reference photos.

## Vercel Blob

1. Create a Blob store in the Vercel dashboard
2. Set `BLOB_READ_WRITE_TOKEN` or `STORAGE_TOKEN`
3. Set `USE_VERCEL_BLOB=true`
4. Implement `put` / `del` from `@vercel/blob` inside `VercelBlobStorageProvider`

Prefer private/authenticated access patterns for reference photos even with Blob.
