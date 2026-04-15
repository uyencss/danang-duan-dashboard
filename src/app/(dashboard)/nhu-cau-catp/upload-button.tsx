"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let dataToUpload: any[] = [];

      if (fileExt === 'csv') {
        const text = await file.text();
        const parseResult = Papa.parse(text, {
          skipEmptyLines: true,
        });
        dataToUpload = parseResult.data;
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        dataToUpload = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      } else {
        toast.error("Vui lòng tải lên file .csv hoặc .xlsx");
        setIsUploading(false);
        return;
      }

      const res = await fetch("/api/upload-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToUpload }),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi tải dữ liệu lên Server");
      }

      const result = await res.json();
      toast.success(`Đã thêm/cập nhật thành công ${result.count} dòng dữ liệu!`);
      setIsOpen(false);
      router.refresh();
      
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi xử lý file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-[#0070eb] hover:bg-[#0058bc] text-white">
        <Upload className="w-4 h-4 mr-2" />
        Upload Data
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-[#0058bc]/20 bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Tải lên dữ liệu khảo sát</DialogTitle>
          <DialogDescription className="text-slate-400">
            Kéo thả hoặc chọn file .csv / .xlsx chứa kết quả khảo sát Nhu cầu CATP.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-[#0070eb] rounded-lg p-10 mt-4 transition-colors relative">
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-[#0070eb] animate-spin" />
              <span className="text-sm text-slate-300">Đang xử lý và lưu dữ liệu...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="p-4 bg-[#0070eb]/10 rounded-full">
                <FileSpreadsheet className="w-10 h-10 text-[#0070eb]" />
              </div>
              <p className="text-sm text-slate-300">Click để chọn file</p>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
