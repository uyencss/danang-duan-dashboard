import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMenuItems, getAllPermissions, getRoleConfigs } from "./actions";
import { RoleListPanel } from "./role-list-panel";
import { PermissionMatrix } from "./permission-matrix";
import { MenuManager } from "./menu-manager";
import { History, ShieldPlus, Component } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Quản lý Vai trò - Administrator",
};

export default async function AdminRolesPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab === "menus" ? "menus" : "permissions";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/");
  }

  const [menuItems, permissions, roleConfigs] = await Promise.all([
    getMenuItems(),
    getAllPermissions(),
    getRoleConfigs(),
  ]);

  const roleParam = searchParams?.role ? `&role=${searchParams.role}` : "";

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

      <div className="mb-6 flex gap-2 border-b border-outline-variant/10">
        <Link
          href={`/admin/roles?tab=permissions${roleParam}`}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
            tab === "permissions"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-slate-50"
          }`}
        >
          Ma trận Quyền hạn
        </Link>
        <Link
          href={`/admin/roles?tab=menus${roleParam}`}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
            tab === "menus"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-slate-50"
          }`}
        >
          Cấu hình Menu
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {tab === "permissions" ? (
          <>
            <RoleListPanel roleConfigs={roleConfigs} />
            <PermissionMatrix 
              menuItems={menuItems} 
              initialPermissions={permissions} 
              roleConfigs={roleConfigs} 
            />
          </>
        ) : (
          <MenuManager menuItems={menuItems} />
        )}
      </div>
    </main>
  );
}
