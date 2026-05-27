"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  RefreshCcw,
  Download,
  Calendar,
  Search,
  DollarSign,
  TrendingUp,
  Layers,
  Sparkles,
} from "lucide-react";
import { triggerRebuildAll } from "./actions";
import { exportToExcel } from "@/lib/export-excel";

const MONTH_LABELS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];

interface MonthData {
  doanhThu: number;
  soNgay: number;
  loai: string;
}

interface ProjectRow {
  id: number;
  tenDuAn: string;
  tongDoanhThuDuKien: number;
  ngayBatDau: Date;
  ngayKetThuc: Date | null;
  trangThai: string;
  maHopDong: string | null;
  khachHang: string;
  sanPham: string;
  nhomSP: string;
  am: string;
  cv: string;
  months: Record<number, MonthData>;
}

interface Props {
  data: {
    projects: ProjectRow[];
    monthTotals: Record<number, number>;
    monthKyMoi: Record<number, number>;
    monthDuyTri: Record<number, number>;
  };
  year: number;
}

const STATUS_LABELS: Record<string, string> = {
  MOI: "Mới",
  DANG_LAM_VIEC: "Đang LV",
  DA_DEMO: "Đã demo",
  DA_GUI_BAO_GIA: "Đã BG",
  DA_KY_HOP_DONG: "Đã ký HĐ",
  THAT_BAI: "Thất bại",
};

