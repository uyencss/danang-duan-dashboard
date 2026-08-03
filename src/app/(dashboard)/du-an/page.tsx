import { getDuAnList, getPendingStepLogs, getUserOptions } from "./actions";
import { ProjectsTable } from "./projects-table";
import { PlusCircle, Database } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { TrangThaiDuAn } from "@prisma/client";
import { getCurrentUser, requireRole } from "@/lib/auth-utils";
import { ExcelUploadButton } from "./excel-upload-button";

export const metadata = {
  title: "CRM & Danh sách Dự án",
};

export const dynamic = "force-dynamic";

export default async function DuAnPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const pageSize = 50; // Tải 50 bản ghi mỗi trang để đảm bảo tốc độ và không bị timeout

  const filters = {
    search: typeof params.search === "string" ? params.search : undefined,
    phanLoaiKH: typeof params.phanLoaiKH === "string" ? params.phanLoaiKH : undefined,
    productId: typeof params.productId === "string" ? params.productId : undefined,
    trangThai: typeof params.trangThai === "string" ? params.trangThai : undefined,
    linhVuc: typeof params.linhVuc === "string" ? params.linhVuc : undefined,
    amId: typeof params.amId === "string" ? params.amId : undefined,
    urgent: typeof params.urgent === "string" ? params.urgent : undefined,
    hienTaiBuoc: typeof params.hienTaiBuoc === "string" ? params.hienTaiBuoc : undefined,
    phanLoai: typeof params.phanLoai === "string" ? params.phanLoai : undefined,
    page,
    pageSize,
  };

  const user = await requireRole("ADMIN", "USER", "AM", "CV", "LEADER");
  const isQuảnTrịViên = user?.role === "ADMIN" || user?.role === "USER";

  const [result, pendingLogsRes, userOptionsRes] = await Promise.all([
    getDuAnList(filters),
    isQuảnTrịViên ? getPendingStepLogs() : Promise.resolve({ data: [] }),
    getUserOptions()
  ]);

  const data = result?.data ?? [];
  const total = (result as any)?.total ?? data.length;
  const error = result?.error;
  const users = userOptionsRes?.data ?? [];

  // Auto Sort logic theo yêu cầu mới:
  // 1. (Trọng điểm & Kỳ vọng) & (Chưa kết thúc & Chưa ký)
  // 2. Trọng điểm & (Chưa kết thúc & Chưa ký)
  // 3. Kỳ vọng & (Chưa kết thúc & Chưa ký)
  // 4. Bình thường & (Chưa kết thúc & Chưa ký)
  // 5. Kết thúc (THAT_BAI)
  // 6. Đã ký hợp đồng (Xếp cuối cùng dù là trọng điểm hay kỳ vọng)
  const sortedData = [...data].sort((a: any, b: any) => {
    const getPriority = (item: any) => {
      const status = item.trangThaiHienTai;
      const isTrong = !!item.isTrongDiem;
      const isKyVong = !!item.isKyVong;

      // Dự án đã ký hợp đồng xếp cuối cùng
      if (status === TrangThaiDuAn.DA_KY_HOP_DONG) return 6;
      
      // Dự án kết thúc (Thất bại)
      if (status === TrangThaiDuAn.THAT_BAI) return 5;

      // Cả trọng điểm và kỳ vọng (không tính kết thúc và đã ký)
      if (isTrong && isKyVong) return 1;

      // Dự án trọng điểm (không tính kết thúc và đã ký)
      if (isTrong) return 2;

      // Dự án kỳ vọng (không tính kết thúc và đã ký)
      if (isKyVong) return 3;

      // Dự án không phải là trọng điểm và kỳ vọng (không tính kết thúc và đã ký)
      return 4;
    };

    const prioA = getPriority(a);
    const prioB = getPriority(b);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    // Nếu cùng mức ưu tiên, ưu tiên dự án mới cập nhật hơn
    const dateA = new Date(a.updatedAt || a.ngayBatDau).getTime();
    const dateB = new Date(b.updatedAt || b.ngayBatDau).getTime();

    return dateB - dateA;
  });

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: "CRM & DS Dự án" }]} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#191c1e]">
            CRM &amp; Danh sách Dự án
          </h2>
          <p className="text-[#44474d] text-sm md:text-base mt-1">
            Quản lý lộ trình triển khai và chăm sóc khách hàng doanh nghiệp
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-nav: Dữ liệu nguồn (ADMIN/USER only) */}
          {isQuảnTrịViên && (
            <Link
              href="/du-an/du-lieu-nguon"
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 md:px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all text-xs md:text-sm h-10"
            >
              <Database className="size-4" />
              <span className="hidden xs:inline">Dữ liệu nguồn</span>
              <span className="xs:hidden">DL nguồn</span>
            </Link>
          )}

          {/* Nhóm button Tính năng Import Excel */}
          <ExcelUploadButton users={users} />
 
          {/* Tạo dự án đơn lẻ */}
          <Link
            href="/du-an/tao-moi"
            className="bg-gradient-to-r from-[#0058bc] to-blue-500 hover:from-blue-600 hover:to-cyan-500 text-white px-4 md:px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-all text-xs md:text-sm h-10"
          >
            <PlusCircle className="size-4" />
            <span className="hidden xs:inline">+ Tạo dự án</span>
            <span className="xs:hidden">+ Tạo</span>
          </Link>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="p-16 text-center bg-red-50 text-[#ba1a1a] rounded-xl border border-red-200">
          <p className="font-black text-xl">Rất tiếc, đã có lỗi xảy ra</p>
          <p className="text-sm font-medium opacity-80 mt-2">{error}</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ProjectsTable data={sortedData} totalCount={total} initialSearch={filters.search} users={users} />
        </div>
      )}
    </div>
  );
}
