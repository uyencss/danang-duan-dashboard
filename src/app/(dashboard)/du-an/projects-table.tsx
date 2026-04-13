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
  Download,
  Star,
  Trash2,
  Banknote,
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
import { exportToExcel } from "@/lib/export-excel";
import { toast } from "sonner";
import { requestDeleteDuAn } from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  DA_DEMO: { label: "Đã demo", className: "bg-purple-100 text-purple-700" },
  DA_GUI_BAO_GIA: { label: "Đã gửi báo giá", className: "bg-blue-100 text-blue-700" },
  DA_KY_HOP_DONG: { label: "Đã ký hợp đồng", className: "bg-green-100 text-green-700" },
  THAT_BAI: { label: "Thất bại", className: "bg-red-100 text-red-700" },
};

const STEPS = [
  "Bước 1: Tiếp cận tìm hiểu nhu cầu",
  "Bước 2: Đề xuất GP",
  "Bước 3: Xây dựng đề án",
  "Bước 4: Tham gia thầu",
  "Bước 5: Ký hợp đồng",
  "Bước 6: Triển khai",
  "Bước 7: Hỗ trợ sau bán"
];

export function ProjectsTable({ 
  data, 
  totalCount,
  initialSearch = "" 
}: { 
  data: any[]; 
  totalCount?: number;
  initialSearch?: string 
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState(initialSearch);
  const [selectedProject, setSelectedProject] = React.useState<any>(null);
  const [openUpdateModal, setOpenUpdateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [deleteProject, setDeleteProject] = React.useState<any>(null);

  const handleDeleteRequest = async (id: number) => {
    const res = await requestDeleteDuAn(id);
    if (res.success) {
      toast.success("Đã gửi yêu cầu xoá dự án! Chờ Admin phê duyệt.");
    } else {
      toast.error(res.error || "Gửi yêu cầu thất bại");
    }
  };

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
      header: "Khách hàng & Dự án",
      cell: ({ row }) => (
        <div className="max-w-[200px] lg:max-w-[300px] whitespace-normal">
          <Link
            href={`/du-an/${(row.original as any).id}`}
            className="font-bold text-[13px] text-[#191c1e] hover:text-[#0058bc] transition-colors leading-tight line-clamp-2"
          >
            {(row.original as any).khachHang.ten}
          </Link>
          <div className="flex items-center gap-1.5 mt-0.5">
            {(row.original as any).isTrongDiem && (
              <Star className="size-3.5 fill-red-500 text-red-500 shrink-0" />
            )}
            {(row.original as any).isKyVong && (
              <Banknote className="size-3.5 text-emerald-600 shrink-0" />
            )}
            <p className="text-[11px] text-slate-500 line-clamp-2">{(row.original as any).tenDuAn}</p>
          </div>
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
      header: "AM",
      cell: ({ row }) => (
        <span className="text-xs">{(row.original as any).am?.name || "—"}</span>
      ),
      filterFn: (row, id, value) => {
        return (row.original.am?.name || "").toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "chuyenVien",
      header: "Chủ trì",
      cell: ({ row }) => (
        <span className="text-xs">{(row.original as any).chuyenVien?.name || "—"}</span>
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
          <span className={cn("px-2 py-1 rounded text-[11px] font-bold tracking-tight", style.className)}>
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
      header: "DT dự kiến",
      cell: ({ row }) => (
        <span className="text-xs font-bold">{(row.getValue("tongDoanhThuDuKien") as number).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "hienTaiBuoc",
      header: "Tiến độ",
      cell: ({ row }) => {
        const stepValue = row.getValue("hienTaiBuoc") as string;
        if (!stepValue) return <span className="text-slate-300">—</span>;
        const shortStep = stepValue.split(":")[0].trim();
        return (
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
            {shortStep}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        const rowValue = row.getValue(id) as string;
        if (!rowValue) return false;
        return value.includes(rowValue);
      },
    },
    {
      id: "warning",
      header: "Cảnh báo",
      cell: ({ row }) => {
        const p = row.original as any;
        const lastDate = p.ngayChamsocCuoiCung || p.createdAt;
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
        const p = row.original as any;
        const lastDate = p.ngayChamsocCuoiCung || p.createdAt;
        const isUrgent = Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)) > 15;
        return value === "urgent" ? isUrgent : !isUrgent;
      },
    },
    {
      id: "actions",
      header: "Tùy chọn",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-slate-100 rounded-lg text-[#0058bc]" onClick={() => { setSelectedProject(row.original); setOpenEditModal(true); }}><Pencil className="size-3.5" /></button>
          <button className="p-1.5 hover:bg-slate-100 rounded-lg text-amber-600" onClick={() => { setSelectedProject(row.original); setOpenUpdateModal(true); }}><HistoryIcon className="size-3.5" /></button>
          <Link href={`/du-an/${(row.original as any).id}`} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><Eye className="size-3.5" /></Link>
          <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors" onClick={() => setDeleteProject(row.original)}><Trash2 className="size-3.5" /></button>
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
        project.tenDuAn?.toLowerCase()?.includes(value) ||
        project.khachHang?.ten?.toLowerCase()?.includes(value) ||
        project.sanPham?.tenChiTiet?.toLowerCase()?.includes(value) ||
        project.am?.name?.toLowerCase()?.includes(value) ||
        LINH_VUC_LABELS[project.linhVuc]?.toLowerCase()?.includes(value) ||
        project.hienTaiBuoc?.toLowerCase()?.includes(value) ||
        false
      );
    },
    state: { sorting, columnFilters, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleExport = () => {
    const exportData = table.getFilteredRowModel().rows.map(row => {
      const p = row.original as any;
      const logs = p.nhatKy?.map((log: any) => {
        const date = new Date(log.ngayGio).toLocaleDateString("vi-VN");
        const status = STATUS_STYLES[log.trangThaiMoi]?.label || log.trangThaiMoi;
        return `[${date}] (${status}) ${log.noiDungChiTiet}`;
      }).join("\n") || "";

      return {
        "Tên Dự Án": p.tenDuAn,
        "Trọng Điểm": p.isTrongDiem ? "Có" : "Không",
        "Kỳ Vọng": p.isKyVong ? "Có" : "Không",
        "Khách Hàng": p.khachHang?.ten || "",
        "Lĩnh Vực": LINH_VUC_LABELS[p.linhVuc] || p.linhVuc,
        "Sản Phẩm": p.sanPham?.tenChiTiet || "",
        "AM": p.am?.name || "",
        "AM hỗ trợ": p.amHoTro?.name || "",
        "Chuyên viên chủ trì": p.chuyenVien?.name || "",
        "CV hỗ trợ 1": p.cvHoTro1?.name || "",
        "CV hỗ trợ 2": p.cvHoTro2?.name || "",
        "Trạng Thái": STATUS_STYLES[p.trangThaiHienTai]?.label || p.trangThaiHienTai,
        "Tiến độ": p.hienTaiBuoc || "Chưa bắt đầu",
        "Ngày bắt đầu": p.ngayBatDau ? new Date(p.ngayBatDau).toLocaleDateString("vi-VN") : "",
        "Ngày kết thúc": p.ngayKetThuc ? new Date(p.ngayKetThuc).toLocaleDateString("vi-VN") : "",
        "Mã hợp đồng": p.maHopDong || "",
        "Tổng DT Dự Kiến": p.tongDoanhThuDuKien,
        "Doanh Thu Theo Tháng": p.doanhThuTheoThang,
        "Nhật ký công việc": logs,
      };
    });
    exportToExcel(exportData, "DanhSachDuAn_CRM");
  };

  return (
    <div className="w-full space-y-4">
      {/* Filter Bar */}
      <div className="bg-[#f2f4f6] p-2 rounded-2xl flex flex-wrap gap-2 items-center justify-between">
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
        <div className="flex items-center gap-4 px-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            {totalCount && totalCount > data.length ? `${data.length} / ${totalCount}` : data.length} dự án
          </span>
          <Button onClick={handleExport} variant="outline" size="sm" className="h-9 gap-2 font-bold text-[#0058bc] border-[#0058bc]/20 bg-white shadow-sm hover:bg-[#0058bc]/5">
            <Download className="size-4" /> Xuất Excel
          </Button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl overflow-x-auto shadow-2xl shadow-blue-900/5 border border-blue-100/50">
        <table className="w-full text-left border-collapse table-auto text-xs md:text-sm">
          <thead className="bg-gradient-to-r from-[#0058bc] via-blue-600 to-cyan-500 text-white">
            <tr>
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => {
                  const filterValue = header.column.getFilterValue();
                  const isSelectFilter = ["linhVuc", "trangThaiHienTai", "warning", "hienTaiBuoc"].includes(header.id);

                  return (
                    <th
                      key={header.id}
                      className="py-3 px-2 md:px-3 font-bold text-[9px] md:text-[10px] uppercase tracking-wider whitespace-nowrap group border-b border-white/20 align-middle"
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header as any, header.getContext())}

                        {!header.isPlaceholder && header.id !== "actions" && header.id !== "index" && (
                          <Popover>
                            <PopoverTrigger>
                              <div className={cn(
                                "p-1 rounded hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer text-white/70 hover:text-white",
                                (filterValue as any) && "opacity-100 bg-white/20 text-white"
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
                                    {header.id === "hienTaiBuoc" && STEPS.map((step) => (
                                      <button key={step} onClick={() => {
                                        const current = (filterValue as string[]) || [];
                                        header.column.setFilterValue(current.includes(step) ? current.filter(x => x !== step) : [...current, step]);
                                      }} className={cn("px-2 py-1 rounded text-[10px] font-bold border transition-all", ((filterValue as string[]) || []).includes(step) ? "bg-[#0058bc] text-white border-[#0058bc]" : "bg-white text-slate-600 border-slate-200")}>{step.split(":")[0]}</button>
                                    ))}
                                    {header.id === "warning" && [
                                      { k: "urgent", v: "Cần CS gấp" },
                                      { k: "normal", v: "Bình thường" }
                                    ].map(({ k, v }) => (
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
          <tbody className="divide-y divide-blue-50/50">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const p = row.original as any;
                const lastDate = p.ngayChamsocCuoiCung || p.createdAt;
                const isUrgent = Math.floor(
                  (new Date().getTime() - new Date(lastDate).getTime()) /
                  (1000 * 60 * 60 * 24)
                ) > 15;

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-all duration-300",
                      isUrgent
                        ? "bg-[#ffdad6]/20 hover:bg-[#ffdad6]/40"
                        : "hover:bg-blue-50/60"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-2.5 px-2 md:px-3 align-middle">
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
        <div className="p-6 bg-slate-50/50 flex justify-between items-center border-t border-slate-100/50">
          <p className="text-xs text-[#44474d] font-medium">
            Hiển thị {table.getRowModel().rows.length} trên tổng số {totalCount ?? data.length} dự án
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

      {/* Xác nhận xóa dự án (Soft Delete) */}
      <AlertDialog open={!!deleteProject} onOpenChange={(open) => !open && setDeleteProject(null)}>
        <AlertDialogContent>
           <AlertDialogHeader>
              <AlertDialogTitle>Xóa dự án này?</AlertDialogTitle>
              <AlertDialogDescription>
                Dự án <strong className="text-red-600">{deleteProject?.tenDuAn}</strong> sẽ bị tạm ẩn và chờ Admin duyệt để xóa vĩnh viễn khỏi hệ thống.
              </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 focus:ring-red-600 text-white" onClick={() => {
                if (deleteProject) {
                  handleDeleteRequest(deleteProject.id);
                  setDeleteProject(null);
                }
              }}>
                Gửi yêu cầu xóa
              </AlertDialogAction>
           </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
