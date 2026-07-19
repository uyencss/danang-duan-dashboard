"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { importSourceExcel } from "./source-data-actions";
import Papa from "papaparse";

interface ExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  sourceType: "PIPELINE" | "CLOUD_DISTRIBUTE" | "ECONTRACT_INVOICE";
  sourceLabel: string;
}

export function ExcelImportDialog({
  open,
  onClose,
  sourceType,
  sourceLabel,
}: ExcelImportDialogProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>("");
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // ── File Selection ──────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setImportResult(null);

    // Parse CSV (or we could use xlsx library for .xlsx)
    if (selectedFile.name.endsWith(".csv")) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as any[];
          validateAndSetRows(rows);
        },
        error: () => {
          setErrors(["Không thể đọc file CSV. Vui lòng kiểm tra định dạng."]);
        },
      });
    } else {
      // For xlsx files, we use the xlsx library dynamically
      import("xlsx").then((XLSX) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const wb = XLSX.read(evt.target?.result, { type: "binary" });
            const ws = wb.Sheets[wb.SheetNames[0]];

            // Auto-detect header row by scanning for known column names
            // (skip note/instruction rows at the top of the template)
            const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, {
              header: 1,   // Return array-of-arrays (no header mapping)
              defval: "",
            });

            let headerRowIndex = 0;
            const KNOWN_HEADERS = [
              "Tên dự án", "Khách hàng", "Sản phẩm", "Nhóm"
            ];

            for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
              const row = rawRows[i] as any[];
              if (!row) continue;
              
              // Skip note rows which typically only have 1 merged string cell
              const filledCells = row.filter(c => String(c ?? "").trim() !== "");
              if (filledCells.length < 5) continue;

              const cellValues = row.map((c: any) =>
                String(c ?? "").trim().toLowerCase()
              );

              // Header row must contain the project name header
              const hasProjectName = cellValues.some(v => v.includes("tên dự án") || v.includes("ten du an"));
              if (!hasProjectName) continue;

              const matchCount = KNOWN_HEADERS.filter((h) =>
                cellValues.some((v: string) => v.includes(h.toLowerCase()))
              ).length;
              if (matchCount >= 2) {
                headerRowIndex = i;
                break;
              }
            }

            // Re-parse with the correct header row as range start
            const rows = XLSX.utils.sheet_to_json(ws, {
              defval: "",
              range: headerRowIndex, // Skip rows before the header
            });

            validateAndSetRows(rows as any[]);
          } catch {
            setErrors(["Không thể đọc file Excel. Vui lòng kiểm tra định dạng."]);
          }
        };
        reader.readAsBinaryString(selectedFile);
      });
    }
  };

  // ── Validate rows ───────────────────────────────────────────────
  const validateAndSetRows = (rows: any[]) => {
    const validationErrors: string[] = [];

    // Map header names to internal field names
    const mappedRows = rows.map((rawRow, idx) => {
      const row: any = {};
      Object.keys(rawRow).forEach((k) => {
        const normalizedKey = k.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        row[normalizedKey] = rawRow[k];
      });

      const mapped: any = {};

      // Try various header name patterns
      mapped.tenDuAn =
        row["Tên dự án*"] || row["Tên dự án"] || row["tenDuAn"] || row["Ten du an"] || "";
      mapped.isTrongDiem =
        row["Trọng điểm"] || row["isTrongDiem"] || "Không";
      mapped.isKyVong =
        row["Kỳ vọng"] || row["isKyVong"] || "Không";
      mapped.khachHangName =
        row["Khách hàng*"] ||
        row["Tên khách hàng*"] ||
        row["Tên khách hàng"] ||
        row["Khách hàng"] ||
        row["khachHangName"] ||
        "";
      mapped.phanLoaiKH =
        row["Phân loại khách hàng*"] ||
        row["Phân loại khách hàng"] ||
        row["Phân loại KH"] ||
        row["phanLoaiKH"] ||
        row["Phân loại"] ||
        "";
      mapped.diaChi =
        row["Địa chỉ"] || row["diaChi"] || "";
      mapped.tenSanPham =
        row["Tên sản phẩm chi tiết*"] ||
        row["Tên sản phẩm chi tiết"] ||
        row["Tên sản phẩm"] ||
        row["tenSanPham"] ||
        row["Sản phẩm"] ||
        row["Tên SP"] ||
        "";
      mapped.nhomSanPham =
        row["Nhóm sản phẩm*"] ||
        row["Nhóm sản phẩm"] ||
        row["nhomSanPham"] ||
        row["Nhóm SP"] ||
        "";
      const getFieldVal = (fieldKeys: string[]) => {
        for (const k of fieldKeys) {
          const val = row[k];
          if (val !== undefined && val !== null && val !== "") {
            return val;
          }
        }
        return "";
      };

      mapped.moTaSanPham =
        row["Mô tả sản phẩm"] || row["moTaSanPham"] || "";
      mapped.tongDoanhThu = getFieldVal([
        "Tổng doanh thu*",
        "Tổng doanh thu",
        "DT tổng dự án",
        "tongDoanhThu",
        "Tổng DT",
      ]);
      mapped.dtTheoThang = getFieldVal([
        "DT theo tháng",
        "DT dự kiến tháng",
        "dtTheoThang",
        "DT tháng",
        "DT theo tháng*",
      ]);
      mapped.soKy1GoiCuoc = getFieldVal([
        "Số kỳ 1 gói cước (tháng)",
        "Số kỳ 1 gói cước",
        "soKy1GoiCuoc",
        "Số kỳ",
      ]);
      mapped.maHopDong =
        row["Mã hợp đồng"] || row["maHopDong"] || row["Mã HĐ"] || "";
      mapped.ngayBatDau =
        row["Ngày bắt đầu* (DD/MM/YYYY)"] ||
        row["Ngày bắt đầu*"] ||
        row["Ngày bắt đầu"] ||
        row["ngayBatDau"] ||
        row["Ngay bat dau"] ||
        "";
      mapped.ngayKetThuc =
        row["Ngày kết thúc (DD/MM/YYYY)"] ||
        row["Ngày kết thúc"] ||
        row["ngayKetThuc"] ||
        row["Ngay ket thuc"] ||
        "";
      mapped.chuyenVienId =
        row["Chuyên viên chủ trì"] ||
        row["Chuyên viên"] ||
        row["CV ID"] ||
        row["chuyenVienId"] ||
        "";
      mapped.cvHoTro1Id =
        row["Chuyên viên hỗ trợ 1"] ||
        row["cvHoTro1Id"] ||
        "";
      mapped.cvHoTro2Id =
        row["Chuyên viên hỗ trợ 2"] ||
        row["cvHoTro2Id"] ||
        "";
      mapped.amId =
        row["AM phụ trách"] ||
        row["AM ID"] ||
        row["amId"] ||
        "";
      mapped.amHoTro1Id =
        row["AM hỗ trợ 1"] ||
        row["amHoTro1Id"] ||
        "";
      mapped.trangThaiKhoiTao =
        row["Trạng thái khởi tạo*"] ||
        row["Trạng thái khởi tạo"] ||
        row["Trạng thái"] ||
        row["trangThaiKhoiTao"] ||
        "";

      mapped.thangGhiNhan =
        row["Tháng ghi nhận*"] ||
        row["Tháng ghi nhận"] ||
        row["thangGhiNhan"] ||
        "";

      // ── Mandatory Field Validations ─────────────────────────────────
      // 1. Tên dự án*
      if (!mapped.tenDuAn?.toString().trim()) {
        validationErrors.push(`Dòng ${idx + 2}: Thiếu Tên dự án`);
      }

      // 2. Khách hàng*
      if (!mapped.khachHangName?.toString().trim()) {
        validationErrors.push(`Dòng ${idx + 2}: Thiếu Tên khách hàng`);
      }

      // 3. Phân loại khách hàng*
      const plKhTrimmed = mapped.phanLoaiKH?.toString().trim();
      if (!plKhTrimmed) {
        validationErrors.push(`Dòng ${idx + 2}: Thiếu Phân loại khách hàng`);
      } else {
        const allowedPL = ["Chính phủ/Sở ban ngành", "Doanh nghiệp", "Công an"];
        if (!allowedPL.includes(plKhTrimmed)) {
          validationErrors.push(
            `Dòng ${idx + 2}: Phân loại khách hàng không hợp lệ (phải chọn Chính phủ/Sở ban ngành, Doanh nghiệp, hoặc Công an)`
          );
        }
      }

      // 4. Tên sản phẩm chi tiết*
      if (!mapped.tenSanPham?.toString().trim()) {
        validationErrors.push(`Dòng ${idx + 2}: Thiếu Tên sản phẩm chi tiết`);
      }

      // 5. Nhóm sản phẩm*
      if (!mapped.nhomSanPham?.toString().trim()) {
        validationErrors.push(`Dòng ${idx + 2}: Thiếu Nhóm sản phẩm`);
      }

      // 6. Tổng doanh thu*
      if (mapped.tongDoanhThu === undefined || mapped.tongDoanhThu === null || mapped.tongDoanhThu === "") {
        validationErrors.push(`Dòng ${idx + 2}: Thiếu Tổng doanh thu`);
      }

      // 7. Ngày bắt đầu* (DD/MM/YYYY)
      if (!mapped.ngayBatDau?.toString().trim()) {
        validationErrors.push(`Dòng ${idx + 2}: Thiếu Ngày bắt đầu`);
      }

      // 8. Trạng thái khởi tạo*
      const statusTrimmed = mapped.trangThaiKhoiTao?.toString().trim();
      if (!statusTrimmed) {
        validationErrors.push(`Dòng ${idx + 2}: Thiếu Trạng thái khởi tạo`);
      } else {
        const allowedStatuses = ["Mới", "Đang làm việc", "Đã demo", "Đã gửi báo giá", "Đã ký hợp đồng", "Thất bại"];
        if (!allowedStatuses.includes(statusTrimmed)) {
          validationErrors.push(
            `Dòng ${idx + 2}: Trạng thái khởi tạo không hợp lệ (phải chọn Mới, Đang làm việc, Đã demo, Đã gửi báo giá, Đã ký hợp đồng, hoặc Thất bại)`
          );
        }
      }

      // Check "Đã ký hợp đồng" block — only for Pipeline (Bảng 1)
      if (
        sourceType === "PIPELINE" &&
        statusTrimmed === "Đã ký hợp đồng"
      ) {
        validationErrors.push(
          `Dòng ${idx + 2}: Đối với những dự án 'Đã ký hợp đồng' vui lòng quản trị viên để cập nhật.`
        );
      }

      // Check "Tháng ghi nhận" — only for EContract (Bảng 3)
      if (sourceType === "ECONTRACT_INVOICE") {
        const tgTrimmed = mapped.thangGhiNhan?.toString().trim();
        if (!tgTrimmed) {
          validationErrors.push(`Dòng ${idx + 2}: Thiếu Tháng ghi nhận`);
        } else {
          const match = tgTrimmed.match(/^Tháng\s*(\d+)$/i);
          if (!match) {
            validationErrors.push(
              `Dòng ${idx + 2}: Định dạng Tháng ghi nhận không hợp lệ (phải nhập: Tháng 1, Tháng 2, ...)`
            );
          } else {
            const mNum = parseInt(match[1]);
            if (mNum < 1 || mNum > 12) {
              validationErrors.push(
                `Dòng ${idx + 2}: Tháng ghi nhận phải từ Tháng 1 đến Tháng 12`
              );
            }
          }
        }
      }

      return mapped;
    });

    setErrors(validationErrors);
    setParsedRows(mappedRows);
  };

  // ── Import (chunked to avoid payload size / timeout issues) ─────
  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    setImportProgress("");

    const CHUNK_SIZE = 500; // Send 500 rows per request
    const totalChunks = Math.ceil(parsedRows.length / CHUNK_SIZE);
    let totalImported = 0;
    let lastError = "";

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunk = parsedRows.slice(
          i * CHUNK_SIZE,
          (i + 1) * CHUNK_SIZE
        );

        setImportProgress(
          `Đang xử lý batch ${i + 1}/${totalChunks} (${Math.min((i + 1) * CHUNK_SIZE, parsedRows.length)}/${parsedRows.length} dòng)...`
        );

        const res = await importSourceExcel(chunk, sourceType);
        if (res.success) {
          totalImported += res.count || 0;
        } else {
          lastError = res.error || "Lỗi không xác định";
          // Continue with other chunks even if one fails
        }
      }

      if (totalImported > 0) {
        setImportResult({
          success: true,
          message: `Đã import thành công ${totalImported} dự án vào ${sourceLabel}${lastError ? ` (${lastError})` : ""}.`,
        });
        toast.success(`Import thành công ${totalImported} dự án`);
        router.refresh();
      } else {
        setImportResult({
          success: false,
          message: lastError || "Không import được dòng nào",
        });
        toast.error(lastError || "Import thất bại");
      }
    } catch (e: any) {
      setImportResult({
        success: false,
        message: e.message || "Lỗi không xác định",
      });
      toast.error("Lỗi khi import dữ liệu");
    } finally {
      setIsImporting(false);
      setImportProgress("");
    }
  };

  // ── Reset ──────────────────────────────────────────────────────
  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setErrors([]);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const hasBlockingErrors = errors.some((e) =>
    e.includes("Đã ký hợp đồng")
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-emerald-600" />
            Import Excel — {sourceLabel}
          </DialogTitle>
          <DialogDescription>
            Chọn file Excel (.xlsx, .csv) để import dữ liệu vào{" "}
            {sourceLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Input */}
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="size-8 text-emerald-500" />
                <div className="text-left">
                  <p className="font-bold text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB •{" "}
                    {parsedRows.length} dòng
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="size-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-500">
                  Nhấp để chọn file hoặc kéo thả vào đây
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Hỗ trợ: .xlsx, .xls, .csv
                </p>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="size-4 text-red-500" />
                <span className="text-sm font-bold text-red-700">
                  {errors.length} lỗi validation
                </span>
              </div>
              <ul className="space-y-1">
                {errors.slice(0, 10).map((err, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <XCircle className="size-3 mt-0.5 shrink-0" />
                    {err}
                  </li>
                ))}
                {errors.length > 10 && (
                  <li className="text-xs text-red-500 font-medium">
                    ... và {errors.length - 10} lỗi khác
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && importProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 text-blue-600 animate-spin" />
                <div>
                  <span className="text-sm font-bold text-blue-700">
                    Đang import...
                  </span>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {importProgress}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div
              className={`rounded-xl p-4 border ${
                importResult.success
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                  <XCircle className="size-5 text-red-600" />
                )}
                <span
                  className={`text-sm font-bold ${
                    importResult.success
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {importResult.message}
                </span>
              </div>
            </div>
          )}

          {/* Note about template */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-[11px] text-amber-700 font-medium">
              * LƯU Ý KHI ĐIỀN DỮ LIỆU: Phân loại khách hàng: Chọn 1
              trong số: [Chính phủ/Sở ban ngành, Doanh nghiệp, Công an].
              Tất cả ngày tháng sử dụng định dạng DD/MM/YYYY.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="rounded-xl">
            Đóng
          </Button>
          {importResult?.success ? (
            <Button
              onClick={handleClose}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="size-4 mr-1.5" />
              Hoàn tất
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={
                parsedRows.length === 0 ||
                hasBlockingErrors ||
                isImporting
              }
              className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isImporting ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Đang import...
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-1.5" />
                  Import {parsedRows.length} dòng
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
