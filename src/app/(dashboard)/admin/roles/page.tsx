import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMenuItems, getAllPermissions, getRoleConfigs } from "./actions";
import { RoleListPanel } from "./role-list-panel";
import { PermissionMatrix } from "./permission-matrix";
import { History, ShieldPlus } from "lucide-react";

export const metadata = {
  title: "Quản lý Vai trò - Administrator",
};

export default async function AdminRolesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  const [menuItems, permissions, roleConfigs] = await Promise.all([
    getMenuItems(),
    getAllPermissions(),
    getRoleConfigs(),
  ]);

  return (
    <main className="p-8 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50/50">
      <section className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tight mb-2 uppercase">Quản lý Quyền hạn</h2>
          <p className="text-on-surface-variant font-medium text-sm">
            Thiết lập vai trò người dùng và phạm vi truy cập các chức năng hệ thống.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-xl bg-surface-container-highest font-bold text-sm text-on-surface flex items-center gap-2 hover:bg-surface-container-high transition-colors">
            <History className="w-5 h-5" />
            Lịch sử thay đổi
          </button>
          <button className="px-5 py-2.5 rounded-xl bg-secondary-container text-white font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            <ShieldPlus className="w-5 h-5" />
            Tạo Vai trò Mới
          </button>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <RoleListPanel roleConfigs={roleConfigs} />
        <PermissionMatrix 
          menuItems={menuItems} 
          initialPermissions={permissions} 
          roleConfigs={roleConfigs} 
        />
      </div>
    </main>
  );
}
