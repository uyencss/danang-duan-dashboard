import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Pass a simple request ID for tracking
  const requestHeaders = new Headers(request.headers);
  const reqId = crypto.randomUUID();
  requestHeaders.set("x-request-id", reqId);

  // You can also log at the edge here if desired, but Pino is better suited
  // for Node.js runtime (not Edge). Thus, we only set headers here.
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  response.headers.set("x-request-id", reqId);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|.*\\..*).*)',
  ],
};