function formatCurrency(val: number): string {
  if (val === 0) return "—";
  return val.toFixed(1);
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

export function RevenueTrackingClient({ data, year }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [search, setSearch] = useState("");
  const [filterNhom, setFilterNhom] = useState("ALL");

  // Unique product groups for filter
  const nhomOptions = useMemo(() => {
    const groups = new Set(data.projects.map((p) => p.nhomSP));
    return Array.from(groups).sort();
  }, [data.projects]);

  // Filter projects
  const filtered = useMemo(() => {
    return data.projects.filter((p) => {
      const matchSearch =
        !search ||
        p.tenDuAn.toLowerCase().includes(search.toLowerCase()) ||
        p.khachHang.toLowerCase().includes(search.toLowerCase()) ||
        p.am.toLowerCase().includes(search.toLowerCase());
      const matchNhom = filterNhom === "ALL" || p.nhomSP === filterNhom;
      return matchSearch && matchNhom;
    });
  }, [data.projects, search, filterNhom]);

  // Recalculate column totals based on filtered data
  const filteredTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    const kyMoi: Record<number, number> = {};
    const duyTri: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      totals[m] = 0;
      kyMoi[m] = 0;
      duyTri[m] = 0;
    }
    for (const p of filtered) {
      for (const [month, d] of Object.entries(p.months)) {
        const m = parseInt(month);
        totals[m] += d.doanhThu;
        if (d.loai === "KY_MOI") kyMoi[m] += d.doanhThu;
        else duyTri[m] += d.doanhThu;
      }
    }
    return { totals, kyMoi, duyTri };
  }, [filtered]);

  const grandTotal = Object.values(filteredTotals.totals).reduce(
    (s, v) => s + v,
    0
  );
  const totalKyMoi = Object.values(filteredTotals.kyMoi).reduce(
    (s, v) => s + v,
    0
  );
  const totalDuyTri = Object.values(filteredTotals.duyTri).reduce(
    (s, v) => s + v,
    0
  );

  const handleYearChange = (val: string | null) => {
    if (!val) return;
    startTransition(() => {
      router.push(`/quan-tri-doanh-thu?y=${val}`);
    });
  };

  const handleRebuild = async () => {
    if (
      !confirm(
        "Xây dựng lại toàn bộ bảng phân bổ doanh thu cho tất cả dự án?\nThao tác này sẽ mất vài giây."
      )
    )
      return;
    setIsRebuilding(true);
    try {
      const result = await triggerRebuildAll();
      alert(
        `✅ Hoàn tất! Đã xử lý ${result.projectCount} dự án, tạo ${result.sliceCount} bản ghi phân bổ.`
      );
      router.refresh();
    } catch (e) {
      alert("❌ Có lỗi xảy ra khi rebuild.");
    }
    setIsRebuilding(false);
  };

  const handleExport = () => {
    const rows = filtered.flatMap((p) => {
      return Object.entries(p.months).map(([month, d]) => ({
        "Dự án": p.tenDuAn,
        "Khách hàng": p.khachHang,
        "Nhóm SP": p.nhomSP,
        "Sản phẩm": p.sanPham,
        AM: p.am,
        CV: p.cv,
        "Tổng HĐ": p.tongDoanhThuDuKien,
        Tháng: parseInt(month),
        Năm: year,
        "Số ngày": d.soNgay,
        "DT phân bổ": d.doanhThu,
        Loại: d.loai === "KY_MOI" ? "Ký mới" : "Duy trì",
      }));
    });
    exportToExcel(rows, `PhanBo_DoanhThu_${year}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <DollarSign className="size-6 text-white" />
            </div>
            Phân bổ Doanh thu theo Ngày
          </h1>
          <p className="text-gray-500 mt-1">
            Daily Pro-Rata Revenue Amortization — Kiểm soát phân bổ doanh thu
            hợp đồng theo từng tháng
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={String(year)}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-28 h-9 rounded-xl border-gray-200 bg-white shadow-sm">
              <Calendar className="size-3.5 mr-1 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleRebuild}
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-xl font-bold text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100"
            disabled={isRebuilding}
          >
            <RefreshCcw
              className={`size-3.5 ${isRebuilding ? "animate-spin" : ""}`}
            />
            {isRebuilding ? "Đang xử lý..." : "Rebuild All"}
          </Button>

          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-xl font-bold text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
          >
            <Download className="size-3.5" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider">
                Tổng DT phân bổ {year}
              </p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {grandTotal.toFixed(1)}{" "}
                <span className="text-sm font-bold">Tr.đ</span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <TrendingUp className="size-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600/70 uppercase tracking-wider">
                DT Ký mới (KY_MOI)
              </p>
              <p className="text-2xl font-black text-blue-700 mt-1">
                {totalKyMoi.toFixed(1)}{" "}
                <span className="text-sm font-bold">Tr.đ</span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10">
              <Sparkles className="size-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-600/70 uppercase tracking-wider">
                DT Duy trì (DUY_TRI)
              </p>
              <p className="text-2xl font-black text-purple-700 mt-1">
                {totalDuyTri.toFixed(1)}{" "}
                <span className="text-sm font-bold">Tr.đ</span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10">
              <Layers className="size-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Tìm dự án, khách hàng, AM..."
            className="pl-9 h-9 rounded-xl border-gray-200 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterNhom} onValueChange={(v) => v && setFilterNhom(v)}>
          <SelectTrigger className="w-52 h-9 rounded-xl border-gray-200 bg-white">
            <SelectValue placeholder="Nhóm SP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả nhóm SP</SelectItem>
            {nhomOptions.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-400 font-medium">
          {filtered.length} / {data.projects.length} dự án
        </span>
      </div>

      {/* Main Table */}
      <Card className="border-none shadow-2xl shadow-gray-200/30 overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl ring-1 ring-gray-100/50">
        <div className="overflow-x-auto">
          <Table className="min-w-[2200px]">
            <TableHeader className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="w-10 text-center font-black text-white/50 text-[10px] uppercase tracking-widest sticky left-0 z-10 bg-slate-800">
                  #
                </TableHead>
                <TableHead className="min-w-[200px] font-black text-white text-[10px] uppercase tracking-widest sticky left-10 z-10 bg-slate-800">
                  Dự án
                </TableHead>
                <TableHead className="min-w-[120px] font-black text-white/70 text-[10px] uppercase tracking-widest">
                  Khách hàng
                </TableHead>
                <TableHead className="min-w-[90px] font-black text-white/70 text-[10px] uppercase tracking-widest">
                  Nhóm SP
                </TableHead>
                <TableHead className="w-[80px] text-right font-black text-amber-300 text-[10px] uppercase tracking-widest">
                  Tổng HĐ
                </TableHead>
                <TableHead className="w-[70px] font-black text-white/50 text-[10px] uppercase tracking-widest text-center">
                  Trạng thái
                </TableHead>
                {MONTH_LABELS.map((label, i) => (
                  <TableHead
                    key={i}
                    className={`w-[100px] text-center font-black text-[10px] uppercase tracking-widest ${
                      i % 3 === 0
                        ? "text-cyan-300 border-l border-white/10"
                        : "text-white/70"
                    }`}
                  >
                    {label}
                  </TableHead>
                ))}
                <TableHead className="w-[100px] text-right font-black text-emerald-300 text-[10px] uppercase tracking-widest border-l border-white/10">
                  Tổng ghi nhận
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={19}
                    className="text-center py-20 text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <DollarSign className="size-12 opacity-20" />
                      <p className="font-bold text-lg">Chưa có dữ liệu phân bổ</p>
                      <p className="text-sm">
                        Nhấn <b>"Rebuild All"</b> để tạo bảng phân bổ từ các dự
                        án hiện có.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, idx) => {
                  const rowTotal = Object.values(p.months).reduce(
                    (s, d) => s + d.doanhThu,
                    0
                  );
                  return (
                    <TableRow
                      key={p.id}
                      className="group hover:bg-blue-50/40 transition-colors border-b border-gray-50"
                    >
                      <TableCell className="text-center text-xs font-bold text-gray-300 group-hover:text-gray-500 sticky left-0 bg-white group-hover:bg-blue-50/40 z-10">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="sticky left-10 bg-white group-hover:bg-blue-50/40 z-10">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 text-sm leading-tight truncate max-w-[200px]">
                            {p.tenDuAn}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                            {formatDate(p.ngayBatDau)} →{" "}
                            {formatDate(p.ngayKetThuc)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 truncate max-w-[120px]">
                        {p.khachHang}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold text-gray-500 border-gray-200 whitespace-nowrap"
                        >
                          {p.nhomSP}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-amber-600 text-sm">
                        {p.tongDoanhThuDuKien.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`text-[9px] font-bold px-1.5 py-0 whitespace-nowrap ${
                            p.trangThai === "DA_KY_HOP_DONG"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : p.trangThai === "THAT_BAI"
                                ? "bg-red-100 text-red-600 border-red-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {STATUS_LABELS[p.trangThai] || p.trangThai}
                        </Badge>
                      </TableCell>
                      {/* Month cells */}
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const d = p.months[m];
                        return (
                          <TableCell
                            key={m}
                            className={`text-center p-1.5 ${m % 3 === 1 ? "border-l border-gray-100" : ""}`}
                          >
                            {d ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-sm font-black text-gray-800">
                                  {d.doanhThu.toFixed(1)}
                                </span>
                                <Badge
                                  className={`text-[8px] font-bold px-1 py-0 leading-tight ${
                                    d.loai === "KY_MOI"
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : "bg-gray-100 text-gray-500 border-gray-200"
                                  }`}
                                >
                                  {d.loai === "KY_MOI" ? "Ký mới" : "Duy trì"}
                                </Badge>
                                <span className="text-[9px] text-gray-400">
                                  {d.soNgay}d
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-200">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-black text-emerald-600 text-sm border-l border-gray-100">
                        {rowTotal.toFixed(1)}
                        {Math.abs(rowTotal - p.tongDoanhThuDuKien) > 0.1 && (
                          <span className="block text-[9px] text-amber-500 font-medium">
                            ≠ {p.tongDoanhThuDuKien.toFixed(1)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}

              {/* Column Totals Footer */}
              {filtered.length > 0 && (
                <>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-t-2 border-slate-200 hover:bg-transparent">
                    <TableCell
                      colSpan={6}
                      className="font-black text-right text-slate-600 text-xs uppercase tracking-widest sticky left-0 bg-gradient-to-r from-slate-50 to-blue-50/50 z-10"
                    >
                      Tổng tháng (Tr.đ)
                    </TableCell>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <TableCell
                        key={m}
                        className={`text-center p-2 ${m % 3 === 1 ? "border-l border-gray-200" : ""}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-sm font-black text-slate-800">
                            {filteredTotals.totals[m].toFixed(1)}
                          </span>
                          {filteredTotals.kyMoi[m] > 0 && (
                            <span className="text-[9px] font-bold text-emerald-600">
                              KM: {filteredTotals.kyMoi[m].toFixed(1)}
                            </span>
                          )}
                          {filteredTotals.duyTri[m] > 0 && (
                            <span className="text-[9px] font-bold text-gray-400">
                              DT: {filteredTotals.duyTri[m].toFixed(1)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-black text-slate-900 text-base border-l border-gray-200">
                      {grandTotal.toFixed(1)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
