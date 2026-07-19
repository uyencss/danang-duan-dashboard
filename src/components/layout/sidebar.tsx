"use client";

import Link from "next/link";
import { useState } from "react";
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
  ChevronDown,
  Menu,
  PlusCircle,
  UserCheck,
  GraduationCap,
  Target,
  Trash2,
  ClipboardList,
  Shield,
  Settings,
  Users,
  BarChart3,
} from "lucide-react";

import type { AppRole } from "@/lib/rbac";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  FolderKanban,
  Building2,
  TrendingUp,
  MapPin,
  UserCheck,
  GraduationCap,
  Package,
  UserCog,
  Target,
  ClipboardList,
  Trash2,
  Shield,
  Settings,
  Users,
  BarChart3,
};

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Roles that can see this item. If undefined or empty, all roles can see it. */
  allowedRoles?: AppRole[];
}

interface SidebarProps {
  userRole: AppRole;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  dbMenuItems?: any[];
  isMobile?: boolean;
  onItemClick?: () => void;
}

// ── Collapsible group configuration ──
// Maps href patterns to group names. Items matching these hrefs will be
// grouped under a collapsible parent instead of shown as top-level items.
const COLLAPSIBLE_GROUPS: {
  groupLabel: string;
  groupIcon: React.ElementType;
  childHrefs: string[];
}[] = [
  {
    groupLabel: "Xu hướng & Địa bàn",
    groupIcon: BarChart3,
    childHrefs: ["/kpi", "/dia-ban"],
  },
  {
    groupLabel: "Quản lý nhân sự",
    groupIcon: Users,
    childHrefs: ["/quan-ly-am", "/quan-ly-cv"],
  },
];

// ── Desired order for main items (by href) ──
const MAIN_ORDER = [
  "/",                // Dashboard tổng quan
  "/giam-doc-theo-doi", // Lãnh đạo theo dõi
  "/du-an",           // CRM & Dự án
  "group:Xu hướng & Địa bàn",
  "group:Quản lý nhân sự",
  "/nhu-cau-catp",    // Khảo sát CATP
];

// ── Desired order for admin items (by label, case-insensitive) ──
const ADMIN_LABEL_ORDER = [
  "giao kpi",
  "theo dõi các bước",
  "dự án đã xoá",
  "dự án đã xóa",
  "sản phẩm",
  "khách hàng",
  "quản lý user",
  "phân quyền",
];

