import { type NextRequest, NextResponse } from "next/server";
import { matchRequiredRoles, PUBLIC_ROUTES, STATIC_PREFIXES, ROUTE_PERMISSIONS } from "@/lib/rbac";
import type { AppRole, RoutePermission } from "@/lib/rbac";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const reqId = crypto.randomUUID();
  requestHeaders.set("x-request-id", reqId);

  const withHeaders = (res: NextResponse) => {
    res.headers.set("x-request-id", reqId);
    return res;
  };

  const path = request.nextUrl.pathname;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasSessionCookie =
    Boolean(request.cookies.get("__Secure-better-auth.session_token")?.value) ||
    Boolean(request.cookies.get("better-auth.session_token")?.value);

  // Allow static assets and internal Next.js routes through
  if (STATIC_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // Always allow Better Auth endpoints through
  if (path.startsWith("/api/auth")) {
    return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // Allow additional public routes (excluding auth pages handled above)
  if (
    PUBLIC_ROUTES.some(
      (route) => route !== "/login" && route !== "/register" && path.startsWith(route),
    )
  ) {
    return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // Allow non-auth API routes through (they handle their own auth)
  if (path.startsWith("/api/")) {
    return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // We use localhost for internal fetches to bypass Cloudflare full-roundtrips and SSL mismatch errors.
  const internalUrl = process.env.INTERNAL_APP_URL || "http://127.0.0.1:3000";

  // Fetch session FIRST if cookie exists, to prevent zombie cookie redirect loops
  let session: { user?: { role?: string } } | null = null;
  if (hasSessionCookie) {
    try {
      const res = await fetch(`${internalUrl}/api/auth/get-session`, {
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        cache: "no-store",
      });
      if (res.ok) {
        session = await res.json();
      }
    } catch (e) {
      console.error("[proxy] Failed to fetch session:", e);
    }
  }

  // Keep login/register public, but redirect users that have a TRULY VALID session.
  if (path.startsWith("/login") || path.startsWith("/register")) {
    if (session?.user) {
      return withHeaders(NextResponse.redirect(new URL("/", request.url)));
    }
    // If they have a cookie but it's invalid (old deployment), let them see the login page!
    return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // Protected pages strictly require a VERIFIED session.
  // If the session is invalid or missing, bounce to login.
  if (!session?.user) {
    return withHeaders(NextResponse.redirect(new URL("/login", request.url)));
  }

  // Fetch RBAC config (cached)
  let rbacConfig: RoutePermission[] = ROUTE_PERMISSIONS;
  try {
    const res = await fetch(`${internalUrl}/api/rbac/config`, {
      next: { revalidate: 30 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.permissions)) {
        rbacConfig = data.permissions;
      }
    }
  } catch (e) {
    console.error("[proxy] Failed to fetch RBAC config:", e);
  }

  // RBAC: check if user's role is allowed for this route
  const userRole = ((session?.user?.role as string) || "CV") as AppRole;
  const allowedRoles = matchRequiredRoles(path, rbacConfig);

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
