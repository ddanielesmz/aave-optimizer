import { NextResponse } from "next/server";

const securityHeaders = [
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "geolocation=(), microphone=(), camera=()"],
  ["Cross-Origin-Resource-Policy", "same-site"],
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push([
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  ]);
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (req.method === "OPTIONS") {
    const res = NextResponse.next();
    securityHeaders.forEach(([key, value]) => res.headers.set(key, value));
    return res;
  }

  // Allow asset files
  if (pathname.match(/\.(.*)$/)) {
    const res = NextResponse.next();
    securityHeaders.forEach(([key, value]) => res.headers.set(key, value));
    return res;
  }

  // Apply security headers to all requests
  const res = NextResponse.next();
  securityHeaders.forEach(([key, value]) => res.headers.set(key, value));
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
