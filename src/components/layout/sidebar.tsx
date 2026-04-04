"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  TrendingUp,
  MapPin,
  Building2,
  Package,
  UserCog,
  Shield,
  ChevronLeft,
  Menu,
  PlusCircle,
} from "lucide-react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  role?: "ADMIN" | "USER" | "ALL";
}

const mainNavItems: SidebarItem[] = [
  { label: "Dashboard Tổng quan", href: "/", icon: LayoutDashboard, role: "ALL" },
  { label: "CRM & DS Dự án", href: "/du-an", icon: FolderKanban, role: "ALL" },
  { label: "Tổng hợp Nhân sự", href: "/nhan-su", icon: Users, role: "ALL" },
  { label: "Phân tích & KPI", href: "/kpi", icon: TrendingUp, role: "ALL" },
  { label: "Top Địa bàn", href: "/dia-ban", icon: MapPin, role: "ALL" },
];

const adminNavItems: SidebarItem[] = [
  { label: "Khách hàng", href: "/admin/khach-hang", icon: Building2, role: "ADMIN" },
  { label: "Sản phẩm", href: "/admin/san-pham", icon: Package, role: "ADMIN" },
  { label: "Nhân viên", href: "/admin/nhan-vien", icon: UserCog, role: "ADMIN" },
  { label: "Tài khoản", href: "/admin/users", icon: Shield, role: "ADMIN" },
];

interface SidebarProps {
  userRole: "ADMIN" | "USER";
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ userRole, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const renderNavItems = (items: SidebarItem[]) => {
    return items
      .filter((item) => item.role === "ALL" || item.role === userRole)
      .map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative",
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

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen transition-all duration-300 ease-in-out z-40 shadow-2xl",
        "bg-[#0D1F3C]",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Brand */}
      <div className={cn("px-4 py-8 mb-2", isCollapsed ? "flex justify-center" : "px-8")}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#000719] to-[#0d1f3c] flex items-center justify-center shadow-lg ring-1 ring-white/10">
              <span className="text-white font-black text-xl">M</span>
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight leading-none">MobiFone</h1>
              <p className="text-slate-400 text-[10px] mt-0.5 uppercase tracking-widest font-bold">
                Project Tracker
              </p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#000719] to-[#0d1f3c] flex items-center justify-center ring-1 ring-white/10">
            <span className="text-white font-black text-xl">M</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {renderNavItems(mainNavItems)}

        {userRole === "ADMIN" && (
          <div className="mt-8 space-y-1">
            {!isCollapsed && (
              <p className="px-4 text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">
                Admin
              </p>
            )}
            <div className="border-t border-white/5 pt-4">
              {renderNavItems(adminNavItems)}
            </div>
          </div>
        )}
      </nav>

      {/* CTA Button */}
      <div className={cn("p-4 border-t border-white/5", isCollapsed ? "flex justify-center" : "px-4")}>
        {!isCollapsed ? (
          <Link
            href="/du-an/tao-moi"
            className="w-full py-3 rounded-xl bg-[#0070eb] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#0058bc] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-900/30"
          >
            <PlusCircle className="size-4" />
            Tạo Dự án Mới
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
