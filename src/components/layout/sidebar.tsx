"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  TrendingUp,
  MapPin,
  Building2,
  Package,
  UserCog,
  ChevronLeft,
  Menu,
  PlusCircle,
  UserCheck,
  GraduationCap,
  Target,
  Trash2,
  ClipboardList,
} from "lucide-react";

import type { AppRole } from "@/lib/rbac";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Roles that can see this item. If undefined or empty, all roles can see it. */
  allowedRoles?: AppRole[];
}

// Main nav items — role-based visibility
const mainNavItems: SidebarItem[] = [
  // Dashboard Tổng quan — Visible to ALL (ADMIN, USER, CV, AM)
  { label: "Dashboard Tổng quan", href: "/", icon: LayoutDashboard },
  // CRM & DS Dự án — Visible to ALL
  { label: "CRM & DS Dự án", href: "/du-an", icon: FolderKanban },
  // Khách hàng — Visible to ALL
  { label: "Khách hàng", href: "/admin/khach-hang", icon: Building2 },
  // Phân tích & KPI — Hidden for CV, AM
  { label: "Phân tích & KPI", href: "/kpi", icon: TrendingUp, allowedRoles: ["ADMIN", "USER"] },
  // Top Địa bàn — Hidden for CV, AM
  { label: "Top Địa bàn", href: "/dia-ban", icon: MapPin, allowedRoles: ["ADMIN", "USER"] },
  // Quản lý AM — Hidden for CV, AM
  { label: "Quản lý AM", href: "/quan-ly-am", icon: UserCheck, allowedRoles: ["ADMIN", "USER"] },
  // Quản lý Chuyên viên — Hidden for CV, AM
  { label: "Quản lý Chuyên viên", href: "/quan-ly-cv", icon: GraduationCap, allowedRoles: ["ADMIN", "USER"] },
];

// Admin section nav items
const adminNavItems: SidebarItem[] = [
  // Sản phẩm — Hidden for CV, AM
  { label: "Sản phẩm", href: "/admin/san-pham", icon: Package, allowedRoles: ["ADMIN", "USER"] },
  // Quản lý User — Hidden for CV, AM
  { label: "Quản lý User", href: "/admin/users", icon: UserCog, allowedRoles: ["ADMIN", "USER"] },
  // Giao KPI — Visible to ALL per request
  { label: "Giao KPI", href: "/admin/kpi", icon: Target },
  // Theo dõi các bước — Hidden for CV, AM
  { label: "Theo dõi các bước", href: "/du-an/tracking", icon: ClipboardList, allowedRoles: ["ADMIN", "USER"] },
  // Dự án đã xoá — Hidden for CV, AM
  { label: "Dự án đã xoá", href: "/admin/du-an-da-xoa", icon: Trash2, allowedRoles: ["ADMIN", "USER"] },
];

interface SidebarProps {
  userRole: AppRole;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ userRole, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isItemVisible = (item: SidebarItem) => {
    // ADMIN and USER see everything
    if (userRole === "ADMIN" || userRole === "USER") return true;
    // For others (AM, CV), check allowedRoles
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
    return item.allowedRoles.includes(userRole);
  };

  const renderNavItems = (items: SidebarItem[]) => {
    return items
      .filter(isItemVisible)
      .map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all duration-200 group relative",
              active
                ? "bg-white/10 text-white font-bold scale-[0.98]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn(
              "shrink-0 transition-colors",
              active ? "text-[#0070eb]" : "text-slate-400 group-hover:text-white",
              isCollapsed ? "size-6" : "size-5"
            )} />
            {!isCollapsed && (
              <span className="text-sm font-medium tracking-wide uppercase">
                {item.label}
              </span>
            )}

            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50 shadow-xl">
                {item.label}
              </div>
            )}
          </Link>
        );
      });
  };

  // Check if the user can see any admin section items
  const visibleAdminItems = adminNavItems.filter(isItemVisible);
  const showAdminSection = visibleAdminItems.length > 0;

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen transition-all duration-300 ease-in-out z-40 shadow-2xl border-r border-[#0058bc]/20",
        "bg-gradient-to-b from-[#0a192f] via-[#0d2a52] to-[#0a192f]",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Brand */}
      <div className={cn("px-4 py-5 mb-0", isCollapsed ? "flex justify-center" : "px-8")}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,180,216,0.4)] ring-1 ring-cyan-200/50">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tighter leading-none flex items-baseline">
                <span className="text-white">mobi</span><span className="text-red-500">fone</span>
              </h1>
              <p className="text-cyan-400 text-sm mt-1 uppercase tracking-[0.2em] font-black drop-shadow-sm leading-none">
                DỰ ÁN
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(0,180,216,0.3)] ring-1 ring-cyan-200/50 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {renderNavItems(mainNavItems)}

        {showAdminSection && (
          <div className="mt-4 space-y-1">
            {!isCollapsed && (
              <p className="px-4 text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1.5">
                Quản trị
              </p>
            )}
            <div className="border-t border-white/5 pt-2">
              {renderNavItems(adminNavItems)}
            </div>
          </div>
        )}
      </nav>

      {/* CTA Button — always visible to ALL roles */}
      <div className={cn("p-3 border-t border-white/5", isCollapsed ? "flex justify-center" : "px-4")}>
        {!isCollapsed ? (
          <Link
            href="/du-an/tao-moi"
            className="relative w-full py-3 rounded-xl bg-gradient-to-r from-[#0058bc] to-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:from-blue-600 hover:to-cyan-500 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,180,216,0.3)] transition-all overflow-hidden group"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <PlusCircle className="size-4 relative z-10" />
            <span className="relative z-10">Khởi tạo Dự án CĐS</span>
          </Link>
        ) : (
          <Link
            href="/du-an/tao-moi"
            title="Tạo Dự án Mới"
            className="w-10 h-10 rounded-xl bg-[#0070eb] text-white flex items-center justify-center hover:bg-[#0058bc] transition-all"
          >
            <PlusCircle className="size-5" />
          </Link>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#0D1F3C] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
      >
        {isCollapsed ? <Menu className="size-3" /> : <ChevronLeft className="size-3" />}
      </button>
    </aside>
  );
}
