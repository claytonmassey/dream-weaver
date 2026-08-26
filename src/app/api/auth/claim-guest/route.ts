import { auth } from "@/lib/auth";
import {
  GUEST_COOKIE,
  guestEmailFor,
  isGuestEmail,
  readGuestId,
} from "@/lib/auth/guest";
import { localDb } from "@/lib/db/local-store";
import { prisma, usePrisma } from "@/lib/db/prisma";
import { userStore } from "@/lib/db/user-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Move dreams from the anonymous guest account onto the signed-in user,
 * then delete the guest user record.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id || isGuestEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guestId = await readGuestId();
  if (!guestId) {
    return NextResponse.json({ ok: true, moved: 0 });
  }

  const guest = await userStore.findByEmail(guestEmailFor(guestId));
  if (!guest || guest.id === session.user.id) {
    return NextResponse.json({ ok: true, moved: 0 });
  }

  let moved = 0;

  if (usePrisma()) {
    const result = await prisma.dream.updateMany({
      where: { userId: guest.id },
      data: { userId: session.user.id },
    });
    moved = result.count;
    await prisma.personReference.updateMany({
      where: { userId: guest.id },
      data: { userId: session.user.id },
    });
    await prisma.user.delete({ where: { id: guest.id } }).catch(() => null);
  } else {
    moved = await localDb.reassignDreams(guest.id, session.user.id);
    await localDb.deleteAccount(guest.id);
  }

  const res = NextResponse.json({ ok: true, moved });
  res.cookies.set({
    name: GUEST_COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
