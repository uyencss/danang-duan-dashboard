import { auth } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const path = request.nextUrl.pathname;

  // Allow public access to auth routes and static files
  if (path.startsWith("/api/auth") || path.startsWith("/_next") || path === "/favicon.ico") {
    return;
  }

  // Redirect to login if not authenticated and not already on the login/register pages
  if (!session && !path.startsWith("/login") && !path.startsWith("/register")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to home if authenticated and trying to access login/register
  if (session && (path.startsWith("/login") || path.startsWith("/register"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protected Admin-only routes
  if (path.startsWith("/admin") && session?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow the request to proceed
  return;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
