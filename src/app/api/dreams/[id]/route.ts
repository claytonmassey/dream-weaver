import { requireUserId } from "@/lib/auth/session";
import {
  serviceDeleteDream,
  serviceGetDream,
} from "@/server/dreams/service";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const dream = await serviceGetDream(authResult.userId, id);
  if (!dream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ dream });
}

export async function DELETE(_request: Request, { params }: Params) {
  const authResult = await requireUserId();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const ok = await serviceDeleteDream(authResult.userId, id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
