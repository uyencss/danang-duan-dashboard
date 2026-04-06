import { requireAuth } from "@/lib/auth-utils";
import { getKhachHangList } from "./actions";
import { CustomersTable } from "./customers-table";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/layout/breadcrumb";

export default async function KhachHangPage() {
  // Ensure Authenticated users can access
  await requireAuth();

  // Fetch initial data
  const { data = [], error } = await getKhachHangList();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: "Danh mục" }, { label: "Khách hàng" }]} />
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Building2 className="size-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#003466]">Danh mục Khách hàng</h1>
          </div>
          <p className="text-gray-500 text-sm pl-12 font-medium">
            Quản lý thông tin khách hàng, phân loại và trạng thái hợp tác của toàn hệ thống MobiFone.
          </p>
        </div>
        <div className="flex items-center gap-2 px-12 md:px-0">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 text-xs">
            Tổng số: {data.length} khách hàng
          </Badge>
        </div>
      </div>

      {/* Main Table with all Client interactivity */}
      {error ? (
        <div className="p-12 text-center bg-red-50 text-red-500 rounded-2xl border border-red-200 font-bold">
           ⚠️ {error}
        </div>
      ) : (
        <CustomersTable data={data} />
      )}
    </div>
  );
}
