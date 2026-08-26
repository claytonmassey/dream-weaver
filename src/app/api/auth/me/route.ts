import { auth } from "@/lib/auth";
import { isGuestEmail, readGuestId } from "@/lib/auth/guest";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (session?.user?.id && !isGuestEmail(session.user.email)) {
    return NextResponse.json({
      authenticated: true,
      isGuest: false,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
  }

  const guestId = await readGuestId();
  return NextResponse.json({
    authenticated: false,
    isGuest: true,
    guestId: guestId ?? null,
  });
}
