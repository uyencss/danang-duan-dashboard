"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Download,
  Upload,
  RefreshCw,
  Undo2,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SourceTable } from "./source-table";
import { ExcelImportDialog } from "./excel-import-dialog";
import {
  rebuildMasterData,
  recallSourceBatch,
  type SourceDataRow,
} from "./source-data-actions";
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

// ── Tab Configuration ──────────────────────────────────────────────
const TABS = [
  {
    id: "pipeline" as const,
    label: "Bảng 1",
    subtitle: "Pipeline",
    sourceType: "PIPELINE" as const,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    description: "Dự án đang theo đuổi (chưa ký hợp đồng)",
  },
  {
    id: "cloud" as const,
    label: "Bảng 2",
    subtitle: "Cloud-Distribute",
    sourceType: "CLOUD_DISTRIBUTE" as const,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    description: "Doanh thu Cloud/Distribute phân bổ cố định theo tháng",
  },
  {
    id: "econtract" as const,
    label: "Bảng 3",
    subtitle: "EContract-Invoice",
    sourceType: "ECONTRACT_INVOICE" as const,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    description: "Dữ liệu hóa đơn/hợp đồng điện tử đã ghi nhận",
  },
  {
    id: "master" as const,
    label: "Bảng 4",
    subtitle: "Tổng hợp",
    sourceType: null,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    description: "Tổng hợp doanh thu từ cả 3 nguồn (read-only)",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SourceDataClientProps {
  initialYear: number;
  pipelineData: SourceDataRow[];
  cloudData: SourceDataRow[];
  econtractData: SourceDataRow[];
  masterData: SourceDataRow[];
}

export function SourceDataClient({
  initialYear,
  pipelineData,
  cloudData,
  econtractData,
  masterData,
}: SourceDataClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("pipeline");
  const [year, setYear] = useState(initialYear);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [confirmRecall, setConfirmRecall] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  // Get data for active tab
  const getActiveData = (): SourceDataRow[] => {
    switch (activeTab) {
      case "pipeline":
        return pipelineData;
      case "cloud":
        return cloudData;
      case "econtract":
        return econtractData;
      case "master":
        return masterData;
    }
  };

  // Change year filter
  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    startTransition(() => {
      router.push(`/du-an/du-lieu-nguon?year=${newYear}`);
      router.refresh();
    });
  };

  // Rebuild Bảng 4
  const handleRebuild = async () => {
    setIsRebuilding(true);
    try {
      const res = await rebuildMasterData();
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Lỗi khi rebuild dữ liệu tổng hợp");
    } finally {
      setIsRebuilding(false);
    }
  };

  // Recall last batch
  const handleRecall = async (sourceType: string) => {
    try {
      const res = await recallSourceBatch(sourceType as any);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Lỗi khi thu hồi batch");
    }
    setConfirmRecall(null);
  };

  // Download Excel template
  const handleDownloadTemplate = async (sourceType: string) => {
    const XLSX = await import("xlsx");

    const notes = [
      ["* LƯU Ý KHI ĐIỀN DỮ LIỆU:"],
      ["- Phân loại khách hàng: Chọn 1 trong số: [Chính phủ/Sở ban ngành, Doanh nghiệp, Công an]"],
      ["- Nhóm sản phẩm: Chọn 1 trong số: [Cloud DC, An ninh mạng, Giải pháp CNTT, Dự án CĐS KHCP, KHDN lớn, CNS trong lĩnh vực an ninh]"],
      ["- Trạng thái khởi tạo: Chọn 1 trong số: [Mới, Đang làm việc, Đã demo, Đã gửi báo giá, Đã ký hợp đồng, Thất bại]"],
      ["- Trọng điểm / Kỳ vọng: Điền [Có] hoặc [Không]"],
      ["- Nhân sự (Chuyên viên/AM): Điền ĐÚNG tên (hệ thống sẽ map theo tên)"],
      ["- Tháng ghi nhận: Nhập: Tháng 1 hoặc Tháng 2, hoặc Tháng 3,... (chỉ áp dụng cho Bảng 3)"]
    ];

    let headers: string[] = [];
    let sampleRow: any[] = [];
    let filename = "";

    const baseHeaders = [
      "Tên dự án*",
      "Trọng điểm",
      "Kỳ vọng",
      "Khách hàng*",
      "Phân loại khách hàng*",
      "Địa chỉ",
      "Tên sản phẩm chi tiết*",
      "Nhóm sản phẩm*",
      "Mô tả sản phẩm",
      "Tổng doanh thu*",
      "DT theo tháng",
      "Số kỳ 1 gói cước (tháng)",
      "Mã hợp đồng",
      "Ngày bắt đầu* (DD/MM/YYYY)",
      "Ngày kết thúc (DD/MM/YYYY)",
      "Chuyên viên chủ trì",
      "Chuyên viên hỗ trợ 1",
      "Chuyên viên hỗ trợ 2",
      "AM phụ trách",
      "AM hỗ trợ 1",
      "Trạng thái khởi tạo*",
    ];

    const baseSample = [
      "Dự án Viễn thông",
      "Không",
      "Có",
      "Công ty TNHH A",
      "Doanh nghiệp",
      "Đà Nẵng",
      "Gói Camera an ninh",
      "Camera",
      "Camera giám sát độ phân giải cao",
      "150500000",
      "10000000",
      "12",
      "HD-123456",
      "20/10/2026",
      "20/10/2027",
      "Nguyễn Văn A",
      "Trần Thị B",
      "",
      "Lê Văn C",
      "",
      "Mới",
    ];

    switch (sourceType) {
      case "PIPELINE":
        headers = [...baseHeaders];
        sampleRow = [...baseSample];
        filename = "Mau_Bang1_Pipeline";
        break;

      case "CLOUD_DISTRIBUTE":
        headers = [...baseHeaders];
        sampleRow = [...baseSample];
        filename = "Mau_Bang2_Cloud_Distribute";
        break;

      case "ECONTRACT_INVOICE":
        headers = [...baseHeaders, "Tháng ghi nhận*"];
        sampleRow = [...baseSample, "Tháng 1"];
        filename = "Mau_Bang3_EContract_Invoice";
        break;

      default:
        return;
    }

    // Build worksheet data: notes rows + headers row + sampleRow
    const wsData = [...notes, headers, sampleRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = headers.map((h) => ({
      wch: Math.max(h.length + 4, 15),
    }));

    // Merge each note row across all header columns
    ws["!merges"] = notes.map((_, i) => ({
      s: { r: i, c: 0 },
      e: { r: i, c: headers.length - 1 }
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mẫu");
    XLSX.writeFile(wb, `${filename}.xlsx`);

    toast.success(`Đã tải mẫu Excel cho ${getTabLabel(sourceType)}`);
  };

  // Export Data to Excel
  const handleExportData = async () => {
    const XLSX = await import("xlsx");
    
    // Formatting data for Excel
    const dataToExport = activeData.map((row, index) => ({
      "STT": index + 1,
      "Tên dự án": row.tenDuAn,
      "Khách hàng": row.khachHang,
      "Phân loại KH": row.phanLoaiKH,
      "Sản phẩm chi tiết": row.tenSP,
      "Nhóm sản phẩm": row.nhomSP,
      "Tổng doanh thu": row.tongDoanhThu,
      "DT theo tháng": row.doanhThuTheoThang || "",
      "Trạng thái": row.trangThai,
      "Mã hợp đồng": row.maHopDong || "",
      "Ngày bắt đầu": row.ngayBatDau ? new Date(row.ngayBatDau).toLocaleDateString('vi-VN') : "",
      "Ngày kết thúc": row.ngayKetThuc ? new Date(row.ngayKetThuc).toLocaleDateString('vi-VN') : "",
      "Chuyên viên": row.cvName || "",
      "AM": row.amName || "",
      "Năm": year,
      "T1": row.months.month1 || 0,
      "T2": row.months.month2 || 0,
      "T3": row.months.month3 || 0,
      "T4": row.months.month4 || 0,
      "T5": row.months.month5 || 0,
      "T6": row.months.month6 || 0,
      "T7": row.months.month7 || 0,
      "T8": row.months.month8 || 0,
      "T9": row.months.month9 || 0,
      "T10": row.months.month10 || 0,
      "T11": row.months.month11 || 0,
      "T12": row.months.month12 || 0,
      "Tổng Năm": row.totalNam || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Auto adjust column width (basic approach)
    const colWidths = [
      { wch: 5 }, // STT
      { wch: 40 }, // Tên dự án
      { wch: 30 }, // Khách hàng
      { wch: 20 }, // Phân loại khách hàng
      { wch: 30 }, // Sản phẩm
      { wch: 20 }, // Nhóm sản phẩm
      { wch: 15 }, // Tổng doanh thu
      { wch: 15 }, // DT theo tháng
      { wch: 15 }, // Trạng thái
      { wch: 15 }, // Mã hợp đồng
      { wch: 15 }, // Ngày bắt đầu
      { wch: 15 }, // Ngày kết thúc
      { wch: 20 }, // Chuyên viên
      { wch: 20 }, // AM
      { wch: 10 }, // Năm
      ...Array(12).fill({ wch: 10 }), // T1-T12
      { wch: 15 } // Tổng Năm
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentTab.label);
    
    const filename = `DuLieu_${currentTab.subtitle}_Nam${year}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    toast.success(`Đã xuất dữ liệu ${currentTab.label} thành công`);
  };

  const getTabLabel = (sourceType: string) => {
    switch (sourceType) {
      case "PIPELINE": return "Bảng 1 (Pipeline)";
      case "CLOUD_DISTRIBUTE": return "Bảng 2 (Cloud-Distribute)";
      case "ECONTRACT_INVOICE": return "Bảng 3 (EContract-Invoice)";
      default: return sourceType;
    }
  };

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const activeData = getActiveData();
  const totalRevenue = activeData.reduce((sum, row) => sum + row.totalNam, 0);

  return (
    <div className="space-y-5">
      {/* ── Top Bar: Year Filter + Actions ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Year Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-blue-500 pointer-events-none z-10" />
          <select
            value={year}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="appearance-none h-10 pl-10 pr-8 rounded-xl border border-slate-200 bg-white font-semibold text-sm text-slate-800 hover:border-blue-300 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer transition-colors"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Import Excel (not for Bảng 4) */}
        {currentTab.sourceType && (
          <>
            <Button
              variant="outline"
              className="gap-2 h-10 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => setIsImportOpen(true)}
            >
              <Upload className="size-4" />
              Import Excel
            </Button>

            <Button
              variant="outline"
              className="gap-2 h-10 rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={() => setConfirmRecall(currentTab.sourceType)}
            >
              <Undo2 className="size-4" />
              Thu hồi batch
            </Button>
          </>
        )}

        {/* Download Template (not for Bảng 4) */}
        {currentTab.sourceType && (
          <Button
            variant="outline"
            className="gap-2 h-10 rounded-xl border-slate-200 hover:bg-slate-50"
            onClick={() => handleDownloadTemplate(currentTab.sourceType!)}
          >
            <Download className="size-4" />
            Mẫu Excel
          </Button>
        )}

        {/* Export Excel (for all tables) */}
        <Button
          variant="outline"
          className="gap-2 h-10 rounded-xl border-green-200 text-green-700 hover:bg-green-50"
          onClick={handleExportData}
        >
          <FileSpreadsheet className="size-4" />
          Xuất Excel
        </Button>

        {/* Rebuild Bảng 4 (only for Master tab or always visible) */}
        <Button
          variant="outline"
          className="gap-2 h-10 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 ml-auto"
          onClick={handleRebuild}
          disabled={isRebuilding}
        >
          <RefreshCw
            className={`size-4 ${isRebuilding ? "animate-spin" : ""}`}
          />
          Rebuild Bảng 4
        </Button>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────── */}
      <div className="flex gap-1.5 bg-slate-100/80 p-1.5 rounded-xl w-fit">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === "pipeline"
              ? pipelineData.length
              : tab.id === "cloud"
                ? cloudData.length
                : tab.id === "econtract"
                  ? econtractData.length
                  : masterData.length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                isActive
                  ? `bg-white shadow-sm text-slate-900 scale-[1.02]`
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isActive ? `${tab.bgColor} ${tab.textColor}` : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </div>
              <span className="text-[10px] font-medium opacity-60 block -mt-0.5">
                {tab.subtitle}
              </span>
              {isActive && (
                <div
                  className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r ${tab.color}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Description ─────────────────────────────────────────── */}
      <div
        className={`${currentTab.bgColor} px-4 py-2.5 rounded-xl border border-slate-100`}
      >
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${currentTab.textColor}`}>
            <FileSpreadsheet className="size-4 inline-block mr-1.5 -mt-0.5" />
            {currentTab.description}
          </p>
          <p className="text-xs font-bold text-slate-500">
            Tổng doanh thu:{" "}
            <span className={currentTab.textColor}>
              {(totalRevenue / 1_000_000).toLocaleString("vi-VN", {
                maximumFractionDigits: 1,
              })}{" "}
              triệu
            </span>
          </p>
        </div>
      </div>

      {/* ── DataTable ───────────────────────────────────────────────── */}
      <SourceTable
        data={activeData}
        year={year}
        sourceType={activeTab}
        isReadOnly={activeTab === "master"}
      />

      {/* ── Import Dialog ──────────────────────────────────────────── */}
      {currentTab.sourceType && (
        <ExcelImportDialog
          open={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          sourceType={currentTab.sourceType}
          sourceLabel={`${currentTab.label} (${currentTab.subtitle})`}
        />
      )}

      {/* ── Confirm Recall Dialog ──────────────────────────────────── */}
      <AlertDialog
        open={!!confirmRecall}
        onOpenChange={() => setConfirmRecall(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thu hồi batch gần nhất?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này sẽ xóa toàn bộ dự án đã import trong batch gần nhất
              của {currentTab.label}. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRecall && handleRecall(confirmRecall)}
              className="bg-red-500 hover:bg-red-600"
            >
              Xác nhận thu hồi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
