"use client";

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SourceDataRow } from "./source-data-actions";

// ── Status Styles ──────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  MOI: { label: "Mới", className: "bg-blue-100 text-blue-700" },
  DANG_LAM_VIEC: {
    label: "Đang làm việc",
    className: "bg-amber-100 text-amber-700",
  },
  DA_DEMO: { label: "Đã demo", className: "bg-purple-100 text-purple-700" },
  DA_GUI_BAO_GIA: {
    label: "Đã gửi báo giá",
    className: "bg-blue-100 text-blue-700",
  },
  DA_KY_HOP_DONG: {
    label: "Đã ký HĐ",
    className: "bg-green-100 text-green-700",
  },
  THAT_BAI: { label: "Thất bại", className: "bg-red-100 text-red-700" },
};

const PHAN_LOAI_LABELS: Record<string, string> = {
  CHINH_PHU: "Chính phủ",
  DOANH_NGHIEP: "Doanh nghiệp",
  CONG_AN: "Công an",
  PHUONG_XA: "Phường xã",
};

const SOURCE_LABELS: Record<string, { label: string; className: string }> = {
  PIPELINE: { label: "Pipeline", className: "bg-blue-50 text-blue-600" },
  CLOUD_DISTRIBUTE: {
    label: "Cloud",
    className: "bg-emerald-50 text-emerald-600",
  },
  ECONTRACT_INVOICE: {
    label: "EContract",
    className: "bg-amber-50 text-amber-600",
  },
};

// ── Format helpers ─────────────────────────────────────────────────
function formatRevenue(val: number): string {
  if (val === 0) return "-";
  if (val >= 1_000_000) {
    return (val / 1_000_000).toLocaleString("vi-VN", {
      maximumFractionDigits: 1,
    }) + "tr";
  }
  if (val >= 1_000) {
    return (val / 1_000).toLocaleString("vi-VN", {
      maximumFractionDigits: 0,
    }) + "k";
  }
  return val.toLocaleString("vi-VN");
}

// ── Component ──────────────────────────────────────────────────────
interface SourceTableProps {
  data: SourceDataRow[];
  year: number;
  sourceType: "pipeline" | "cloud" | "econtract" | "master";
  isReadOnly?: boolean;
}

