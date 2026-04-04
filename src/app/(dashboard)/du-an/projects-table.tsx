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
  History as HistoryIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Pencil,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TrangThaiDuAn } from "@prisma/client";
import { QuickUpdateModal } from "@/components/du-an/quick-update-modal";
import { ProjectFormDialog } from "@/components/du-an/project-form-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const LINH_VUC_COLORS: Record<string, string> = {
  CHINH_PHU: "bg-blue-50 text-blue-600 border-blue-100",
  DOANH_NGHIEP: "bg-slate-50 text-slate-600 border-slate-100",
  CONG_AN: "bg-orange-50 text-orange-600 border-orange-100",
};

const LINH_VUC_LABELS: Record<string, string> = {
  CHINH_PHU: "Chính phủ",
  DOANH_NGHIEP: "Doanh nghiệp",
  CONG_AN: "Công an",
};

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
  const [openEditModal, setOpenEditModal] = React.useState(false);

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
            href={`/du-an/${(row.original as any).id}`}
            className="font-bold text-sm text-[#191c1e] hover:text-[#0058bc] transition-colors"
          >
            {(row.original as any).khachHang.ten}
          </Link>
          <p className="text-[10px] text-slate-500 mt-0.5">{(row.original as any).tenDuAn}</p>
        </div>
      ),
      filterFn: (row, id, value) => {
        return row.original.khachHang.ten.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "linhVuc",
      header: "Lĩnh vực",
      cell: ({ row }) => {
        const lv = row.getValue("linhVuc") as string;
        const style = LINH_VUC_COLORS[lv] || LINH_VUC_COLORS.CHINH_PHU;
        return (
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", style)}>
            {LINH_VUC_LABELS[lv] || lv}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "sanPham",
      header: "Sản phẩm",
      cell: ({ row }) => (
        <span className="text-sm text-[#44474d]">{(row.original as any).sanPham.tenChiTiet}</span>
      ),
      filterFn: (row, id, value) => {
        return row.original.sanPham.tenChiTiet.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "am",
      header: "AM phụ trách",
      cell: ({ row }) => (
        <span className="text-sm">{(row.original as any).am?.name || "—"}</span>
      ),
      filterFn: (row, id, value) => {
        return (row.original.am?.name || "").toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "chuyenVien",
      header: "Chuyên viên",
      cell: ({ row }) => (
        <span className="text-sm">{(row.original as any).chuyenVien?.name || "—"}</span>
      ),
      filterFn: (row, id, value) => {
        return (row.original.chuyenVien?.name || "").toLowerCase().includes(value.toLowerCase());
      },
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
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "tongDoanhThuDuKien",
      header: "Tổng DT",
      cell: ({ row }) => (
        <span className="text-sm font-bold">{(row.getValue("tongDoanhThuDuKien") as number).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "ngayChamsocCuoiCung",
      header: "CSKH",
      cell: ({ row }) => {
        const lastDate = row.getValue("ngayChamsocCuoiCung") as Date;
        if (!lastDate) return <span className="text-red-500 font-bold text-[10px] animate-pulse">CHƯA CSKH</span>;
        return (
          <span className="text-sm text-slate-500">
            {new Date(lastDate).toLocaleDateString("vi-VN")}
          </span>
        );
      },
    },
    {
      id: "warning",
      header: "Cảnh báo",
      cell: ({ row }) => {
        const lastDate = (row.original as any).ngayChamsocCuoiCung;
        if (!lastDate) return <span className="text-slate-300">—</span>;
        const diff = Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 15) {
          return (
            <span className="px-2 py-1 rounded bg-[#ba1a1a] text-white text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 w-fit">
              <AlertTriangle className="size-3" /> Cần CS gấp
            </span>
          );
        }
        return <span className="text-slate-300">—</span>;
      },
      filterFn: (row, id, value) => {
        const lastDate = (row.original as any).ngayChamsocCuoiCung;
        const isUrgent = lastDate ? Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)) > 15 : false;
        return value === "urgent" ? isUrgent : !isUrgent;
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-lg text-[#0058bc]" onClick={() => { setSelectedProject(row.original); setOpenEditModal(true); }}><Pencil className="size-4" /></button>
          <button className="p-2 hover:bg-slate-100 rounded-lg text-amber-600" onClick={() => { setSelectedProject(row.original); setOpenUpdateModal(true); }}><HistoryIcon className="size-4" /></button>
          <Link href={`/du-an/${(row.original as any).id}`} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Eye className="size-4" /></Link>
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
    globalFilterFn: (row, columnId, filterValue) => {
      const value = filterValue.toLowerCase();
      const project = row.original as any;
      return (
        project.tenDuAn?.toLowerCase().includes(value) ||
        project.khachHang?.ten?.toLowerCase().includes(value) ||
        project.sanPham?.tenChiTiet?.toLowerCase().includes(value) ||
        project.am?.name?.toLowerCase().includes(value) ||
        LINH_VUC_LABELS[project.linhVuc]?.toLowerCase().includes(value)
      );
    },
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

      {/* Table Container */}
      <div className="bg-white rounded-2xl overflow-x-auto shadow-sm border border-[#c5c6ce]/10">
        <table className="w-full min-w-[1400px] text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f4f6] text-[#44474d]">
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => {
                  const filterValue = header.column.getFilterValue();
                  const isSelectFilter = ["linhVuc", "trangThaiHienTai", "warning"].includes(header.id);

                  return (
                    <th
                      key={header.id}
                      className="py-4 px-6 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap group"
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header as any, header.getContext())}
                        
                        {!header.isPlaceholder && header.id !== "actions" && header.id !== "index" && (
                          <Popover>
                            <PopoverTrigger>
                              <div className={cn(
                                "p-1 rounded hover:bg-slate-200 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer",
                                (filterValue as any) && "opacity-100 text-[#0058bc]"
                              )}>
                                <Filter className="size-3" />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-3" align="start">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase text-slate-400">Lọc {header.column.columnDef.header as string}</span>
                                  {!!filterValue && (
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => header.column.setFilterValue(undefined)}>
                                      Xóa lọc
                                    </Button>
                                  )}
                                </div>
                                {isSelectFilter ? (
                                  <div className="flex flex-wrap gap-1">
                                    {header.id === "linhVuc" && Object.entries(LINH_VUC_LABELS).map(([k, v]) => (
                                      <button key={k} onClick={() => {
                                        const current = (filterValue as string[]) || [];
                                        header.column.setFilterValue(current.includes(k) ? current.filter(x => x !== k) : [...current, k]);
                                      }} className={cn("px-2 py-1 rounded text-[10px] font-bold border transition-all", ((filterValue as string[]) || []).includes(k) ? "bg-[#0058bc] text-white border-[#0058bc]" : "bg-white text-slate-600 border-slate-200")}>{v}</button>
                                    ))}
                                    {header.id === "trangThaiHienTai" && Object.entries(STATUS_STYLES).map(([k, v]) => (
                                      <button key={k} onClick={() => {
                                        const current = (filterValue as string[]) || [];
                                        header.column.setFilterValue(current.includes(k) ? current.filter(x => x !== k) : [...current, k]);
                                      }} className={cn("px-2 py-1 rounded text-[10px] font-bold border transition-all", ((filterValue as string[]) || []).includes(k) ? "bg-[#0058bc] text-white border-[#0058bc]" : "bg-white text-slate-600 border-slate-200")}>{v.label}</button>
                                    ))}
                                    {header.id === "warning" && [
                                      {k: "urgent", v: "Cần CS gấp"},
                                      {k: "normal", v: "Bình thường"}
                                    ].map(({k, v}) => (
                                      <button key={k} onClick={() => header.column.setFilterValue(filterValue === k ? undefined : k)} className={cn("px-2 py-1 rounded text-[10px] font-bold border transition-all", filterValue === k ? "bg-[#ba1a1a] text-white border-[#ba1a1a]" : "bg-white text-slate-600 border-slate-200")}>{v}</button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
                                    <Input placeholder="Nhập từ khóa..." value={(filterValue as string) || ""} onChange={(e) => header.column.setFilterValue(e.target.value)} className="pl-7 pr-3 py-1 h-8 text-xs shadow-none border-slate-200" />
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </th>
                  );
                })
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
        key={selectedProject?.id ? `quick-${selectedProject.id}` : "quick-update"}
      />

      <ProjectFormDialog
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        project={selectedProject}
        key={selectedProject?.id ? `edit-${selectedProject.id}` : "edit-form"}
      />
    </div>
  );
}
