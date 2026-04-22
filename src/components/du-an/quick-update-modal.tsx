"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrangThaiDuAn } from "@prisma/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createTaskLog } from "@/app/(dashboard)/du-an/actions";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, History, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SmartDateInput } from "@/components/ui/smart-date-input";
import { ScrollArea } from "@/components/ui/scroll-area";



const formSchema = z.object({
  trangThaiMoi: z.nativeEnum(TrangThaiDuAn),
  noiDungChiTiet: z.string().min(10, "Vui lòng nhập tối thiểu 10 ký tự nội dung"),
  ngayGio: z.string(),
  buoc: z.string().optional(),
});

const STEPS = [
  "Bước 1: Tiếp cận tìm hiểu nhu cầu",
  "Bước 2: Đề xuất GP",
  "Bước 3: Xây dựng đề án",
  "Bước 4: Tham gia thầu",
  "Bước 5: Ký hợp đồng",
  "Bước 6: Triển khai",
  "Bước 7: Hỗ trợ sau bán"
];

export function QuickUpdateModal({ 
  open, 
  setOpen, 
  project 
}: { 
  open: boolean, 
  setOpen: (open: boolean) => void, 
  project: any 
}) {
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trangThaiMoi: project?.trangThaiHienTai || TrangThaiDuAn.MOI,
      noiDungChiTiet: "",
      ngayGio: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      buoc: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        trangThaiMoi: project?.trangThaiHienTai || TrangThaiDuAn.MOI,
        noiDungChiTiet: "",
        ngayGio: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        buoc: "",
      });
      setSelectedStep("");
    }
  }, [open, project, form]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      let uploadedFilesInfo = [];
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("files", file));
        
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        
        if (!uploadData.success) {
           toast.error(uploadData.error || "Lỗi upload file");
           setLoading(false);
           return;
        }
        
        uploadedFilesInfo = uploadData.files.map((f: any) => ({
           name: f.fileName,
           type: f.type,
           size: f.size,
           url: f.filePath,
        }));
      }

      const result = await createTaskLog({
          projectId: project.id,
          trangThaiMoi: values.trangThaiMoi,
          noiDungChiTiet: values.noiDungChiTiet,
          ngayGio: new Date(values.ngayGio),
          buoc: selectedStep || undefined,
          files: uploadedFilesInfo.length > 0 ? uploadedFilesInfo : undefined,
      });

      if (result.success) {
        if (selectedStep) {
          toast.success("Bước quy trình đã được gửi tới Quản trị viên để duyệt!");
        } else {
          toast.success("Cập nhật tiến độ thành công!");
        }
        setOpen(false);
        form.reset();
        setSelectedFiles([]);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Lỗi khi xử lý tệp tin");
    }
    setLoading(false);
  };

  const TRANG_THAI_LABELS: Record<string, string> = {
    MOI: "Mới",
    DANG_LAM_VIEC: "Đang làm việc",
    DA_DEMO: "Đã demo",
    DA_GUI_BAO_GIA: "Đã gửi báo giá",
    DA_KY_HOP_DONG: "Đã ký hợp đồng",
    THAT_BAI: "Thất bại",
  };

  const getStatusBadge = (state: TrangThaiDuAn) => {
    if (!state) return null;
    const colors: any = {
        MOI: "bg-gray-100 text-gray-600",
        DANG_LAM_VIEC: "bg-blue-100 text-blue-600",
        DA_DEMO: "bg-purple-100 text-purple-600",
        DA_GUI_BAO_GIA: "bg-yellow-100 text-yellow-700",
        DA_KY_HOP_DONG: "bg-green-100 text-green-700",
        THAT_BAI: "bg-red-100 text-red-600",
    };
    const colorClass = colors[state] || "bg-gray-100 text-gray-600";
    return <Badge className={cn("text-[11px] h-6 font-bold tracking-tight", colorClass)}>{TRANG_THAI_LABELS[state] || '...'}</Badge>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[92vh] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-8 pb-4 shrink-0">
          <DialogTitle className="text-2xl font-black text-[#000719] flex items-center gap-2">
            <History className="size-6 text-[#000719]" /> Cập nhật Tiến độ
          </DialogTitle>
          <DialogDescription className="font-medium text-[#44474d] pt-1">
             Dự án: <span className="text-[#191c1e] font-bold">{project?.tenDuAn}</span>
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1">
              <div className="px-8 space-y-6 pb-8">
                <div className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 justify-center">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Hiện tại</span>
                        {getStatusBadge(project?.trangThaiHienTai)}
                    </div>
                    <ArrowRight className="size-4 text-gray-300 mx-2" />
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Mới</span>
                        {getStatusBadge(form.watch("trangThaiMoi"))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="trangThaiMoi"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-black text-[#8a8d93] uppercase tracking-widest">Chuyển trạng thái sang</FormLabel>
                        <Select key={field.name} onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Chọn trạng thái">
                                  {field.value ? (TRANG_THAI_LABELS[field.value] || field.value) : "Chọn trạng thái"}
                                </SelectValue>
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {Object.values(TrangThaiDuAn).map(state => (
                                    <SelectItem key={state} value={state}>{TRANG_THAI_LABELS[state] || state}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="ngayGio"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-black text-[#8a8d93] uppercase tracking-widest">Ngày giờ thực hiện</FormLabel>
                        <FormControl>
                            <SmartDateInput 
                              value={field.value}
                              onChange={field.onChange}
                              showTime={true}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <FormField
                  control={form.control}
                  name="noiDungChiTiet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black text-[#8a8d93] uppercase tracking-widest">Nội dung chi tiết *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Mô tả công việc đã thực hiện, kết quả đạt được hoặc khó khăn..." 
                          className="min-h-[140px] bg-white rounded-2xl border-gray-200 focus:ring-blue-500/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-[#8a8d93] uppercase tracking-widest">Tiến độ quy trình</p>
                  <div className="flex flex-wrap gap-2">
                    {STEPS.map((step) => {
                      const isSelected = selectedStep === step;
                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setSelectedStep(isSelected ? "" : step)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                            isSelected 
                              ? "bg-gradient-to-r from-[#0058bc] to-[#0070eb] text-white border-transparent shadow-md transform scale-105" 
                              : "bg-gray-50 text-gray-400 border-gray-100 hover:border-blue-200 hover:text-blue-500"
                          )}
                        >
                          {step}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-black text-[#8a8d93] uppercase tracking-widest mb-2">Tệp đính kèm</p>
                  <div className="relative group">
                    <Input 
                      type="file" 
                      className="hidden" 
                      id="file-upload" 
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setSelectedFiles(prev => [...prev, ...files]);
                      }}
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                    >
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 text-gray-400 group-hover:text-blue-600 transition-colors">
                        <History className="size-4 rotate-45" /> 
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-600 group-hover:text-blue-700">Tải tệp lên hệ thống</p>
                        <p className="text-[10px] text-gray-400">Excel, Word, PDF, PPT, CSV... tối đa 20MB</p>
                      </div>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 px-4 bg-blue-50/50 rounded-xl border border-blue-100 group animate-in slide-in-from-left-2 duration-300">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-white rounded-lg shadow-sm">
                                <History className="size-3.5 text-blue-500" />
                             </div>
                             <div className="min-w-0">
                               <p className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{file.name}</p>
                               <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                             </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 px-8 border-t border-gray-100 shrink-0 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="font-bold">
                Bỏ qua
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#000719] hover:bg-[#000719]/90 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-[#000719]/20">
                {loading ? "Đang lưu..." : "Xác nhận & Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
