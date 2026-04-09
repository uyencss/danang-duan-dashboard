export type AppRole = "ADMIN" | "USER" | "AM" | "CV";

export interface RoleMetadata {
  label: string;
  description: string;
  badgeColor: string;
  textColor: string;
  borderColor: string;
}

export const ROLE_METADATA: Record<AppRole, RoleMetadata> = {
  ADMIN: {
    label: "Quản trị viên (Admin)",
    description: "Toàn quyền quản trị hệ thống, quản lý user, cấu hình, và tất cả chức năng.",
    badgeColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
  USER: {
    label: "Quản trị viên (Chuyên viên)",
    description: "Truy cập tất cả chức năng, quản lý dự án, nhân sự, KPI và báo cáo.",
    badgeColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
  },
  AM: {
    label: "AM",
    description: "Quản lý khách hàng và dự án được giao. Truy cập Dashboard, CRM, Khách hàng, Giao KPI.",
    badgeColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  CV: {
    label: "Chuyên viên (CV)",
    description: "Thực hiện dự án được giao. Truy cập Dashboard, CRM, Khách hàng, Giao KPI.",
    badgeColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
};

export const ALL_ROLES: AppRole[] = ["ADMIN", "USER", "AM", "CV"];
const MANAGER_ROLES: AppRole[] = ["ADMIN", "USER"];

export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/api/auth",
];

export const STATIC_PREFIXES = [
  "/_next",
  "/favicon.ico",
  "/logo.png",
  "/Mau_Danh_Sach_Nhan_Vien.csv",
];

export interface RoutePermission {
  pattern: string;
  roles: AppRole[];
  exact?: boolean;
}

/**
 * Route-to-role mapping. Order matters: more specific patterns first.
 * Routes not listed here default to ALL authenticated users.
 */
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // --- ALL roles ---
  { pattern: "/", roles: ALL_ROLES, exact: true },
  { pattern: "/du-an/tao-moi", roles: ALL_ROLES },
  { pattern: "/du-an", roles: ALL_ROLES, exact: true },
  { pattern: "/du-an/", roles: ALL_ROLES },
  { pattern: "/admin/khach-hang", roles: ALL_ROLES },
  { pattern: "/admin/kpi", roles: ALL_ROLES },

  // --- ADMIN + USER only ---
  { pattern: "/kpi", roles: MANAGER_ROLES },
  { pattern: "/dia-ban", roles: MANAGER_ROLES },
  { pattern: "/quan-ly-am", roles: MANAGER_ROLES },
  { pattern: "/quan-ly-cv", roles: MANAGER_ROLES },
  { pattern: "/admin/san-pham", roles: MANAGER_ROLES },
  { pattern: "/admin/users", roles: MANAGER_ROLES },
  { pattern: "/admin/du-an-da-xoa", roles: MANAGER_ROLES },
  { pattern: "/du-an/tracking", roles: MANAGER_ROLES },
  { pattern: "/email-service", roles: MANAGER_ROLES },
];

/**
 * Match a pathname against the ROUTE_PERMISSIONS config.
 * Returns the allowed roles for the matched route, or ALL_ROLES if no match.
 */
export function getRequiredRoles(pathname: string): AppRole[] {
  for (const perm of ROUTE_PERMISSIONS) {
    if (perm.exact) {
      if (pathname === perm.pattern) return perm.roles;
    } else {
      if (pathname === perm.pattern || pathname.startsWith(perm.pattern + "/") || pathname.startsWith(perm.pattern)) {
        return perm.roles;
      }
    }
  }
  // Default: all authenticated users can access unlisted routes
  return ALL_ROLES;
}

/**
 * Check if a role can access a given route.
 */
export function canRoleAccess(role: AppRole, pathname: string): boolean {
  const required = getRequiredRoles(pathname);
  return required.includes(role);
}
