import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GUEST_COOKIE, newGuestId } from "@/lib/auth/guest";

const authPages = ["/login", "/forgot-password", "/reset-password"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // Ensure every visitor has a stable guest id for anonymous capture.
  if (!req.cookies.get(GUEST_COOKIE)?.value) {
    res.cookies.set(GUEST_COOKIE, newGuestId(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 400,
    });
  }

  // Auth pages stay reachable; nothing else requires login anymore.
  void authPages;
  void pathname;

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|placeholders|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
