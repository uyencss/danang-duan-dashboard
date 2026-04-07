import { requireRole } from "@/lib/auth-utils";
import { getSanPhamList } from "./actions";
import { ProductsTable } from "./products-table";
import { Package } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";

export default async function SanPhamPage() {
  await requireRole("ADMIN", "USER");
  const { data = [], error } = await getSanPhamList();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: "Danh mục" }, { label: "Sản phẩm" }]} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Package className="size-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#003466]">Danh mục Sản phẩm</h1>
          </div>
          <p className="text-gray-500 text-sm pl-12 font-medium">
            Quản lý các nhóm sản phẩm (Cloud, IOC, mInvoice...) và các giải pháp CRM cho MobiFone.
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-12 text-center bg-red-50 text-red-500 rounded-2xl border border-red-200">
           ⚠️ {error}
        </div>
      ) : (
        <ProductsTable data={data} />
      )}
    </div>
  );
}
