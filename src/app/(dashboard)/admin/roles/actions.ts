"use server";

import prisma from "@/lib/prisma";
import { AppRole } from "@/lib/rbac";
import { invalidateRbacCache } from "@/lib/rbac-server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized: ADMIN role required");
  }
  return session;
}

export async function getMenuItems() {
  return await prisma.menuItem.findMany({
    where: { isActive: true },
    orderBy: [
      { section: "asc" },
      { sortOrder: "asc" },
    ],
  });
}

export async function getPermissionsForRole(role: AppRole) {
  return await prisma.menuPermission.findMany({
    where: { role },
  });
}

export async function getAllPermissions() {
  return await prisma.menuPermission.findMany();
}

export async function getRoleConfigs() {
  return await prisma.roleConfig.findMany();
}

export type PermissionInput = {
  menuKey: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export async function updatePermissionsForRole(role: AppRole, permissions: PermissionInput[]) {
  const session = await requireAdmin();

  // Validate the inputs
  if (!permissions || !Array.isArray(permissions)) {
    throw new Error("Invalid permissions format");
  }

  await prisma.$transaction(
    permissions.map((p) =>
      prisma.menuPermission.upsert({
        where: {
          menuKey_role: {
            menuKey: p.menuKey,
            role,
          },
        },
        update: {
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        },
        create: {
          menuKey: p.menuKey,
          role,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        },
      })
    )
  );

  invalidateRbacCache();
  revalidatePath("/admin/roles");
  revalidatePath("/", "layout");
  
  return { success: true };
}

export async function updateRoleConfig(
  role: AppRole,
  data: { label: string; description: string; color: string }
) {
  const session = await requireAdmin();

  await prisma.roleConfig.upsert({
    where: { role },
    update: {
      label: data.label,
      description: data.description,
      color: data.color,
      updatedBy: session.user.id,
    },
    create: {
      role,
      label: data.label,
      description: data.description,
      color: data.color,
      updatedBy: session.user.id,
    },
  });

  invalidateRbacCache();
  revalidatePath("/admin/roles");
  
  return { success: true };
}
