import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AppRole = "ADMIN" | "USER" | "AM" | "CV";

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
  const sessionRes = await (auth.api as any).getSession({
    headers: await headers()
  });
  const user = sessionRes?.user;

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
