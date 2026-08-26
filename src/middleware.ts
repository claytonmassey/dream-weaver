import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/login", "/api/auth"];

export async function middleware(req: NextRequest) {
  // Demo mode skips forced login
  if (process.env.DEMO_MODE !== "false") {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? "dreamline-dev-secret-change-me",
  });

  if (!token) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|placeholders|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
