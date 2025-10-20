import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";

const PUBLIC_PATHS = [
  "/",
  "/privacy-policy",
  "/tos",
  "/api/lead",
];

const PUBLIC_PREFIXES = [
  "/api/csrf",
  "/api/webhook",
  "/api/auth",
  "/_next",
  "/public",
];

const PROTECTED_PATTERNS = [
  /^\/dashboard(\/.*)?$/,
  /^\/api\/alerts(\/.*)?$/,
  /^\/api\/queue(\/.*)?$/,
];

const securityHeaders = [
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "geolocation=(), microphone=(), camera=()"],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["Cross-Origin-Resource-Policy", "same-site"],
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push([
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  ]);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (req.method === "OPTIONS") {
    const res = NextResponse.next();
    securityHeaders.forEach(([key, value]) => res.headers.set(key, value));
    return res;
  }

  // Allow asset files without auth
  if (pathname.match(/\.(.*)$/)) {
    const res = NextResponse.next();
    securityHeaders.forEach(([key, value]) => res.headers.set(key, value));
    return res;
  }

  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    const res = NextResponse.next();
    securityHeaders.forEach(([key, value]) => res.headers.set(key, value));
    return res;
  }

  const isProtected = PROTECTED_PATTERNS.some((regex) => regex.test(pathname));

  if (isProtected && !req.auth) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
      securityHeaders.forEach(([key, value]) => res.headers.set(key, value));
      return res;
    }

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/api/auth/signin";
    redirectUrl.searchParams.set("callbackUrl", req.nextUrl.href);

    const res = NextResponse.redirect(redirectUrl);
    securityHeaders.forEach(([key, value]) => res.headers.set(key, value));
    return res;
  }

  const res = NextResponse.next();
  securityHeaders.forEach(([key, value]) => res.headers.set(key, value));
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
