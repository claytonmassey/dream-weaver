import { requireUserId } from "@/lib/auth/session";
import { dreamRepository } from "@/lib/db/dream-repository";
import { NextResponse } from "next/server";

export async function GET() {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const people = await dreamRepository.listPeople(authResult.userId);
  const references = await dreamRepository.listPersonReferences(
    authResult.userId,
  );
  return NextResponse.json({ people, references });
}

export async function DELETE(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const referenceId = searchParams.get("referenceId");
  if (!referenceId) {
    return NextResponse.json({ error: "referenceId required" }, { status: 400 });
  }

  const ok = await dreamRepository.deletePersonReference(
    authResult.userId,
    referenceId,
  );
  return NextResponse.json({ ok });
}
