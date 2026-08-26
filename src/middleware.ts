import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
];

function authSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dreamline-dev-secret-change-me"
  );
}

/** Auth.js uses `__Secure-` cookie names on HTTPS; getToken must match. */
function sessionCookieOptions(req: NextRequest) {
  if (req.cookies.has("__Secure-authjs.session-token")) {
    return { secureCookie: true as const };
  }
  if (req.cookies.has("authjs.session-token")) {
    return { secureCookie: false as const };
  }
  // No cookie yet — infer from request (production / HTTPS).
  const secure =
    req.nextUrl.protocol === "https:" ||
    process.env.AUTH_URL?.startsWith("https://") === true ||
    process.env.VERCEL === "1";
  return { secureCookie: secure };
}

export async function middleware(req: NextRequest) {
  // Opt-in demo mode skips forced login for local prototyping only.
  if (process.env.DEMO_MODE === "true") {
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
    secret: authSecret(),
    ...sessionCookieOptions(req),
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
    "/((?!_next/static|_next/image|favicon.ico|placeholders|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
