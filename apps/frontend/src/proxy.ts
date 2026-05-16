/**
 * Next.js middleware for route protection
 * Public routes (no auth required):
 *   /login
 *   /register
 *   /auth-callback
 *   /api/auth/* (BetterAuth handler routes)
 *
 * changed as needed backend peeps
 */

import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "better-auth.session-token";

const PUBLIC_PATHS = ["/login", "/register", "/auth-callback"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isAuthApiPath = pathname.startsWith("/api/auth");

  if (isPublicPath || isAuthApiPath) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
