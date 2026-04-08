"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  Flame,
  CalendarDays,
  Filter,
} from "lucide-react";
import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { exportToExcel } from "@/lib/export-excel";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PhanLoaiKH } from "@prisma/client";
import { KhachHangFormDialog } from "./khach-hang-form-dialog";
import { toggleKhachHangStatus, deleteKhachHang } from "./actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FolderKanban, TrendingUp, Clock } from "lucide-react";
import { TrangThaiDuAn as StatusPrisma } from "@prisma/client";

export function CustomersTable({ data }: { data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [openForm, setOpenForm] = React.useState(false);
  const [selectedKH, setSelectedKH] = React.useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [khToBeDeleted, setKhToBeDeleted] = React.useState<any>(null);
  const [viewProjectsKH, setViewProjectsKH] = React.useState<any>(null);

  const handleDelete = async (id: number) => {
    const result = await deleteKhachHang(id);
    if (result.success) {
      toast.success("Đã xóa khách hàng thành công!");
      setDeleteDialogOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleToggle = async (id: number, current: boolean) => {
    const result = await toggleKhachHangStatus(id, !current);
    if (result.success) {
      toast.success("Đã cập nhật trạng thái!");
    } else {
      toast.error(result.error);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "ten",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Tên Khách hàng
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-bold text-gray-800 ml-4 max-w-[200px] truncate">{row.getValue("ten")}</div>,
    },
    {
      accessorKey: "phanLoai",
      header: "Phân loại",
      cell: ({ row }) => {
        const type = row.getValue("phanLoai") as PhanLoaiKH;
        return (
          <Badge
            variant="outline"
            className={
              type === "CHINH_PHU" ? "bg-blue-50 text-blue-700 border-blue-200" :
                type === "CONG_AN" ? "bg-red-50 text-red-700 border-red-200" :
                  "bg-green-50 text-green-700 border-green-200"
            }
          >
            {type === "CHINH_PHU" ? "Chính phủ/ Sở ban ngành" : type === "CONG_AN" ? "Công an" : "Doanh nghiệp"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "ngaySinhDauMoi",
      header: "Sinh nhật Đầu mối",
      cell: ({ row }) => {
        const date = row.original.ngaySinhDauMoi;
        if (!date) return <span className="text-slate-300">—</span>;
        const d = new Date(date);
        const now = new Date();
        const m = d.getMonth();
        const currM = now.getMonth();
        const isHighlight = m === currM || m === (currM + 1) % 12;
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">{format(d, "dd/MM")}</span>
            {isHighlight && <Flame className="size-4 text-orange-500 fill-orange-500 animate-pulse" />}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const date = row.getValue(id) as string;
        if (!date) return false;
        const m = (new Date(date).getMonth() + 1).toString();
        return value.includes(m);
      },
    },
    {
      accessorKey: "ngaySinhLanhDao",
      header: "Sinh nhật Lãnh đạo",
      cell: ({ row }) => {
        const date = row.original.ngaySinhLanhDao;
        if (!date) return <span className="text-slate-300">—</span>;
        const d = new Date(date);
        const now = new Date();
        const m = d.getMonth();
        const currM = now.getMonth();
        const isHighlight = m === currM || m === (currM + 1) % 12;
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">{format(d, "dd/MM")}</span>
            {isHighlight && <Flame className="size-4 text-orange-500 fill-orange-500 animate-pulse" />}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const date = row.getValue(id) as string;
        if (!date) return false;
        const m = (new Date(date).getMonth() + 1).toString();
        return value.includes(m);
      },
    },
    {
      accessorKey: "ngayKyNiem",
      header: "Ngày kỷ niệm",
      cell: ({ row }) => {
        const date = row.original.ngayKyNiem;
        if (!date) return <span className="text-slate-300">—</span>;
        const d = new Date(date);
        const now = new Date();
        const m = d.getMonth();
        const currM = now.getMonth();
        const isHighlight = m === currM || m === (currM + 1) % 12;
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <span className="text-xs font-bold">{format(d, "dd/MM")}</span>
            {isHighlight && <Flame className="size-4 text-orange-500 fill-orange-500 animate-pulse" />}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const date = row.getValue(id) as string;
        if (!date) return false;
        const m = (new Date(date).getMonth() + 1).toString();
        return value.includes(m);
      },
    },
    {
      accessorKey: "_count.duAns",
      header: "Dự án",
      cell: ({ row }) => (
        <Badge 
          variant="secondary" 
          className="font-mono cursor-pointer hover:bg-[#0058bc] hover:text-white transition-all hover:scale-110 active:scale-95 px-2.5 py-1"
          onClick={() => setViewProjectsKH(row.original)}
        >
          {row.original._count.duAns}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.getValue("isActive")}
            onCheckedChange={() => handleToggle(row.original.id, row.original.isActive)}
          />
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const kh = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  setSelectedKH(kh);
                  setOpenForm(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                onClick={() => {
                  setKhToBeDeleted(kh);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Xóa Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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
    state: {
      sorting,
      columnFilters,
    },
  });

  // Apply Priority Sorting based on "Heat" (Warnings)
  const sortedData = React.useMemo(() => {
    const checkHeat = (kh: any) => {
      const dates = [kh.ngaySinhDauMoi, kh.ngaySinhLanhDao, kh.ngayKyNiem];
      const now = new Date();
      const currM = now.getMonth();
      const nextM = (currM + 1) % 12;
      return dates.some(d => {
        if (!d) return false;
        const m = new Date(d).getMonth();
        return m === currM || m === nextM;
      });
    };

    return [...table.getRowModel().rows].sort((a, b) => {
      const heatA = checkHeat(a.original) ? 1 : 0;
      const heatB = checkHeat(b.original) ? 1 : 0;
      if (heatA !== heatB) return heatB - heatA; // Warned first
      return 0;
    });
  }, [table.getRowModel().rows]);

  const handleExport = () => {
    const exportData = table.getFilteredRowModel().rows.map(row => {
      const kh = row.original as any;
      return {
        "Tên Khách hàng": kh.ten,
        "Phân loại": kh.phanLoai === "CHINH_PHU" ? "Chính phủ/ Sở ban ngành" : kh.phanLoai === "CONG_AN" ? "Công an" : "Doanh nghiệp",
        "Địa chỉ": kh.diaChi || "",
        "Số điện thoại": kh.soDienThoai || "",
        "Email": kh.email || "",
        "Đầu mối tiếp cận": kh.dauMoiTiepCan || "",
        "SĐT Đầu mối": kh.soDienThoaiDauMoi || "",
        "Ngày sinh Đầu mối": kh.ngaySinhDauMoi ? new Date(kh.ngaySinhDauMoi).toLocaleDateString("vi-VN") : "",
        "Lãnh đạo đơn vị": kh.lanhDaoDonVi || "",
        "SĐT Lãnh đạo": kh.soDienThoaiLanhDao || "",
        "Ngày sinh Lãnh đạo": kh.ngaySinhLanhDao ? new Date(kh.ngaySinhLanhDao).toLocaleDateString("vi-VN") : "",
        "Ngày thành lập": kh.ngayThanhLap ? new Date(kh.ngayThanhLap).toLocaleDateString("vi-VN") : "",
        "Ngày kỷ niệm": kh.ngayKyNiem ? new Date(kh.ngayKyNiem).toLocaleDateString("vi-VN") : "",
        "Số lượng dự án": kh._count?.duAns || 0,
        "Trạng thái": kh.isActive ? "Hoạt động" : "Ngừng hoạt động",
        "Ghi chú thêm": kh.ghiChu || ""
      };
    });
    exportToExcel(exportData, "DanhSachKhachHang");
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-gray-100 w-full max-w-sm shadow-sm">
          <Search className="size-4 text-gray-400 mr-2" />
          <Input
            placeholder="Tìm tên khách hàng..."
            value={(table.getColumn("ten")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("ten")?.setFilterValue(event.target.value)}
            className="border-none bg-transparent h-6 focus-visible:ring-0 text-sm shadow-none p-0"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/5 font-bold shadow-sm rounded-xl"
            onClick={handleExport}
          >
            <Download className="mr-2 size-4" /> Xuất Excel
          </Button>
          <Button
            className="bg-gradient-to-r from-[#0058bc] to-blue-500 hover:from-blue-600 hover:to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/30 rounded-xl border-none"
            onClick={() => {
              setSelectedKH(null);
              setOpenForm(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Thêm Khách hàng
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isDateFilter = ["ngaySinhDauMoi", "ngaySinhLanhDao", "ngayKyNiem"].includes(header.id);
                  const filterValue = header.column.getFilterValue() as string[] || [];

                  return (
                    <TableHead key={header.id} className="text-gray-500 text-xs font-bold uppercase tracking-wider relative group">
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        
                        {isDateFilter && (
                          <Popover>
                            <PopoverTrigger className={cn("p-1 h-fit hover:bg-gray-100 rounded-md transition-colors", filterValue.length > 0 && "text-blue-600 bg-blue-50")}>
                                <Filter className="size-3" />
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2" align="start">
                              <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-gray-400 px-2 pb-1 border-b">Lọc theo tháng</p>
                                <div className="grid grid-cols-3 gap-1">
                                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(m => (
                                    <button
                                      key={m}
                                      onClick={() => {
                                        const next = filterValue.includes(m) ? filterValue.filter(x => x !== m) : [...filterValue, m];
                                        header.column.setFilterValue(next.length ? next : undefined);
                                      }}
                                      className={cn(
                                        "py-1 rounded text-[10px] font-bold border transition-colors",
                                        filterValue.includes(m) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-100 hover:border-blue-200"
                                      )}
                                    >
                                      Tháng {m}
                                    </button>
                                  ))}
                                </div>
                                {filterValue.length > 0 && (
                                  <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => header.column.setFilterValue(undefined)}>
                                    Xóa tất cả
                                  </Button>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {sortedData.length ? (
              sortedData.map((row) => (
                <TableRow key={row.id} className={cn(
                  "hover:bg-gray-50/30 transition-colors border-gray-50",
                  // Highlight row background if has heat
                  // checkHeat is not accessible here easily, let's use a simpler check
                  [row.original.ngaySinhDauMoi, row.original.ngaySinhLanhDao, row.original.ngayKyNiem].some(d => {
                      if (!d) return false;
                      const m = new Date(d).getMonth();
                      const now = new Date();
                      return m === now.getMonth() || m === (now.getMonth() + 1) % 12;
                  }) && "bg-orange-50/30 hover:bg-orange-50/50"
                )}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-400 italic">
                  Không tìm thấy kết quả phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-gray-500">
          Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} của {data.length} khách hàng
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg h-8 border-gray-200"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg h-8 border-gray-200"
          >
            Sau
          </Button>
        </div>
      </div>

      <KhachHangFormDialog
        open={openForm}
        setOpen={setOpenForm}
        data={selectedKH}
        key={selectedKH?.id || "create"}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này không thể hoàn tác. Khách hàng <strong>{khToBeDeleted?.ten}</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống.
              Nếu khách hàng còn dự án liên quan, bạn sẽ không thể thực hiện thao tác này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 focus:ring-red-600 font-bold" 
              onClick={() => handleDelete(khToBeDeleted?.id)}
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Projects List Dialog */}
      <Dialog open={!!viewProjectsKH} onOpenChange={(open) => !open && setViewProjectsKH(null)}>
        <DialogContent className="sm:max-w-[700px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-gradient-to-br from-[#0058bc] to-blue-600 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                 <FolderKanban className="size-6" />
              </div>
              <DialogTitle className="text-2xl font-black">Danh sách Dự án</DialogTitle>
            </div>
            <DialogDescription className="text-blue-100 font-medium text-base">
              Khách hàng: <span className="text-white font-bold">{viewProjectsKH?.ten}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-8">
            <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-bold text-[#191c1e] text-[10px] uppercase tracking-wider">Tên dự án</TableHead>
                    <TableHead className="font-bold text-[#191c1e] text-[10px] uppercase tracking-wider text-right">Tổng DT kỳ vọng</TableHead>
                    <TableHead className="font-bold text-[#191c1e] text-[10px] uppercase tracking-wider text-center">Hiện trạng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewProjectsKH?.duAns?.length > 0 ? (
                    viewProjectsKH.duAns.map((project: any) => (
                      <TableRow key={project.id} className="hover:bg-blue-50/30">
                        <TableCell className="py-4">
                          <p className="font-bold text-[13px] text-[#191c1e] leading-tight">{project.tenDuAn}</p>
                          <span className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase mt-1",
                            project.trangThaiHienTai === "DA_KY_HOP_DONG" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {project.trangThaiHienTai === "DA_KY_HOP_DONG" ? "Đã ký HĐ" : "Đang triển khai"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-4 font-mono font-bold text-blue-600">
                          {project.doanhThuTheoThang?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <div className="flex flex-col items-center gap-1">
                            <Clock className="size-3 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-500 max-w-[120px] truncate">
                              {project.hienTaiBuoc?.split(":")[0] || "—"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-slate-400 italic">
                        Hiện khách hàng chưa có dự án nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-emerald-500" />
                  <span className="text-sm font-bold text-gray-600">Tổng doanh thu (tháng):</span>
               </div>
               <span className="text-xl font-black text-[#0058bc]">
                  {viewProjectsKH?.duAns?.reduce((sum: number, p: any) => sum + (p.doanhThuTheoThang || 0), 0).toLocaleString() || 0}
               </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
