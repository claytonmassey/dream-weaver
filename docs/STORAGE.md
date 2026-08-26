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

## Vercel Blob (private) — recommended

Uses `@vercel/blob` with `access: "private"`.

1. Create a **private** Blob store in the Vercel dashboard
2. Set `BLOB_READ_WRITE_TOKEN` (or `STORAGE_TOKEN`) in `.env.local`
3. Optionally set `USE_VERCEL_BLOB=true` (auto-enabled when a token is present)

Uploads go through:

```ts
await put(pathname, data, { access: "private", contentType, token });
```

App URLs stay as `/api/media/<pathname>`. That route authenticates the user, then streams the private blob via `get(pathname, { access: "private" })`.

## Local fallback

When Blob is not configured, files land in `.data/uploads/{folder}/` and are served the same way through `/api/media/[...path]`.

## Database

Dream metadata lives in Postgres (Prisma). Media binaries live in Blob (or local disk).
