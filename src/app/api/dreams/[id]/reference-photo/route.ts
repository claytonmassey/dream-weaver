import { requireUserId } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { getStorageProvider } from "@/lib/storage";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const { id: dreamId } = await params;
  const form = await request.formData();
  const personId = form.get("personId")?.toString();
  const photo = form.get("photo");

  if (!personId || !(photo instanceof Blob)) {
    return NextResponse.json(
      { error: "personId and photo required" },
      { status: 400 },
    );
  }

  const dream = await dreamRepository.get(authResult.userId, dreamId);
  if (!dream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await photo.arrayBuffer());
  const storage = getStorageProvider();
  const saved = await storage.save({
    data: buffer,
    filename: (photo as File).name || "reference.jpg",
    mimeType: photo.type || "image/jpeg",
    folder: "references",
  });

  const person = await dreamRepository.setPersonReference(
    authResult.userId,
    dreamId,
    personId,
    saved.url,
  );

  return NextResponse.json({ person, url: saved.url });
}
