import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardWrapper } from "./dashboard-wrapper";
import { AppRole } from "@/lib/rbac";
import { getMenuItemsForRole } from "@/lib/rbac-server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const role = (session.user.role as AppRole) || "USER";
  const rawMenuItems = await getMenuItemsForRole(role);
  const menuItems = rawMenuItems.sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <DashboardWrapper user={session.user} menuItems={menuItems}>
      {children}
    </DashboardWrapper>
  );
}
