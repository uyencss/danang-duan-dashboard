import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type { AppRole } from "@/lib/rbac";

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}

/**
 * Require one of several roles. Redirects to /du-an if the user's role is not in the allowed list.
 */
export async function requireRole(...allowedRoles: AppRole[]) {
  const user = await getCurrentUser();

  if (!user || !allowedRoles.includes(user.role as AppRole)) {
    redirect("/du-an");
  }
  return user;
}

/**
 * Check if a role has access to a given set of allowed roles.
 */
export function hasAccess(userRole: string, allowedRoles: AppRole[]): boolean {
  return allowedRoles.includes(userRole as AppRole);
}

/**
 * Role guard for API route handlers. Returns the user or a 403 Response.
 */
export async function requireApiRole(...allowedRoles: AppRole[]): Promise<
  | { user: Record<string, unknown>; error?: never }
  | { user?: never; error: Response }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  if (!allowedRoles.includes(session.user.role as AppRole)) {
    return {
      error: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return { user: session.user as unknown as Record<string, unknown> };
}
