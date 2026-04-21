"use client";

import { useState, useRef, useTransition } from "react";
import * as XLSX from "xlsx";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileUp, FileDown, Undo2, Loader2, AlertCircle } from "lucide-react";
import { importExcelProjects, recallExcelProjects } from "./excel-actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define option constants for validation
const TIEU_CHI_YES_NO = ["Có", "Không"];
const PHAN_LOAI_KH = ["Chính phủ/Sở ban ngành", "Doanh nghiệp", "Công an"];
const NHOM_SP = ["Dự án", "Hóa đơn điện tử", "Chữ ký số", "IOC", "Camera AI", "Cloud", "Khác"];
const TRANG_THAI = ["Mới", "Đang làm việc", "Đã demo", "Đã gửi báo giá", "Đã ký hợp đồng", "Thất bại"];

interface UserOption {
  id: string;
  name: string;
  role: string | null;
}

export function ExcelUploadButton({ users }: { users: UserOption[] }) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDownloadSample = () => {
    const wsData = [
      [
        "Tên dự án*", "Trọng điểm", "Kỳ vọng", 
        "Khách hàng*", "Phân loại khách hàng*", "Địa chỉ",
        "Tên sản phẩm chi tiết*", "Nhóm sản phẩm*", "Mô tả sản phẩm",
        "Tổng doanh thu*", "DT theo tháng", "Mã hợp đồng", "Ngày bắt đầu* (DD/MM/YYYY)", "Ngày kết thúc (DD/MM/YYYY)",
        "Chuyên viên chủ trì", "Chuyên viên hỗ trợ 1", "Chuyên viên hỗ trợ 2", "AM phụ trách", "AM hỗ trợ 1",
        "Trạng thái khởi tạo*"
      ],
      [
        "Dự án Viễn thông mẫu", "Có", "Không",
        "Công ty TNHH ABCD", "Doanh nghiệp", "Đà Nẵng",
        "Gói Camera An ninh", "Camera AI", "Camera độ phân giải cao",
        "150.5", "10", "HD-123456", "20/10/2023", "",
        "Nguyễn Văn A", "", "", "Trần Thị B", "",
        "Mới"
      ]
    ];
    
    // Notes
    wsData.push([]);
    wsData.push(["* LƯU Ý KHI ĐIỀN DỮ LIỆU:"]);
    wsData.push(["- Phân loại khách hàng: Chọn 1 trong số: [Chính phủ/Sở ban ngành, Doanh nghiệp, Công an]"]);
    wsData.push(["- Nhóm sản phẩm: Chọn 1 trong số: [Dự án, Hóa đơn điện tử, Chữ ký số, IOC, Camera AI, Cloud, Khác]"]);
    wsData.push(["- Trạng thái khởi tạo: Chọn 1 trong số: [Mới, Đang làm việc, Đã demo, Đã gửi báo giá, Đã ký hợp đồng, Thất bại]"]);
    wsData.push(["- Trọng điểm / Kỳ vọng: Điền [Có] hoặc [Không]"]);
    wsData.push(["- Nhân sự (Chuyên viên/AM): Điền ĐÚNG tên (hệ thống sẽ map theo tên)"]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ban_Mau");
    XLSX.writeFile(wb, "Mau_Upload_DuAn.xlsx");
  };

  const validateAndParse = (data: any[]) => {
    const errors: string[] = [];
    const validRows: any[] = [];

    // Filter valid roles cache
    const cvUsers = users.filter(u => u.role === "CV" || u.role === "USER" || u.role === "ADMIN");
    const amUsers = users.filter(u => u.role === "AM" || u.role === "ADMIN");

    data.forEach((row, index) => {
      // Find keys using flexible matching
      const keys = Object.keys(row);
      const findVal = (keywords: string[]) => {
        const key = keys.find(k => {
          const lowerK = k.toLowerCase().trim();
          return keywords.some(kw => lowerK.includes(kw.toLowerCase().trim()));
        });
        return key ? row[key] : undefined;
      };

      const tenDuAn = findVal(["Tên dự án"]);
      // Bỏ qua dòng trống, header, và phần lưu ý
      if (!row || keys.length === 0) return;
      if (tenDuAn === "Tên dự án" || tenDuAn?.toString().includes("LƯU Ý")) return;
      if (!tenDuAn) return; 

      const rowErr: string[] = [];
      const rowNum = index + 1;

      // Extract values with flexible keys
      const khachHang = findVal(["Khách hàng"]);
      const phanLoaiKH = findVal(["Phân loại khách hàng", "Phân loại KH"]);
      const diaChi = findVal(["Địa chỉ"]);
      const tenSP = findVal(["Tên sản phẩm chi tiết", "Sản phẩm chi tiết"]);
      const nhomSP = findVal(["Nhóm sản phẩm", "Nhóm SP"]);
      const moTaSP = findVal(["Mô tả sản phẩm", "Mô tả SP"]);
      const tongDT = findVal(["Tổng doanh thu", "DT dự kiến"]);
      const dtThang = findVal(["DT theo tháng", "DT tháng", "Doanh thu tháng", "Thu theo tháng"]);
      const maHD = findVal(["Mã hợp đồng", "Số hợp đồng"]);
      const ngayBD = findVal(["Ngày bắt đầu"]);
      const ngayKT = findVal(["Ngày kết thúc"]);
      const cvTri = findVal(["Chuyên viên chủ trì", "Chuyên viên (chủ trì)"]);
      const cvHT1 = findVal(["Chuyên viên hỗ trợ 1", "CV hỗ trợ 1"]);
      const cvHT2 = findVal(["Chuyên viên hỗ trợ 2", "CV hỗ trợ 2"]);
      const amTri = findVal(["AM phụ trách", "AM (phụ trách)"]);
      const amHT1 = findVal(["AM hỗ trợ 1"]);
      const trangThaiKhoiTao = findVal(["Trạng thái khởi tạo", "Trạng thái"]);

      // Yêu cầu bắt buộc
      if (!khachHang) rowErr.push("Cột Khách hàng trống.");
      if (!phanLoaiKH) rowErr.push("Cột Phân loại KH trống.");
      if (!tenSP) rowErr.push("Cột Tên sản phẩm chi tiết trống.");
      if (!nhomSP) rowErr.push("Cột Nhóm sản phẩm trống.");
      if (!ngayBD) rowErr.push("Cột Ngày bắt đầu trống.");
      if (!trangThaiKhoiTao) rowErr.push("Cột Trạng thái trống.");

      // Kiểm tra giá trị Option
      const plKhTrim = phanLoaiKH?.toString().trim();
      if (plKhTrim && !PHAN_LOAI_KH.includes(plKhTrim)) rowErr.push(`Phân loại KH '${plKhTrim}' không hợp lệ.`);

      const nhomSpTrim = nhomSP?.toString().trim();
      if (nhomSpTrim && !NHOM_SP.includes(nhomSpTrim)) rowErr.push(`Nhóm SP '${nhomSpTrim}' không hợp lệ.`);

      const trangThaiTrim = trangThaiKhoiTao?.toString().trim();
      if (trangThaiTrim && !TRANG_THAI.includes(trangThaiTrim)) rowErr.push(`Trạng thái '${trangThaiTrim}' không hợp lệ.`);

      // Kiểm tra Yes/No cho Trọng điểm / Kỳ vọng
      const isTrongRaw = findVal(["Trọng điểm"])?.toString().trim();
      const isKyRaw = findVal(["Kỳ vọng"])?.toString().trim();

      // Kiểm tra Map User
      const findUserId = (nameVal: any, checkUsers: UserOption[], field: string) => {
        const name = nameVal?.toString().trim();
        if (!name) return null;
        const u = checkUsers.find(x => x.name.toLowerCase() === name.toLowerCase());
        if (!u) rowErr.push(`Không tìm thấy ${field} có tên là '${name}'.`);
        return u?.id || null;
      };

      const cvId = findUserId(cvTri, cvUsers, "Chuyên viên");
      const cvHoTro1Id = findUserId(cvHT1, cvUsers, "Chuyên viên (HT1)");
      const cvHoTro2Id = findUserId(cvHT2, cvUsers, "Chuyên viên (HT2)");
      const amId = findUserId(amTri, amUsers, "AM");
      const amHoTro1Id = findUserId(amHT1, amUsers, "AM (HT1)");

      if (rowErr.length > 0) {
        errors.push(`Dòng ${rowNum}: ${rowErr.join(" | ")}`);
      } else {
        validRows.push({
          tenDuAn: tenDuAn.toString(),
          isTrongDiem: isTrongRaw || "Không",
          isKyVong: isKyRaw || "Không",
          khachHangName: khachHang.toString(),
          phanLoaiKH: plKhTrim,
          diaChi: diaChi?.toString() || "",
          tenSanPham: tenSP.toString(),
          nhomSanPham: nhomSpTrim,
          moTaSanPham: moTaSP?.toString() || "",
          tongDoanhThu: tongDT?.toString() || "0",
          dtTheoThang: dtThang?.toString() || "0",
          maHopDong: maHD?.toString() || "",
          ngayBatDau: ngayBD?.toString(),
          ngayKetThuc: ngayKT?.toString(),
          cvId,
          cvHoTro1Id,
          cvHoTro2Id,
          amId,
          amHoTro1Id,
          trangThaiKhoiTao: trangThaiTrim
        });
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setParsedData([]);
      setIsConfirmOpen(true);
    } else if (validRows.length > 0) {
      setValidationErrors([]);
      setParsedData(validRows);
      setIsConfirmOpen(true);
    } else {
      toast.warning("File không có dữ liệu dự án hợp lệ.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (bstr) {
        // cellDates: true giúp tự động parse các ô format Date trong Excel thành JS Date
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        validateAndParse(data);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onConfirmImport = () => {
    if (parsedData.length === 0) return;
    
    startTransition(async () => {
       const res = await importExcelProjects(parsedData);
       if (res.error) {
         toast.error(res.error);
       } else {
         toast.success(res.message);
         setIsConfirmOpen(false);
         setParsedData([]);
       }
    });
  };

  const onRecall = (mode: 'latest' | 'today') => {
    const confirmMsg = mode === 'latest' 
      ? "Bạn có CHẮC CHẮN muốn thu hồi danh sách dự án vừa import gần nhất bằng Excel?"
      : "Bạn có CHẮC CHẮN muốn xóa TOÀN BỘ dự án đã tải bằng Excel trong ngày HÔM NAY?";

    if(confirm(confirmMsg)) {
      startTransition(async () => {
        const res = await recallExcelProjects(mode);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(res.message);
        }
      });
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          className="gap-2 font-medium"
          onClick={handleDownloadSample}
          disabled={isPending}
        >
          <FileDown className="size-4" />
          Mẫu Excel
        </Button>
        <Button 
          variant="outline" 
          className="gap-2 font-medium bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
          Tải Data Lên
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger 
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-2 font-medium bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
            )}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
            Thu hồi Excel
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Lựa chọn thu hồi</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRecall('latest')} className="cursor-pointer">
              Chỉ mẻ gần nhất
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRecall('today')} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
              Toàn bộ trong hôm nay
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={(open) => !isPending && setIsConfirmOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {validationErrors.length > 0 ? "Phát hiện lỗi dữ liệu Excel" : "Xác nhận tải danh sách Dự Án"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 py-4">
            {validationErrors.length > 0 ? (
              <div className="space-y-4">
                <div className="flex gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
                  <AlertCircle className="size-5 shrink-0" />
                  <span className="font-medium text-sm">
                    Có {validationErrors.length} lỗi cần phải sửa trước khi có thể Import:
                  </span>
                </div>
                <ul className="text-sm space-y-2 max-h-64 overflow-y-auto bg-gray-50 p-4 rounded-lg border">
                  {validationErrors.map((e, idx) => (
                    <li key={idx} className="text-red-600 list-disc ml-4">{e}</li>
                  ))}
                </ul>
                <p className="text-sm font-semibold text-gray-700">Hãy cập nhật lại file và Tải File Lên lại!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 text-green-800 p-4 rounded-lg space-y-2">
                  <p className="font-bold">Tuyệt vời! Dữ liệu thoả mãn yêu cầu hệ thống.</p>
                  <p className="text-sm">Hệ thống sẵn sàng import <b>{parsedData.length}</b> dự án mới.</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isPending}>
              Huỷ bỏ
            </Button>
            {validationErrors.length === 0 && (
              <Button onClick={onConfirmImport} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]">
                {isPending ? <Loader2 className="animate-spin size-4" /> : `Import ${parsedData.length} dự án`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
