import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "umtas-session";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-pending",
  "/verify-email",
  "/reset-password",
  "/auth-callback",
  "/api/health",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isAuthApiPath = pathname.startsWith("/api/auth");
  const isHealthApiPath = pathname.startsWith("/api/health");

  if (isPublicPath || isAuthApiPath || isHealthApiPath)
    return NextResponse.next();

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based routing stubs — all roles currently go to /dashboard.
  // Once server-side session decoding is wired up, uncomment and fill in:
  // const role = decodeSessionRole(sessionCookie.value); // TODO: implement
  // if ((role === "uni_admin" || role === "sys_admin") && pathname.startsWith("/dashboard")) {
  //   return NextResponse.redirect(new URL("/admin", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
