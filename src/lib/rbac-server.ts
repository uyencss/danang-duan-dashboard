import prisma from "@/lib/prisma";
import { AppRole, ROUTE_PERMISSIONS, ROLE_METADATA, RoutePermission } from "@/lib/rbac";
import { unstable_cache } from "next/cache";
import { withCache, cacheInvalidate } from "@/lib/cache";

// Returns the generated MenuPermissions dynamically, matching RoutePermission signature
async function fetchMenuPermissions(): Promise<RoutePermission[]> {
  try {
    const perms = await prisma.menuPermission.findMany({
      include: { menu: true },
    });

    if (!perms || perms.length === 0) {
      return ROUTE_PERMISSIONS; // Fallback
    }

    // Group roles by menuKey
    const menuRoles: Record<string, { href: string; roles: AppRole[] }> = {};

    for (const p of perms) {
      if (!menuRoles[p.menuKey]) {
        menuRoles[p.menuKey] = { href: p.menu.href, roles: [] };
      }
      if (p.canView) {
        menuRoles[p.menuKey].roles.push(p.role as AppRole);
      }
    }

    const generated: RoutePermission[] = [
      { pattern: "/", roles: ["ADMIN", "USER", "AM", "CV"], exact: true }, // Dashboard is baseline
    ];

    for (const key in menuRoles) {
      if (menuRoles[key].href !== "/") {
        generated.push({
          pattern: menuRoles[key].href,
          roles: menuRoles[key].roles,
          exact: menuRoles[key].href.split("/").length <= 2, // basic exact match logic
        });
      }
    }

    return generated;
  } catch (error) {
    console.error("Error fetching RBAC from DB:", error);
    return ROUTE_PERMISSIONS;
  }
}

export const getMenuPermissionsFromDB = unstable_cache(
  () => withCache("rbac:permissions", 600, fetchMenuPermissions),
  ["rbac-permissions"],
  { tags: ["rbac"], revalidate: 30 }
);

async function fetchRoleConfigs() {
  try {
    const config = await prisma.roleConfig.findMany();
    if (!config || config.length === 0) {
      return ROLE_METADATA; // Fallback
    }

    const result: Record<string, any> = {};
    for (const c of config) {
      result[c.role] = {
        label: c.label,
        description: c.description || "",
        badgeColor: `bg-${c.color}-50`,
        textColor: `text-${c.color}-700`,
        borderColor: `border-${c.color}-200`,
      };
    }
    return result as typeof ROLE_METADATA;
  } catch (e) {
    return ROLE_METADATA;
  }
}

export const getRoleConfigsFromDB = unstable_cache(
  () => withCache("rbac:role-configs", 600, fetchRoleConfigs),
  ["rbac-role-configs"],
  { tags: ["rbac"], revalidate: 30 }
);

async function fetchMenuItems() {
  try {
    return await prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
    });
  } catch (e) {
    return [];
  }
}

export const getMenuItemsFromDB = unstable_cache(
  () => withCache("rbac:menu-items", 600, fetchMenuItems),
  ["rbac-menu-items"],
  { tags: ["rbac"], revalidate: 30 }
);

export async function invalidateRbacCache() {
  await cacheInvalidate("rbac:permissions", "rbac:role-configs", "rbac:menu-items");
  const { revalidateTag } = require("next/cache");
  revalidateTag("rbac");
}

export async function getMenuItemsForRole(role: AppRole) {
  try {
    const records = await prisma.menuPermission.findMany({
      where: { role, canView: true, menu: { isActive: true } },
      include: { menu: true },
    });
    return records
      .map(r => r.menu)
      .filter((menu): menu is NonNullable<typeof menu> => !!menu)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  } catch (e) {
    console.warn("Failed to get menu items from DB", e);
    return [];
  }
}
