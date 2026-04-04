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
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  role?: "ADMIN" | "USER" | "ALL";
}

const mainNavItems: SidebarItem[] = [
  { label: "Tổng quan", href: "/", icon: LayoutDashboard, role: "ALL" },
  { label: "Dự án", href: "/du-an", icon: FolderKanban, role: "ALL" },
  { label: "Nhân sự", href: "/nhan-su", icon: Users, role: "ALL" },
  { label: "KPI", href: "/kpi", icon: TrendingUp, role: "ALL" },
  { label: "Địa bàn", href: "/dia-ban", icon: MapPin, role: "ALL" },
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

  const renderNavItems = (items: SidebarItem[]) => {
    return items
      .filter((item) => item.role === "ALL" || item.role === userRole)
      .map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
              isActive 
                ? "bg-white/10 text-white font-medium" 
                : "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn("shrink-0", isCollapsed ? "size-6" : "size-5")} />
            {!isCollapsed && <span className="text-sm">{item.label}</span>}
            
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
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
        "relative flex flex-col h-screen transition-all duration-300 ease-in-out z-40",
        "bg-gradient-to-b from-[#003466] to-[#005BAA]", // MobiFone Gradient
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className={cn("p-6 flex items-center mb-6", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
              <span className="text-[#003466] font-bold text-lg leading-none">M</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Project Tracker</span>
          </div>
        )}
        {isCollapsed && (
          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
             <span className="text-[#003466] font-bold text-xl leading-none">M</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {renderNavItems(mainNavItems)}

        {userRole === "ADMIN" && (
          <div className="mt-8 space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] uppercase font-bold text-white/40 tracking-wider mb-2">
                Quản lý hệ thống
              </p>
            )}
            {renderNavItems(adminNavItems)}
          </div>
        )}
      </nav>

      {/* Sidebar Footer / Toggle */}
      <div className="p-4 mt-auto border-t border-white/10">
         <Button 
           variant="ghost" 
           size="icon" 
           onClick={() => setIsCollapsed(!isCollapsed)}
           className="w-full justify-center text-white/70 hover:text-white hover:bg-white/10"
         >
           {isCollapsed ? <Menu className="size-5" /> : <ChevronLeft className="size-5" />}
         </Button>
      </div>
    </aside>
  );
}
