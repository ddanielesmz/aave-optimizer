// No-op middleware: authentication disabled, allow all requests
export default function middleware(req) {
  return;
}

// Keep matcher to preserve existing route handling, but do not enforce auth
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}