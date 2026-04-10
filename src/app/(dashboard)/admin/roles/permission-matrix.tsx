"use client";

import { useState, useEffect } from "react";
import { AppRole, ALL_ROLES } from "@/lib/rbac";
import { updatePermissionsForRole, PermissionInput } from "./actions";
import { useSearchParams } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { useAlert } from "@/components/ui/use-alert";

export function PermissionMatrix({
  menuItems,
  initialPermissions,
  roleConfigs,
}: {
  menuItems: any[];
  initialPermissions: any[];
  roleConfigs: any[];
}) {
  const searchParams = useSearchParams();
  const activeRole = (searchParams.get("role") as AppRole) || "ADMIN";

  const [permissions, setPermissions] = useState<PermissionInput[]>([]);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    // initialize state based on active role
    const rolePerms = initialPermissions.filter((p) => p.role === activeRole);
    const mapped = menuItems.map((menu) => {
      const existing = rolePerms.find((p) => p.menuKey === menu.key);
      return {
        menuKey: menu.key,
        canView: existing?.canView || false,
        canCreate: existing?.canCreate || false,
        canEdit: existing?.canEdit || false,
        canDelete: existing?.canDelete || false,
      };
    });
    setPermissions(mapped);
  }, [activeRole, initialPermissions, menuItems]);

  const handleChange = (menuKey: string, field: keyof PermissionInput, value: boolean) => {
    setPermissions((prev) =>
      prev.map((p) => (p.menuKey === menuKey ? { ...p, [field]: value } : p))
    );
  };

  const handleSelectAll = () => {
    setPermissions((prev) =>
      prev.map((p) => ({
        ...p,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      }))
    );
  };

  const handleDeselectAll = () => {
    setPermissions((prev) =>
      prev.map((p) => ({
        ...p,
        canView: p.menuKey === "dashboard", // Always keep dashboard viewable
        canCreate: false,
        canEdit: false,
        canDelete: false,
      }))
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePermissionsForRole(activeRole, permissions);
      showAlert({
        title: "Thành công",
        description: "Lưu thay đổi thành công!",
        type: "success",
        showCancel: false,
      });
    } catch (e: any) {
      showAlert({
        title: "Lỗi",
        description: "Có lỗi xảy ra: " + (e?.message || String(e)),
        type: "error",
        showCancel: false,
      });
    }
    setLoading(false);
  };

  const handleRevert = () => {
    // Trigger reset by running the effect again
    const rolePerms = initialPermissions.filter((p) => p.role === activeRole);
    setPermissions(
      menuItems.map((menu) => {
        const existing = rolePerms.find((p) => p.menuKey === menu.key);
        return {
          menuKey: menu.key,
          canView: existing?.canView || false,
          canCreate: existing?.canCreate || false,
          canEdit: existing?.canEdit || false,
          canDelete: existing?.canDelete || false,
        };
      })
    );
  };

  return (
    <section className="col-span-12 lg:col-span-8 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant px-2 flex items-center gap-2">
          <span className="w-1 h-3 bg-secondary rounded-full"></span>
          Ma trận Quyền hạn: <span className="text-secondary">{activeRole}</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs font-bold text-secondary hover:underline"
          >
            Chọn tất cả
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={handleDeselectAll}
            className="text-xs font-bold text-slate-400 hover:text-on-surface"
          >
            Bỏ chọn tất cả
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto matrix-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-outline-variant/10">
                <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest w-64">
                  Danh mục Menu / Module
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center">
                  Thứ tự
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center">
                  Xem
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center">
                  Thêm mới
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center">
                  Sửa
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center">
                  Xóa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {menuItems.map((menu) => {
                const perm = permissions.find((p) => p.menuKey === menu.key);
                if (!perm) return null;
                return (
                  <tr key={menu.key} className={`hover:bg-slate-50 transition-colors ${menu.isActive === false ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 flex items-center justify-center">
                          {(() => {
                            const IconComp = (LucideIcons as any)[menu.icon || "Folder"];
                            return IconComp ? <IconComp className="w-5 h-5 text-slate-400" /> : <LucideIcons.Folder className="w-5 h-5 text-slate-400" />;
                          })()}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{menu.label}</p>
                          <p className="text-[10px] uppercase text-slate-500">{menu.href}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block w-8">
                        {menu.sortOrder}
                      </span>
                    </td>
                    {(["canView", "canCreate", "canEdit", "canDelete"] as const).map(
                      (field) => (
                        <td key={field} className="px-6 py-4 text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={perm[field]}
                              onChange={(e) =>
                                handleChange(menu.key, field, e.target.checked)
                              }
                              className="sr-only peer permission-toggle"
                            />
                            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0058bc]"></div>
                          </label>
                        </td>
                      )
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6 bg-slate-50 border-t border-outline-variant/10 flex justify-end gap-3">
          <button
            onClick={handleRevert}
            disabled={loading}
            className="px-6 py-2 rounded-xl border border-outline-variant text-sm font-bold text-on-surface-variant hover:bg-white transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            {loading ? "Đang lưu..." : "Lưu Thay đổi"}
          </button>
        </div>
      </div>
    </section>
  );
}
