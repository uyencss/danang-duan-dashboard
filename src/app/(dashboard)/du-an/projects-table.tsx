"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  Eye,
  History,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
} from "lucide-react";
import * as React from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TrangThaiDuAn } from "@prisma/client";
import { QuickUpdateModal } from "@/components/du-an/quick-update-modal";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  MOI: { label: "Mới", className: "bg-blue-100 text-blue-700" },
  DANG_LAM_VIEC: { label: "Đang làm việc", className: "bg-amber-100 text-amber-700" },
  DA_DEMO: { label: "Đã Demo", className: "bg-purple-100 text-purple-700" },
  DA_GUI_BAO_GIA: { label: "Gửi báo giá", className: "bg-blue-100 text-blue-700" },
  DA_KY_HOP_DONG: { label: "Đã ký HĐ", className: "bg-green-100 text-green-700" },
  THAT_BAI: { label: "Thất bại", className: "bg-red-100 text-red-700" },
};

export function ProjectsTable({ data }: { data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [selectedProject, setSelectedProject] = React.useState<any>(null);
  const [openUpdateModal, setOpenUpdateModal] = React.useState(false);

  const columns: ColumnDef<any>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <span className="text-sm text-slate-400 font-medium">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "khachHang",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div>
          <Link
            href={`/du-an/${row.original.id}`}
            className="font-bold text-sm text-[#191c1e] hover:text-[#0058bc] transition-colors"
          >
            {row.original.khachHang.ten}
          </Link>
          <p className="text-[10px] text-slate-500 mt-0.5">{row.original.tenDuAn}</p>
        </div>
      ),
    },
    {
      accessorKey: "sanPham",
      header: "Sản phẩm",
      cell: ({ row }) => (
        <span className="text-sm text-[#44474d]">{row.original.sanPham.tenChiTiet}</span>
      ),
    },
    {
      accessorKey: "am",
      header: "AM",
      cell: ({ row }) => (
        <span className="text-sm text-center">{row.original.am?.name || "—"}</span>
      ),
    },
    {
      accessorKey: "chuyenVien",
      header: "Chuyên viên",
      cell: ({ row }) => (
        <span className="text-sm text-[#44474d]">{row.original.chuyenVien?.name || "—"}</span>
      ),
    },
    {
      accessorKey: "trangThaiHienTai",
      header: "Trạng thái",
      cell: ({ row }) => {
        const state = row.getValue("trangThaiHienTai") as TrangThaiDuAn;
        const style = STATUS_STYLES[state] || STATUS_STYLES.MOI;
        return (
          <span className={cn("px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter", style.className)}>
            {style.label}
          </span>
        );
      },
    },
    {
      accessorKey: "tongDoanhThuDuKien",
      header: "Doanh thu (Tr.đ)",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-right block">{row.getValue<number>("tongDoanhThuDuKien").toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "ngayChamsocCuoiCung",
      header: "Ngày CSKH",
      cell: ({ row }) => {
        const lastDate = row.getValue("ngayChamsocCuoiCung") as Date;
        if (!lastDate) return <span className="text-red-500 font-bold text-xs animate-pulse">Chưa CSKH</span>;
        return (
          <span className="text-sm text-center text-slate-500">
            {new Date(lastDate).toLocaleDateString("vi-VN")}
          </span>
        );
      },
    },
    {
      id: "warning",
      header: "Cảnh báo",
      cell: ({ row }) => {
        const lastDate = row.original.ngayChamsocCuoiCung;
        if (!lastDate) return <span className="text-slate-300">—</span>;
        const diff = Math.floor(
          (new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff > 15) {
          return (
            <span className="px-2 py-1 rounded bg-[#ba1a1a] text-white text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 w-fit">
              <AlertTriangle className="size-3" />
              Cần CS gấp
            </span>
          );
        }
        return (
          <span className="text-slate-300 text-center block">—</span>
        );
      },
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <button
            className="p-2 hover:bg-slate-100 rounded-lg transition-all text-[#0058bc]"
            title="Cập nhật nhanh"
            onClick={() => {
              setSelectedProject(row.original);
              setOpenUpdateModal(true);
            }}
          >
            <History className="size-4" />
          </button>
          <Link
            href={`/du-an/${row.original.id}`}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-500"
            title="Xem chi tiết"
          >
            <Eye className="size-4" />
          </Link>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="w-full space-y-4">
      {/* Filter Bar */}
      <div className="bg-[#f2f4f6] p-2 rounded-2xl flex flex-wrap gap-2 items-center">
        <div className="flex-1 flex gap-2 overflow-x-auto px-2 py-1 min-w-0">
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm dự án, khách hàng..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="bg-white border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#0058bc] shadow-none h-9"
            />
          </div>
        </div>
        <span className="text-xs text-slate-500 font-medium px-3">
          {data.length} dự án
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#c5c6ce]/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f4f6] text-[#44474d]">
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="py-4 px-6 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const lastDate = row.original.ngayChamsocCuoiCung;
                const isUrgent = lastDate
                  ? Math.floor(
                      (new Date().getTime() - new Date(lastDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) > 15
                  : false;

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors",
                      isUrgent
                        ? "bg-[#ffdad6]/20 hover:bg-[#ffdad6]/30"
                        : "hover:bg-[#f7f9fb]"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-4 px-6">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-32 text-center text-slate-400 font-medium italic"
                >
                  🚀 Chưa có dự án nào được khởi tạo.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="p-6 bg-[#f2f4f6] flex justify-between items-center">
          <p className="text-xs text-[#44474d] font-medium">
            Hiển thị {table.getRowModel().rows.length} trên tổng số {data.length} dự án
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 hover:text-[#0058bc] transition-all disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: table.getPageCount() }, (_, i) => i).map((pg) => (
              <button
                key={pg}
                onClick={() => table.setPageIndex(pg)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                  table.getState().pagination.pageIndex === pg
                    ? "bg-[#0058bc] text-white"
                    : "bg-white text-slate-500 hover:bg-slate-100"
                )}
              >
                {pg + 1}
              </button>
            ))}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 hover:text-[#0058bc] transition-all disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <QuickUpdateModal
        open={openUpdateModal}
        setOpen={setOpenUpdateModal}
        project={selectedProject}
        key={selectedProject?.id || "quick-update"}
      />
    </div>
  );
}
