"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AppRole, ROLE_METADATA, ALL_ROLES } from "@/lib/rbac";
import { useState } from "react";
import { EditRoleDialog } from "./edit-role-dialog";
import { Pencil, Shield } from "lucide-react";

export function RoleListPanel({ roleConfigs }: { roleConfigs: any[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeRole = (searchParams.get("role") as AppRole) || "ADMIN";

  const [editingRole, setEditingRole] = useState<AppRole | null>(null);

  const getRoleData = (role: AppRole) => {
    const fromDb = roleConfigs.find((c) => c.role === role);
    const defaults = ROLE_METADATA[role];
    return {
      role,
      label: fromDb?.label || defaults.label,
      description: fromDb?.description || defaults.description,
      color: fromDb?.color || defaults.color || (
        role === "ADMIN" ? "purple" : 
        role === "USER" ? "indigo" : 
        role === "AM" ? "blue" : "emerald"
      ),
    };
  };

  const handleRoleClick = (role: AppRole) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("role", role);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <aside className="col-span-12 lg:col-span-4 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#44474d] px-2 flex items-center gap-2">
          <span className="w-1 h-3 bg-[#0058bc] rounded-full"></span>
          Danh sách Vai trò
        </h3>

        <div className="bg-white rounded-2xl shadow-sm border border-[#c5c6ce]/10 overflow-hidden">
          {ALL_ROLES.map((role) => {
            const data = getRoleData(role);
            const isActive = activeRole === role;
            return (
              <div
                key={role}
                onClick={() => handleRoleClick(role)}
                className={`p-5 cursor-pointer transition-colors border-b border-[#c5c6ce]/5 ${
                  isActive ? "border-l-4 border-l-[#0058bc] bg-[#f0f7ff]" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider border`}
                    style={{
                      backgroundColor: `var(--color-${data.color}-50, #f8fafc)`,
                      color: `var(--color-${data.color}-700, #334155)`,
                      borderColor: `var(--color-${data.color}-100, #e2e8f0)`,
                    }}
                  >
                    {role}
                  </span>
                  <Pencil
                    className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingRole(role);
                    }}
                  />
                </div>
                <h4 className="font-bold text-[#191c1e] text-sm mb-1">{data.label}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{data.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-[#0D1F3C] to-[#1e293b] p-6 rounded-2xl text-white shadow-xl shadow-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/10 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Bảo mật hệ thống
              </p>
              <h4 className="font-bold text-lg">Phân quyền động</h4>
            </div>
          </div>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            Mọi thay đổi về quyền hạn sẽ có hiệu lực ngay lập tức cho người dùng trong phiên làm việc tới.
          </p>
          <div className="flex justify-between items-center text-xs font-bold pt-4 border-t border-white/10 text-slate-400">
            <span>Tổng số vai trò</span>
            <span className="text-white text-base">04</span>
          </div>
        </div>
      </aside>

      {editingRole && (
        <EditRoleDialog
          role={editingRole}
          data={getRoleData(editingRole)}
          onClose={() => setEditingRole(null)}
        />
      )}
    </>
  );
}
