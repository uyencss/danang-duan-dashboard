

export type AppRole = "ADMIN" | "USER" | "AM" | "CV";

export interface RoleMetadata {
  label: string;
  description: string;
  badgeColor: string;
  textColor: string;
  borderColor: string;
  color?: string;
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

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { pattern: "/", roles: ALL_ROLES, exact: true },
  { pattern: "/du-an/tao-moi", roles: ALL_ROLES },
  { pattern: "/du-an", roles: ALL_ROLES, exact: true },
  { pattern: "/du-an/", roles: ALL_ROLES },
  { pattern: "/admin/khach-hang", roles: ALL_ROLES },
  { pattern: "/admin/kpi", roles: ALL_ROLES },
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

// Server-side database functions have been moved to rbac-server.ts

export function matchRequiredRoles(pathname: string, permissions: RoutePermission[]): AppRole[] {
  for (const perm of permissions) {
    if (perm.exact) {
      if (pathname === perm.pattern) return perm.roles;
    } else {
      if (pathname === perm.pattern || pathname.startsWith(perm.pattern + "/") || pathname.startsWith(perm.pattern)) {
        return perm.roles;
      }
    }
  }
  return ALL_ROLES;
}

export function getRequiredRoles(pathname: string, permissions: RoutePermission[] = ROUTE_PERMISSIONS): AppRole[] {
  return matchRequiredRoles(pathname, permissions);
}

export function getRequiredRolesSync(pathname: string, permissions: RoutePermission[] = ROUTE_PERMISSIONS): AppRole[] {
  return matchRequiredRoles(pathname, permissions);
}

export function canRoleAccess(role: AppRole, pathname: string, permissions: RoutePermission[] = ROUTE_PERMISSIONS): boolean {
  const required = getRequiredRolesSync(pathname, permissions);
  return required.includes(role);
}

