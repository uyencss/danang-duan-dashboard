"use client";

import { useState, useRef, useTransition } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { FileUp, FileDown, Undo2, Loader2, AlertCircle } from "lucide-react";
import { importExcelProjects, recallMostRecentExcelProjects } from "./excel-actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Define option constants for validation
const TIEU_CHI_YES_NO = ["Có", "Không"];
const PHAN_LOAI_KH = ["Chính phủ/Sở ban ngành", "Doanh nghiệp", "Công an (B2A)"];
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
        "Tổng doanh thu*", "DT theo tháng", "Mã hợp đồng", "Ngày bắt đầu* (MM/DD/YYYY)", "Ngày kết thúc (MM/DD/YYYY)",
        "Chuyên viên chủ trì", "Chuyên viên hỗ trợ 1", "Chuyên viên hỗ trợ 2", "AM phụ trách", "AM hỗ trợ 1",
        "Trạng thái khởi tạo*"
      ],
      [
        "Dự án Viễn thông mẫu", "Có", "Không",
        "Công ty TNHH ABCD", "Doanh nghiệp", "Đà Nẵng",
        "Gói Camera An ninh", "Camera AI", "Camera độ phân giải cao",
        "150.5", "10", "HD-123456", "10/20/2023", "",
        "Nguyễn Văn A", "", "", "Trần Thị B", "",
        "Mới"
      ]
    ];
    
    // Notes
    wsData.push([]);
    wsData.push(["* LƯU Ý KHI ĐIỀN DỮ LIỆU:"]);
    wsData.push(["- Phân loại khách hàng: Chọn 1 trong số: [Chính phủ/Sở ban ngành, Doanh nghiệp, Công an (B2A)]"]);
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
      // Bỏ qua dòng trống, header, và phần lưu ý
      if (!row || Object.keys(row).length === 0) return;
      if (row["Tên dự án*"] === "Tên dự án*" || row["Tên dự án*"]?.includes("LƯU Ý")) return;
      if (!row["Tên dự án*"]) return; 

      const rowErr: string[] = [];
      const rowNum = index + 1; // row index in excell

      // Yêu cầu bắt buộc
      if (!row["Khách hàng*"]) rowErr.push("Cột Khách hàng trống.");
      if (!row["Phân loại khách hàng*"]) rowErr.push("Cột Phân loại KH trống.");
      if (!row["Tên sản phẩm chi tiết*"]) rowErr.push("Cột Tên sản phẩm chi tiết trống.");
      if (!row["Nhóm sản phẩm*"]) rowErr.push("Cột Nhóm sản phẩm trống.");
      if (!row["Ngày bắt đầu* (MM/DD/YYYY)"]) rowErr.push("Cột Ngày bắt đầu trống.");
      if (!row["Trạng thái khởi tạo*"]) rowErr.push("Cột Trạng thái khởi tạo trống.");

      // Kiểm tra giá trị Option
      const plKh = row["Phân loại khách hàng*"]?.trim();
      if (plKh && !PHAN_LOAI_KH.includes(plKh)) rowErr.push(`Phân loại KH '${plKh}' không hợp lệ.`);

      const nhomSp = row["Nhóm sản phẩm*"]?.trim();
      if (nhomSp && !NHOM_SP.includes(nhomSp)) rowErr.push(`Nhóm SP '${nhomSp}' không hợp lệ.`);

      const trangThai = row["Trạng thái khởi tạo*"]?.trim();
      if (trangThai && !TRANG_THAI.includes(trangThai)) rowErr.push(`Trạng thái '${trangThai}' không hợp lệ.`);

      // Kiểm tra Yes/No
      const isTrong = row["Trọng điểm"]?.trim();
      if (isTrong && !TIEU_CHI_YES_NO.includes(isTrong)) rowErr.push(`Trọng điểm vui lòng nhập Có/Không.`);

      const isKy = row["Kỳ vọng"]?.trim();
      if (isKy && !TIEU_CHI_YES_NO.includes(isKy)) rowErr.push(`Kỳ vọng vui lòng nhập Có/Không.`);

      // Kiểm tra Map User
      const findUserId = (name: string, checkUsers: UserOption[], field: string) => {
        if (!name) return null;
        const u = checkUsers.find(x => x.name.toLowerCase() === name.toLowerCase());
        if (!u) rowErr.push(`Không tìm thấy ${field} có tên là '${name}'.`);
        return u?.id || null;
      };

      const cvId = findUserId(row["Chuyên viên chủ trì"]?.trim(), cvUsers, "Chuyên viên");
      const cvHoTro1Id = findUserId(row["Chuyên viên hỗ trợ 1"]?.trim(), cvUsers, "Chuyên viên (HT1)");
      const cvHoTro2Id = findUserId(row["Chuyên viên hỗ trợ 2"]?.trim(), cvUsers, "Chuyên viên (HT2)");
      
      const amId = findUserId(row["AM phụ trách"]?.trim(), amUsers, "AM");
      const amHoTro1Id = findUserId(row["AM hỗ trợ 1"]?.trim(), amUsers, "AM (HT1)");

      if (rowErr.length > 0) {
        errors.push(`Dòng ${rowNum}: ${rowErr.join(" | ")}`);
      } else {
        // Prepare valid data for backend processing
        validRows.push({
          tenDuAn: row["Tên dự án*"].toString(),
          isTrongDiem: row["Trọng điểm"] || "Không",
          isKyVong: row["Kỳ vọng"] || "Không",
          khachHangName: row["Khách hàng*"].toString(),
          phanLoaiKH: plKh,
          diaChi: row["Địa chỉ"]?.toString() || "",
          tenSanPham: row["Tên sản phẩm chi tiết*"].toString(),
          nhomSanPham: nhomSp,
          moTaSanPham: row["Mô tả sản phẩm"]?.toString() || "",
          tongDoanhThu: row["Tổng doanh thu*"]?.toString() || "0",
          dtTheoThang: row["DT theo tháng"]?.toString() || "0",
          maHopDong: row["Mã hợp đồng"]?.toString() || "",
          ngayBatDau: row["Ngày bắt đầu* (MM/DD/YYYY)"]?.toString(),
          ngayKetThuc: row["Ngày kết thúc (MM/DD/YYYY)"]?.toString(),
          cvId,
          cvHoTro1Id,
          cvHoTro2Id,
          amId,
          amHoTro1Id,
          trangThaiKhoiTao: trangThai
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

  const onRecall = () => {
    if(confirm("Bạn có CHẮC CHẮN muốn thu hồi danh sách dự án vừa import gần nhất bằng Excel? Các dự án này sẽ bị xóa mãi mãi khỏi hệ thống!")) {
      startTransition(async () => {
        const res = await recallMostRecentExcelProjects();
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
        <Button 
          variant="outline" 
          className="gap-2 font-medium bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
          onClick={onRecall}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
          Thu hồi Excel
        </Button>
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
