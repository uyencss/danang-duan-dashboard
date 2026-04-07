import { getDuAnList } from "./actions";
import { ProjectsTable } from "./projects-table";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { TrangThaiDuAn } from "@prisma/client";

export const metadata = {
  title: "CRM & Danh sách Dự án",
};

export default async function DuAnPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = await searchParams;

  const filters = {
    search: typeof params.search === "string" ? params.search : undefined,
    phanLoaiKH: typeof params.phanLoaiKH === "string" ? params.phanLoaiKH : undefined,
    productId: typeof params.productId === "string" ? params.productId : undefined,
    trangThai: typeof params.trangThai === "string" ? params.trangThai : undefined,
    linhVuc: typeof params.linhVuc === "string" ? params.linhVuc : undefined,
    amId: typeof params.amId === "string" ? params.amId : undefined,
    pageSize: 200,
  };

  const result = await getDuAnList(filters);
  const data = result?.data ?? [];
  const total = (result as any)?.total ?? data.length;
  const error = result?.error;

  // Auto Sort logic
  const sortedData = [...data].sort((a: any, b: any) => {
    const getPriority = (item: any) => {
      const isTrong = !!item.isTrongDiem;
      const isDaKy = item.trangThaiHienTai === TrangThaiDuAn.DA_KY_HOP_DONG;
      if (isTrong && !isDaKy) return 1;
      if (!isTrong && !isDaKy) return 2;
      if (!isTrong && isDaKy) return 3;
      if (isTrong && isDaKy) return 4;
      return 2;
    };

    const prioA = getPriority(a);
    const prioB = getPriority(b);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    const dateA = new Date(a.ngayBatDau).getTime();
    const dateB = new Date(b.ngayBatDau).getTime();

    // Priority 4 (Trọng điểm + Đã ký HĐ): lâu nhất xếp lên (ASC)
    if (prioA === 4) {
       return dateA - dateB;
    }
    
    // Tất cả các trường hợp còn lại: mới nhất xếp lên, lâu nhất xếp cuối (DESC)
    return dateB - dateA;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: "CRM & DS Dự án" }]} />

      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#191c1e]">
            CRM &amp; Danh sách Dự án
          </h2>
          <p className="text-[#44474d] mt-1">
            Quản lý lộ trình triển khai và chăm sóc khách hàng doanh nghiệp
          </p>
        </div>
        <Link
          href="/du-an/tao-moi"
          className="bg-gradient-to-r from-[#0058bc] to-blue-500 hover:from-blue-600 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-all text-sm"
        >
          <PlusCircle className="size-4" />
          + Tạo dự án mới
        </Link>
      </div>

      {/* Table */}
      {error ? (
        <div className="p-16 text-center bg-red-50 text-[#ba1a1a] rounded-xl border border-red-200">
          <p className="font-black text-xl">Rất tiếc, đã có lỗi xảy ra</p>
          <p className="text-sm font-medium opacity-80 mt-2">{error}</p>
        </div>
      ) : (
        <ProjectsTable data={sortedData} totalCount={total} initialSearch={filters.search} />
      )}
    </div>
  );
}
