import { type NextRequest, NextResponse } from "next/server";
import { getRequiredRoles, PUBLIC_ROUTES, STATIC_PREFIXES } from "@/lib/rbac";
import type { AppRole } from "@/lib/rbac";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const reqId = crypto.randomUUID();
  requestHeaders.set("x-request-id", reqId);

  const withHeaders = (res: NextResponse) => {
    res.headers.set("x-request-id", reqId);
    return res;
  };

  const path = request.nextUrl.pathname;

  // Allow static assets and internal Next.js routes through
  if (STATIC_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // Allow public routes (auth API, login, register)
  if (PUBLIC_ROUTES.some((route) => path.startsWith(route))) {
    return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // Allow non-auth API routes through (they handle their own auth)
  if (path.startsWith("/api/")) {
    return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // Fetch session for protected routes
  let session: { user?: { role?: string } } | null = null;
  try {
    const baseUrl = request.nextUrl.origin;
    const res = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    if (res.ok) {
      session = await res.json();
    }
  } catch (e) {
    console.error("[proxy] Failed to fetch session:", e);
  }

  // Redirect unauthenticated users to login
  if (!session) {
    return withHeaders(NextResponse.redirect(new URL("/login", request.url)));
  }

  // Redirect authenticated users away from login/register
  if (path.startsWith("/login") || path.startsWith("/register")) {
    return withHeaders(NextResponse.redirect(new URL("/", request.url)));
  }

  // RBAC: check if user's role is allowed for this route
  const userRole = ((session?.user?.role as string) || "CV") as AppRole;
  const allowedRoles = getRequiredRoles(path);

  if (!allowedRoles.includes(userRole)) {
    return withHeaders(NextResponse.redirect(new URL("/du-an", request.url)));
  }

  return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
