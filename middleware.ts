import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth(async function middleware(request) {
  // Allow all POST requests (Server Actions) to pass through
  // Server Actions handle their own authentication
  if (request.method === "POST") {
    return NextResponse.next();
  }

  // Allow API routes to handle their own auth
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const newHeaders = new Headers(request.headers);
  newHeaders.set("al-anis-url", request.url);

  return NextResponse.next({
    request: {
      headers: newHeaders,
    },
  });
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
