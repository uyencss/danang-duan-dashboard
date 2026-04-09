"use client";

import { ShieldCheck, ShieldAlert, UserCog, GraduationCap } from "lucide-react";
import { ROLE_METADATA, ALL_ROLES } from "@/lib/rbac";
import type { AppRole } from "@/lib/rbac";

const ROLE_ICONS: Record<AppRole, React.ElementType> = {
  ADMIN: ShieldCheck,
  USER: UserCog,
  AM: ShieldAlert,
  CV: GraduationCap,
};

const ROLE_PERMISSIONS_SUMMARY: Record<AppRole, string> = {
  ADMIN: "Tất cả chức năng + Quản trị hệ thống",
  USER: "Tất cả chức năng + Quản lý nhân sự",
  AM: "Dashboard, CRM, Khách hàng, Giao KPI",
  CV: "Dashboard, CRM, Khách hàng, Giao KPI",
};

interface RoleOverviewCardsProps {
  roleCounts: Record<string, number>;
}

export function RoleOverviewCards({ roleCounts }: RoleOverviewCardsProps) {
  const total = Object.values(roleCounts).reduce((sum, c) => sum + c, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {ALL_ROLES.map((role) => {
        const meta = ROLE_METADATA[role];
        const Icon = ROLE_ICONS[role];
        const count = roleCounts[role] || 0;

        return (
          <div
            key={role}
            className={`relative overflow-hidden rounded-2xl border ${meta.borderColor} ${meta.badgeColor} p-5 transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className={`text-xs font-black uppercase tracking-wider ${meta.textColor}`}>
                  {meta.label}
                </p>
                <p className="text-3xl font-black text-gray-900">{count}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${meta.badgeColor} ${meta.textColor}`}>
                <Icon className="size-5" />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-3 leading-relaxed font-medium">
              {ROLE_PERMISSIONS_SUMMARY[role]}
            </p>
            {total > 0 && (
              <div className="mt-3">
                <div className="h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      role === "ADMIN" ? "bg-purple-500" :
                      role === "USER" ? "bg-indigo-500" :
                      role === "AM" ? "bg-blue-500" :
                      "bg-emerald-500"
                    }`}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-1 font-bold">
                  {((count / total) * 100).toFixed(0)}% tổng số
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