function sortByLabelOrder(items: SidebarItem[], labelOrder: string[]): SidebarItem[] {
  return [...items].sort((a, b) => {
    const ai = labelOrder.findIndex(l => a.label.toLowerCase().includes(l));
    const bi = labelOrder.findIndex(l => b.label.toLowerCase().includes(l));
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export function Sidebar({ 
  userRole, 
  isCollapsed, 
  setIsCollapsed, 
  dbMenuItems = [],
  isMobile = false,
  onItemClick
}: SidebarProps) {
  const pathname = usePathname();

  // Track which collapsible groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Auto-open group if current pathname is inside it
    const initial: Record<string, boolean> = {};
    COLLAPSIBLE_GROUPS.forEach(g => {
      initial[g.groupLabel] = g.childHrefs.some(h => pathname.startsWith(h));
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  let finalMainItems: SidebarItem[] = [];
  let finalAdminItems: SidebarItem[] = [];

  const mainDb = dbMenuItems.filter(item => item && item.section === "main");
  const adminDb = dbMenuItems.filter(item => item && item.section === "admin");
  const mapDbItems = (dbItems: any[]): SidebarItem[] => {
    return dbItems
      .filter(Boolean)
      .map(item => ({
        label: item.label,
        href: item.href,
        icon: ICON_MAP[item.icon] || LayoutDashboard,
        allowedRoles: ["ADMIN", "USER", "AM", "CV", "LEADER"], 
      }));
  };
  finalMainItems = mapDbItems(mainDb);
  finalAdminItems = sortByLabelOrder(mapDbItems(adminDb), ADMIN_LABEL_ORDER);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isItemVisible = (item: SidebarItem) => {
    return true; // Already filtered by RBAC in layout

  };

  // Identify which main items belong to collapsible groups
  const groupedHrefs = new Set(COLLAPSIBLE_GROUPS.flatMap(g => g.childHrefs));

  // Top-level items = items NOT in any collapsible group
  const topLevelItems = finalMainItems.filter(item => !groupedHrefs.has(item.href));

  // Build ordered rendering sequence
  const renderMainNav = () => {
    // Build a mixed list of top-level items and group placeholders
    const sequence: { type: "item"; item: SidebarItem }[] | { type: "group"; group: typeof COLLAPSIBLE_GROUPS[0] }[] = [];

    // Create the ordered sequence from MAIN_ORDER
    const rendered: React.ReactNode[] = [];

    MAIN_ORDER.forEach(key => {
      if (key.startsWith("group:")) {
        const groupLabel = key.replace("group:", "");
        const groupDef = COLLAPSIBLE_GROUPS.find(g => g.groupLabel === groupLabel);
        if (groupDef) {
          const children = finalMainItems.filter(item => groupDef.childHrefs.includes(item.href));
          if (children.length > 0) {
            rendered.push(renderCollapsibleGroup(groupDef, children));
          }
        }
      } else {
        const item = topLevelItems.find(i => i.href === key);
        if (item && isItemVisible(item)) {
          rendered.push(renderSingleItem(item));
        }
      }
    });

    // Any remaining items not in MAIN_ORDER
    const orderedHrefs = MAIN_ORDER.filter(k => !k.startsWith("group:"));
    topLevelItems.forEach(item => {
      if (!orderedHrefs.includes(item.href) && isItemVisible(item)) {
        rendered.push(renderSingleItem(item));
      }
    });

    return rendered;
  };

  const renderSingleItem = (item: SidebarItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onItemClick}
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
          active ? "text-[#60a5fa]" : "text-slate-300/70 group-hover:text-white",
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
  };

  const renderCollapsibleGroup = (
    groupDef: typeof COLLAPSIBLE_GROUPS[0],
    children: SidebarItem[]
  ) => {
    const isOpen = openGroups[groupDef.groupLabel] ?? false;
    const hasActiveChild = children.some(c => isActive(c.href));
    const GroupIcon = groupDef.groupIcon;

    // Sort children to match the order in childHrefs
    const sortedChildren = [...children].sort(
      (a, b) => groupDef.childHrefs.indexOf(a.href) - groupDef.childHrefs.indexOf(b.href)
    );

    return (
      <div key={groupDef.groupLabel}>
        {/* Group toggle button */}
        <button
          onClick={() => toggleGroup(groupDef.groupLabel)}
          title={isCollapsed ? groupDef.groupLabel : undefined}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all duration-200 group relative",
            hasActiveChild
              ? "text-white font-bold"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <GroupIcon className={cn(
            "shrink-0 transition-colors",
            hasActiveChild ? "text-[#60a5fa]" : "text-slate-300/70 group-hover:text-white",
            isCollapsed ? "size-6" : "size-5"
          )} />
          {!isCollapsed && (
            <>
              <span className="text-sm font-medium tracking-wide uppercase flex-1 text-left">
                {groupDef.groupLabel}
              </span>
              <ChevronDown className={cn(
                "size-4 transition-transform duration-200",
                isOpen ? "rotate-180" : ""
              )} />
            </>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50 shadow-xl">
              {groupDef.groupLabel}
            </div>
          )}
        </button>

        {/* Children — shown when expanded (or always in collapsed tooltip mode) */}
        {!isCollapsed && (
          <div className={cn(
            "overflow-hidden transition-all duration-200",
            isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-0.5">
              {sortedChildren.map(child => {
                const active = isActive(child.href);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-[13px]",
                      active
                        ? "bg-white/10 text-white font-bold"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <child.icon className={cn(
                      "size-4 shrink-0",
                      active ? "text-[#60a5fa]" : "text-slate-400"
                    )} />
                    <span className="font-medium uppercase tracking-wide">
                      {child.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNavItems = (items: SidebarItem[]) => {
    return items
      .filter(isItemVisible)
      .map((item) => renderSingleItem(item));
  };

  // Check if the user can see any admin section items
  const visibleAdminItems = finalAdminItems.filter(isItemVisible);
  const showAdminSection = visibleAdminItems.length > 0;

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen transition-all duration-300 ease-in-out z-40 shadow-2xl border-r border-[#0053cf]/30",
        "bg-gradient-to-b from-[#002d6b] via-[#003b8b] to-[#002d6b]",
        isCollapsed ? "w-20" : "w-72",
        isMobile && "w-full border-none shadow-none"
      )}
    >
      {/* Brand */}
      <div className={cn("px-4 py-5 mb-0", isCollapsed ? "flex justify-center" : "px-8")}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,83,207,0.4)] ring-1 ring-blue-300/50">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tighter leading-none flex items-baseline">
                <span className="text-white">mobi</span><span className="text-red-500">fone</span>
              </h1>
              <p className="text-blue-300 text-[10px] sm:text-xs mt-1 uppercase tracking-[0.1em] font-black drop-shadow-sm leading-none">
                Dự án
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(0,83,207,0.3)] ring-1 ring-blue-300/50 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {renderMainNav()}

        {showAdminSection && (
          <div className="mt-4 space-y-1">
            {!isCollapsed && (
              <p className="px-4 text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1.5">
                Quản trị
              </p>
            )}
            <div className="border-t border-white/5 pt-2">
              {renderNavItems(finalAdminItems)}
            </div>
          </div>
        )}
      </nav>

      {/* CTA Button — always visible to ALL roles */}
      <div className={cn("p-3 border-t border-white/5", isCollapsed ? "flex justify-center" : "px-4")}>
        {!isCollapsed ? (
          <Link
            href="/du-an/tao-moi"
            className="relative w-full py-3 rounded-xl bg-gradient-to-r from-[#0053cf] to-[#3b82f6] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:from-[#0053cf] hover:to-[#60a5fa] hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,83,207,0.4)] transition-all overflow-hidden group"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <PlusCircle className="size-4 relative z-10" />
            <span className="relative z-10">Khởi tạo Dự án CĐS</span>
          </Link>
        ) : (
          <Link
            href="/du-an/tao-moi"
            title="Tạo Dự án Mới"
            className="w-10 h-10 rounded-xl bg-[#0053cf] text-white flex items-center justify-center hover:bg-[#003c8c] transition-all"
          >
            <PlusCircle className="size-5" />
          </Link>
        )}
      </div>

      {/* Toggle Button */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#003c8c] border border-white/15 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors shadow-lg"
        >
          {isCollapsed ? <Menu className="size-3" /> : <ChevronLeft className="size-3" />}
        </button>
      )}
    </aside>
  );
}
