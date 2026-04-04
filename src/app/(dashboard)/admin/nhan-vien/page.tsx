import { requireAdmin } from "@/lib/auth-utils";
import { getUserList } from "./actions";
import { UsersTable } from "./users-table";
import { Users2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/layout/breadcrumb";

export default async function NhanVienPage() {
  await requireAdmin();
  const { data = [], error } = await getUserList();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: "Hệ thống" }, { label: "Người dùng & Nhân sự" }]} />
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Users2 className="size-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#003466]">Quản lý Tài khoản & Nhân sự</h1>
          </div>
          <p className="text-gray-500 text-sm pl-12 font-medium">
            Thiết lập quyền hạn, quản lý địa bàn và quản trị bảo mật cho toàn bộ nhân viên trong hệ thống.
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-12 md:px-0 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100">
           <ShieldCheck className="size-4 text-yellow-600" />
           <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Chế độ Quản trị tối cao</span>
        </div>
      </div>

      {error ? (
        <div className="p-12 text-center bg-red-50 text-red-500 rounded-2xl border border-red-200">
           ⚠️ {error}
        </div>
      ) : (
        <UsersTable data={data} />
      )}
    </div>
  );
}
