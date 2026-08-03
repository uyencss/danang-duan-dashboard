"use client";

import * as React from "react";
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
  ArrowUpDown,
  Download,
  Filter,
  Flame,
  HelpCircle,
  Info,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/lib/export-excel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { PhanLoaiKH } from "@prisma/client";
import { toast } from "sonner";

import { KhachHangFormDialog } from "../khach-hang-form-dialog";
import { deleteKhachHang } from "../actions";
import { LeaderCombobox } from "./leader-combobox";
import { ContactInfoModal } from "./contact-info-modal";
import type { CSKHRow, LeaderOption } from "./cskh-actions";

function ColumnFilter({ column, placeholder = "Lọc..." }: { column: any; placeholder?: string }) {
  const columnFilterValue = column.getFilterValue() ?? "";
  
  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center justify-center h-5 w-5 rounded-md p-0 hover:bg-white/20 data-[open]:bg-white/20 ml-1 transition-colors focus:outline-none focus:ring-1 focus:ring-white/50 cursor-pointer">
        <Filter className={cn("size-3", columnFilterValue ? "text-white fill-white" : "text-white/50")} />
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        {column.id === "contactHeat" ? (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => column.setFilterValue("empty")}
              className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-gray-100", columnFilterValue === "empty" ? "bg-gray-100 font-bold" : "")}
            >
              <HelpCircle className="size-4 text-gray-400" /> Cần điền info
            </button>
            <button
              onClick={() => column.setFilterValue("info")}
              className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-blue-50", columnFilterValue === "info" ? "bg-blue-50 font-bold" : "")}
            >
              <Info className="size-4 text-blue-500" /> Có thông tin
            </button>
            <button
              onClick={() => column.setFilterValue("fire")}
              className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-orange-100", columnFilterValue === "fire" ? "bg-orange-100 font-bold" : "")}
            >
              <Flame className="size-4 text-orange-500 fill-orange-500" /> Cần CSKH
            </button>
            
            {columnFilterValue && (
              <div className="pt-1 mt-1 border-t border-gray-100">
                <button
                  onClick={() => column.setFilterValue("")}
                  className="flex w-full items-center justify-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors uppercase tracking-wider font-bold"
                >
                  Xóa lọc
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <Input
              placeholder={placeholder}
              value={(columnFilterValue ?? "") as string}
              onChange={(e) => column.setFilterValue(e.target.value)}
              className="h-8 text-xs pr-7"
            />
            {columnFilterValue && (
              <button
                onClick={() => column.setFilterValue("")}
                className="absolute right-1.5 top-1.5 p-0.5 rounded-full hover:bg-gray-100 text-gray-500"
                title="Xóa lọc"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Heat detection ─────────────────────────────────────────────
function getHeatLevel(row: CSKHRow): "fire" | "info" | "empty" {
  const dates = [row.ngaySinhDauMoi, row.ngaySinhLanhDao, row.ngayKyNiem];
  const hasDates = dates.some((d) => !!d);

  if (!hasDates) return "empty";

  const now = new Date();
  const currM = now.getMonth();
  const nextM = (currM + 1) % 12;
  const hasFire = dates.some((d) => {
    if (!d) return false;
    const m = new Date(d).getMonth();
    return m === currM || m === nextM;
  });

  return hasFire ? "fire" : "info";
}

// ─── Category toggle ────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "CHINH_PHU", label: "Chính phủ/Sở ban ngành" },
  { value: "DOANH_NGHIEP", label: "Doanh nghiệp" },
  { value: "CONG_AN", label: "Công an" },
] as const;

interface CSKHClientProps {
  data: CSKHRow[];
  leaders: LeaderOption[];
}

export function CSKHClient({ data, leaders }: CSKHClientProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Form dialog state
  const [openForm, setOpenForm] = React.useState(false);
  const [selectedKH, setSelectedKH] = React.useState<any>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [khToBeDeleted, setKhToBeDeleted] = React.useState<CSKHRow | null>(null);

  // Contact info modal state
  const [contactModalOpen, setContactModalOpen] = React.useState(false);
  const [contactModalKH, setContactModalKH] = React.useState<CSKHRow | null>(null);

  // ─── Filter data by category ──────────────────────────────────
  const filteredByCategory = React.useMemo(() => {
    if (selectedCategory === "ALL") return data;
    return data.filter((d) => d.phanLoai === selectedCategory);
  }, [data, selectedCategory]);

  // ─── Delete handler ───────────────────────────────────────────
  const handleDelete = async (id: number) => {
    const result = await deleteKhachHang(id);
    if (result.success) {
      toast.success("Đã xóa khách hàng thành công!");
      setDeleteDialogOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  // ─── Columns ──────────────────────────────────────────────────
  const columns = React.useMemo<ColumnDef<CSKHRow>[]>(() => [
    // 1. Tên khách hàng
    {
      accessorKey: "ten",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent text-white hover:text-white/90 font-extrabold uppercase tracking-[0.1em] text-xs"
          >
            Tên khách hàng
            <ArrowUpDown className="ml-1.5 size-3 text-white/70" />
          </Button>
          <ColumnFilter column={column} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-bold text-[#191c1e] max-w-[280px] truncate text-[13px]">
          {row.original.ten}
        </div>
      ),
    },

    // 2. Lãnh đạo theo dõi
    {
      id: "lanhDaoTheoDoi",
      accessorFn: (row) => row.lanhDaoTheoDoiName || "",
      header: ({ column }) => (
        <div className="flex items-center gap-1 text-white font-extrabold uppercase tracking-[0.1em] text-xs">
          Lãnh đạo theo dõi
          <ColumnFilter column={column} />
        </div>
      ),
      cell: ({ row }) => (
        <LeaderCombobox
          khachHangId={row.original.id}
          currentLeaderId={row.original.lanhDaoTheoDoiId}
          currentLeaderName={row.original.lanhDaoTheoDoiName}
          leaders={leaders}
        />
      ),
    },

    // 3. Chuyên viên chủ trì – Tổ
    {
      id: "chuyenVienChuTri",
      accessorFn: (row) => row.chuyenVienChuTri || "",
      header: ({ column }) => (
        <div className="flex items-center gap-1 text-white font-extrabold uppercase tracking-[0.1em] text-xs">
          CV chủ trì – Tổ
          <ColumnFilter column={column} />
        </div>
      ),
      cell: ({ row }) => {
        const val = row.original.chuyenVienChuTri;
        if (!val) return <span className="text-gray-300 text-xs">—</span>;
        return (
          <div className="text-xs font-medium text-gray-700 min-w-[180px]">
            {val}
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        const val = (row.original.chuyenVienChuTri || "").toLowerCase();
        return val.includes(filterValue.toLowerCase());
      },
    },

    // 4. DA đang theo dõi
    {
      accessorKey: "duAnDangTheoDoi",
      header: ({ column }) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent text-white hover:text-white/90 font-extrabold uppercase tracking-[0.1em] text-xs"
          >
            Đang theo dõi
            <ArrowUpDown className="ml-1.5 size-3 text-white/70" />
          </Button>
          <ColumnFilter column={column} placeholder="Lọc SL..." />
        </div>
      ),
      filterFn: (row, id, filterValue) => String(row.getValue(id)).toLowerCase().includes(filterValue.toLowerCase()),
      cell: ({ row }) => (
        <div className="text-center">
          <Badge
            variant="secondary"
            className="font-mono font-bold px-2.5 py-1 text-xs"
          >
            {row.original.duAnDangTheoDoi}
          </Badge>
        </div>
      ),
    },

    // 5. DA trọng điểm
    {
      accessorKey: "duAnTrongDiem",
      header: ({ column }) => (
        <div className="flex items-center justify-center gap-1 text-white font-extrabold uppercase tracking-[0.1em] text-xs">
          Trọng điểm
          <ColumnFilter column={column} placeholder="Lọc SL..." />
        </div>
      ),
      filterFn: (row, id, filterValue) => String(row.getValue(id)).toLowerCase().includes(filterValue.toLowerCase()),
      cell: ({ row }) => {
        const count = row.original.duAnTrongDiem;
        return (
          <div className="text-center">
            <Badge
              variant="secondary"
              className={cn(
                "font-mono font-bold px-2.5 py-1 text-xs",
                count > 0 && "bg-amber-100 text-amber-700 border-amber-200"
              )}
            >
              {count}
            </Badge>
          </div>
        );
      },
    },

    // 6. DA đã ký HĐ
    {
      accessorKey: "duAnDaKy",
      header: ({ column }) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent text-white hover:text-white/90 font-extrabold uppercase tracking-[0.1em] text-xs"
          >
            Đã ký HĐ
            <ArrowUpDown className="ml-1.5 size-3 text-white/70" />
          </Button>
          <ColumnFilter column={column} placeholder="Lọc SL..." />
        </div>
      ),
      filterFn: (row, id, filterValue) => String(row.getValue(id)).toLowerCase().includes(filterValue.toLowerCase()),
      cell: ({ row }) => {
        const count = row.original.duAnDaKy;
        return (
          <div className="text-center">
            <Badge
              variant="secondary"
              className={cn(
                "font-mono font-bold px-2.5 py-1 text-xs",
                count === 0
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-green-50 text-green-700 border-green-200"
              )}
            >
              {count}
            </Badge>
          </div>
        );
      },
    },

    // 7. Thông tin đầu mối (icon-based)
    {
      id: "contactHeat",
      accessorFn: (row) => getHeatLevel(row),
      header: ({ column }) => (
        <div className="flex items-center gap-1 text-white font-extrabold uppercase tracking-[0.1em] text-xs">
          Đầu mối
          <ColumnFilter column={column} placeholder="fire/info/empty" />
        </div>
      ),
      cell: ({ row }) => {
        const heat = getHeatLevel(row.original);
        return (
          <button
            onClick={() => {
              setContactModalKH(row.original);
              setContactModalOpen(true);
            }}
            className={cn(
              "p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95",
              heat === "fire" && "bg-orange-100 hover:bg-orange-200",
              heat === "info" && "bg-blue-50 hover:bg-blue-100",
              heat === "empty" && "bg-gray-50 hover:bg-gray-100"
            )}
          >
            {heat === "fire" && (
              <Flame className="size-4 text-orange-500 fill-orange-500 animate-pulse" />
            )}
            {heat === "info" && (
              <Info className="size-4 text-blue-500" />
            )}
            {heat === "empty" && (
              <HelpCircle className="size-4 text-gray-400" />
            )}
          </button>
        );
      },
    },

    // 8. Tùy chọn (Actions)
    {
      id: "actions",
      cell: ({ row }) => {
        const kh = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  setSelectedKH(kh);
                  setOpenForm(true);
                }}
              >
                <Pencil className="mr-2 size-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                onClick={() => {
                  setKhToBeDeleted(kh);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 size-4" /> Xóa Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [leaders]);

  // ─── Table instance ───────────────────────────────────────────
  const table = useReactTable({
    data: filteredByCategory,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  // ─── Priority sort: fire rows on top ──────────────────────────
  const sortedRows = React.useMemo(() => {
    return [...table.getRowModel().rows].sort((a, b) => {
      const heatOrder = { fire: 0, info: 1, empty: 2 };
      const hA = heatOrder[getHeatLevel(a.original)];
      const hB = heatOrder[getHeatLevel(b.original)];
      return hA - hB;
    });
  }, [table.getRowModel().rows]);

  // ─── Export handler ───────────────────────────────────────────
  const handleExport = () => {
    const exportData = table.getFilteredRowModel().rows.map((row) => {
      const kh = row.original;
      return {
        "Tên khách hàng": kh.ten,
        "Phân loại":
          kh.phanLoai === "CHINH_PHU"
            ? "Chính phủ/Sở ban ngành"
            : kh.phanLoai === "CONG_AN"
            ? "Công an"
            : "Doanh nghiệp",
        "Lãnh đạo theo dõi": kh.lanhDaoTheoDoiName || "",
        "CV chủ trì – Tổ": kh.chuyenVienChuTri || "",
        "DA đang theo dõi": kh.duAnDangTheoDoi,
        "DA trọng điểm": kh.duAnTrongDiem,
        "DA đã ký HĐ": kh.duAnDaKy,
        "Đầu mối": kh.dauMoiTiepCan || "",
        "SĐT đầu mối": kh.soDienThoaiDauMoi || "",
        "Sinh nhật đầu mối": kh.ngaySinhDauMoi
          ? new Date(kh.ngaySinhDauMoi).toLocaleDateString("vi-VN")
          : "",
        "Lãnh đạo đơn vị": kh.lanhDaoDonVi || "",
        "Sinh nhật lãnh đạo": kh.ngaySinhLanhDao
          ? new Date(kh.ngaySinhLanhDao).toLocaleDateString("vi-VN")
          : "",
        "Ngày kỷ niệm": kh.ngayKyNiem
          ? new Date(kh.ngayKyNiem).toLocaleDateString("vi-VN")
          : "",
      };
    });
    exportToExcel(exportData, "CSKH_KhachHang");
  };

  // ─── Stats ────────────────────────────────────────────────────
  const fireCount = filteredByCategory.filter((d) => getHeatLevel(d) === "fire").length;

  return (
    <div className="space-y-3">
      {/* ─── Toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Category toggles + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Category pills */}
          <div className="flex items-center bg-slate-100/80 p-2 rounded-2xl gap-2.5 shadow-inner border border-slate-200">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedCategory(opt.value)}
                className={cn(
                  "px-4 py-1.5 text-[11px] md:text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-100",
                  selectedCategory === opt.value
                    ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)] border border-blue-800 translate-y-[3px]"
                    : "bg-gradient-to-b from-[#0058bc] to-[#003b8b] text-white border border-[#002d6b] shadow-[0_3px_0_#002150,0_4px_6px_rgba(0,0,0,0.2)] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#002150]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Nút xoá lọc (Clear filters) */}
          {table.getState().columnFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetColumnFilters()}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-9 px-3"
            >
              <X className="size-4 mr-1.5" />
              Xóa lọc
            </Button>
          )}
        </div>

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-2">
          {fireCount > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-bold text-xs px-2.5 py-1 animate-pulse">
              <Flame className="size-3 mr-1 fill-orange-500" />
              {fireCount} KH cần chăm sóc
            </Badge>
          )}
          <Badge className="bg-gray-100 text-gray-600 font-bold text-xs px-2.5 py-1 border-gray-200">
            {filteredByCategory.length} khách hàng
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary/5 font-bold shadow-sm rounded-xl"
            onClick={handleExport}
          >
            <Download className="mr-1.5 size-3.5" /> Xuất Excel
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#0058bc] to-blue-500 hover:from-blue-600 hover:to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/30 rounded-xl border-none"
            onClick={() => {
              setSelectedKH(null);
              setOpenForm(true);
            }}
          >
            <Plus className="mr-1.5 size-3.5" /> Thêm KH
          </Button>
        </div>
      </div>

      {/* ─── Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm [&>div]:max-h-[calc(100vh-220px)] [&>div]:overflow-auto">
        <Table>
          <TableHeader className="bg-gradient-to-r from-[#042654] to-[#0058bc] shadow-md border-none sticky top-0 z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-white text-xs font-extrabold uppercase tracking-[0.1em] py-3.5 whitespace-nowrap align-middle"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {sortedRows.length ? (
              sortedRows.map((row) => {
                const heat = getHeatLevel(row.original);
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "hover:bg-gray-50/30 transition-colors border-gray-50",
                      heat === "fire" && "bg-amber-50/40 hover:bg-amber-50/60"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-400 italic"
                >
                  Không tìm thấy khách hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Pagination ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-500">
          Hiển thị{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          –{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            filteredByCategory.length
          )}{" "}
          / {filteredByCategory.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg h-7 text-xs border-gray-200"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg h-7 text-xs border-gray-200"
          >
            Sau
          </Button>
        </div>
      </div>

      {/* ─── Modals & Dialogs ─────────────────────────────────── */}

      {/* Edit Form (reuse from parent) */}
      <KhachHangFormDialog
        open={openForm}
        setOpen={setOpenForm}
        data={selectedKH}
        key={selectedKH?.id || "create"}
      />

      {/* Contact Info Modal */}
      <ContactInfoModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        customer={contactModalKH}
        onEdit={() => {
          setContactModalOpen(false);
          setSelectedKH(contactModalKH);
          setOpenForm(true);
        }}
      />

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này không thể hoàn tác. Khách hàng{" "}
              <strong>{khToBeDeleted?.ten}</strong> sẽ bị xóa vĩnh viễn.
              Nếu khách hàng còn dự án liên quan, bạn sẽ không thể thực hiện.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 focus:ring-red-600 font-bold"
              onClick={() => khToBeDeleted && handleDelete(khToBeDeleted.id)}
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