export function SourceTable({
  data,
  year,
  sourceType,
  isReadOnly = false,
}: SourceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // ── Column Definitions ─────────────────────────────────────────
  const columns = useMemo<ColumnDef<SourceDataRow>[]>(() => {
    const baseCols: ColumnDef<SourceDataRow>[] = [
      // STT
      {
        id: "stt",
        header: "STT",
        size: 50,
        cell: ({ row }) => (
          <span className="text-xs text-slate-400 font-mono">
            {row.index + 1}
          </span>
        ),
      },
      // Tên KH
      {
        accessorKey: "khachHang",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-slate-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Khách hàng
            <ArrowUpDown className="size-3" />
          </button>
        ),
        size: 180,
        cell: ({ row }) => (
          <div className="min-w-[140px]">
            <span className="font-semibold text-sm text-slate-800 line-clamp-1">
              {row.original.khachHang}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {PHAN_LOAI_LABELS[row.original.phanLoaiKH] ||
                row.original.phanLoaiKH}
            </span>
          </div>
        ),
      },
      // Tên dự án
      {
        accessorKey: "tenDuAn",
        header: "Tên dự án",
        size: 200,
        cell: ({ row }) => (
          <span className="text-sm text-slate-700 line-clamp-2 min-w-[160px] block">
            {row.original.tenDuAn}
          </span>
        ),
      },
      // Nhóm SP
      {
        accessorKey: "nhomSP",
        header: "Nhóm SP",
        size: 120,
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-600">
            {row.original.nhomSP}
          </span>
        ),
      },
    ];

    // Source badge (only for Bảng 4)
    if (sourceType === "master") {
      baseCols.push({
        accessorKey: "sourceType",
        header: "Nguồn",
        size: 100,
        cell: ({ row }) => {
          const src = SOURCE_LABELS[row.original.sourceType];
          return src ? (
            <span
              className={`text-[10px] px-2 py-1 rounded-full font-bold ${src.className}`}
            >
              {src.label}
            </span>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          );
        },
      });
    }

    // AM
    baseCols.push({
      accessorKey: "amName",
      header: "AM",
      size: 100,
      cell: ({ row }) => (
        <span className="text-xs text-slate-600">
          {row.original.amName || "-"}
        </span>
      ),
    });

    // DT Tổng
    baseCols.push({
      accessorKey: "tongDoanhThu",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-slate-900"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          DT Tổng
          <ArrowUpDown className="size-3" />
        </button>
      ),
      size: 100,
      cell: ({ row }) => (
        <span className="text-sm font-bold text-slate-800 tabular-nums">
          {formatRevenue(row.original.tongDoanhThu)}
        </span>
      ),
    });

    // Status
    baseCols.push({
      accessorKey: "trangThai",
      header: "Trạng thái",
      size: 110,
      cell: ({ row }) => {
        const status = STATUS_STYLES[row.original.trangThai];
        return status ? (
          <span
            className={`text-[10px] px-2 py-1 rounded-full font-bold whitespace-nowrap ${status.className}`}
          >
            {status.label}
          </span>
        ) : (
          <span className="text-xs text-slate-400">{row.original.trangThai}</span>
        );
      },
    });

    // Mã HĐ
    baseCols.push({
      accessorKey: "maHopDong",
      header: "Mã HĐ",
      size: 100,
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 font-mono">
          {row.original.maHopDong || "-"}
        </span>
      ),
    });

    // Số kỳ 1 gói cước (tháng)
    if (sourceType === "cloud" || sourceType === "master") {
      baseCols.push({
        accessorKey: "soKy1GoiCuoc",
        header: "Số kỳ (tháng)",
        size: 100,
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 font-semibold block text-center">
            {row.original.soKy1GoiCuoc !== null ? `${row.original.soKy1GoiCuoc} tháng` : "-"}
          </span>
        ),
      });
    }

    // DT theo tháng (Bảng 3 - EContract)
    if (sourceType === "econtract") {
      baseCols.push({
        accessorKey: "doanhThuTheoThang",
        header: "DT ghi nhận/tháng",
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm font-bold text-emerald-700 tabular-nums">
            {row.original.doanhThuTheoThang > 0
              ? formatRevenue(row.original.doanhThuTheoThang)
              : "-"}
          </span>
        ),
      });
    }

    // Ngày bắt đầu / Ngày kết thúc
    if (sourceType === "cloud" || sourceType === "econtract") {
      baseCols.push({
        accessorKey: "ngayBatDau",
        header: "Ngày bắt đầu",
        size: 110,
        cell: ({ row }) => {
          const dateStr = row.original.ngayBatDau;
          if (!dateStr) return <span className="text-xs text-slate-400">-</span>;
          const d = new Date(dateStr);
          return (
            <span className="text-xs text-slate-600 block text-center">
              {d.toLocaleDateString("vi-VN")}
            </span>
          );
        },
      });

      baseCols.push({
        accessorKey: "ngayKetThuc",
        header: "Ngày kết thúc",
        size: 110,
        cell: ({ row }) => {
          const dateStr = row.original.ngayKetThuc;
          if (!dateStr) return <span className="text-xs text-slate-400">-</span>;
          const d = new Date(dateStr);
          return (
            <span className="text-xs text-slate-600 block text-center">
              {d.toLocaleDateString("vi-VN")}
            </span>
          );
        },
      });
    }

    // ── 12 Month Columns ──────────────────────────────────────────
    if (sourceType !== "pipeline") {
      for (let m = 1; m <= 12; m++) {
        baseCols.push({
          id: `month${m}`,
          header: () => (
            <span className="text-[10px] font-bold text-slate-500">
              T{m}
            </span>
          ),
          size: 75,
          cell: ({ row }) => {
            const key = `month${m}` as keyof typeof row.original.months;
            const val = row.original.months[key];
            return (
              <span
                className={cn(
                  "text-xs tabular-nums font-medium text-right block",
                  val > 0 ? "text-emerald-700 font-bold" : "text-slate-300"
                )}
              >
                {val > 0 ? formatRevenue(val) : "-"}
              </span>
            );
          },
        });
      }
    }

    // Tổng năm
    if (sourceType !== "pipeline") {
      baseCols.push({
        id: "totalNam",
        header: () => (
          <span className="text-[10px] font-black text-slate-700 uppercase">
            Tổng
          </span>
        ),
        size: 90,
        cell: ({ row }) => (
          <span
            className={cn(
              "text-xs font-black tabular-nums text-right block",
              row.original.totalNam > 0
                ? "text-blue-700"
                : "text-slate-300"
            )}
          >
            {row.original.totalNam > 0
              ? formatRevenue(row.original.totalNam)
              : "-"}
          </span>
        ),
      });
    }

    // Tháng ghi nhận (only for Bảng 3/econtract)
    if (sourceType === "econtract") {
      baseCols.push({
        id: "thangGhiNhanCol",
        accessorKey: "thangGhiNhan",
        header: "Tháng ghi nhận",
        size: 130,
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 font-semibold block text-center">
            {row.original.thangGhiNhan || "-"}
          </span>
        ),
      });
    }

    return baseCols;
  }, [sourceType]);

  // ── Table Instance ──────────────────────────────────────────────
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      return (
        row.original.khachHang.toLowerCase().includes(search) ||
        row.original.tenDuAn.toLowerCase().includes(search) ||
        row.original.nhomSP.toLowerCase().includes(search) ||
        (row.original.maHopDong || "").toLowerCase().includes(search) ||
        (row.original.amName || "").toLowerCase().includes(search)
      );
    },
  });

  // ── Footer Totals ───────────────────────────────────────────────
  const filteredRows = table.getFilteredRowModel().rows;
  const monthTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (let m = 1; m <= 12; m++) {
      totals[`month${m}`] = filteredRows.reduce(
        (sum, row) =>
          sum +
          (row.original.months[
            `month${m}` as keyof typeof row.original.months
          ] || 0),
        0
      );
    }
    totals.total = filteredRows.reduce(
      (sum, row) => sum + row.original.totalNam,
      0
    );
    return totals;
  }, [filteredRows]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Tìm kiếm khách hàng, dự án, mã hợp đồng..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-10 h-10 rounded-xl border-slate-200 focus:border-blue-300 text-sm"
        />
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-2 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                      style={{
                        width: header.getSize(),
                        minWidth: header.getSize(),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-slate-100 transition-colors hover:bg-blue-50/30",
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-2 py-2 text-sm"
                        style={{
                          width: cell.column.getSize(),
                          minWidth: cell.column.getSize(),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-16 text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Search className="size-8 text-slate-300" />
                      <p className="font-semibold">
                        Không có dữ liệu cho năm {year}
                      </p>
                      <p className="text-xs">
                        Hãy import dữ liệu từ Excel hoặc thay đổi bộ lọc năm.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Footer Totals */}
            {filteredRows.length > 0 && (
              <tfoot>
                <tr className="bg-gradient-to-r from-slate-100 to-blue-50 border-t-2 border-slate-200">
                  <td
                    colSpan={
                      sourceType === "master" ? 10 : (sourceType === "cloud" ? 11 : (sourceType === "econtract" ? 12 : 9))
                    }
                    className="px-2 py-2.5 text-right text-xs font-black text-slate-600 uppercase"
                  >
                    TỔNG CỘNG
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <td
                      key={`total-m${m}`}
                      className="px-2 py-2.5 text-right"
                    >
                      <span className="text-xs font-black text-blue-700 tabular-nums">
                        {monthTotals[`month${m}`] > 0
                          ? formatRevenue(monthTotals[`month${m}`])
                          : "-"}
                      </span>
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-right">
                    <span className="text-xs font-black text-blue-900 tabular-nums">
                      {formatRevenue(monthTotals.total)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Hiển thị{" "}
          <span className="font-bold text-slate-700">
            {table.getRowModel().rows.length}
          </span>{" "}
          / <span className="font-bold">{data.length}</span> dòng
          {globalFilter && " (đã lọc)"}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 rounded-lg"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs font-bold">
            Trang {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 rounded-lg"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
