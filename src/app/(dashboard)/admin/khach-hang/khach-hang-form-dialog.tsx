"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhanLoaiKH } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";
import { createKhachHang, updateKhachHang } from "./actions";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  ten: z.string().min(2, "Tên khách hàng tối thiểu 2 ký tự"),
  phanLoai: z.nativeEnum(PhanLoaiKH),
  diaChi: z.string().optional().or(z.literal("")),
  dauMoiTiepCan: z.string().optional().or(z.literal("")),
  soDienThoaiDauMoi: z.string().optional().or(z.literal("")),
  ngaySinhDauMoi: z.string().optional().or(z.literal("")),
  lanhDaoDonVi: z.string().optional().or(z.literal("")),
  soDienThoaiLanhDao: z.string().optional().or(z.literal("")),
  ngaySinhLanhDao: z.string().optional().or(z.literal("")),
  ngayThanhLap: z.string().optional().or(z.literal("")),
  ngayKyNiem: z.string().optional().or(z.literal("")),
  ghiChu: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface KhachHangFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: any; // For edit mode
}

export function KhachHangFormDialog({ open, setOpen, data }: KhachHangFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!data;

  const formatDateForInput = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ten: data?.ten || "",
      phanLoai: data?.phanLoai || PhanLoaiKH.CHINH_PHU,
      diaChi: data?.diaChi || "",
      dauMoiTiepCan: data?.dauMoiTiepCan || "",
      soDienThoaiDauMoi: data?.soDienThoaiDauMoi || "",
      ngaySinhDauMoi: formatDateForInput(data?.ngaySinhDauMoi),
      lanhDaoDonVi: data?.lanhDaoDonVi || "",
      soDienThoaiLanhDao: data?.soDienThoaiLanhDao || "",
      ngaySinhLanhDao: formatDateForInput(data?.ngaySinhLanhDao),
      ngayThanhLap: formatDateForInput(data?.ngayThanhLap),
      ngayKyNiem: formatDateForInput(data?.ngayKyNiem),
      ghiChu: data?.ghiChu || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        ten: data?.ten || "",
        phanLoai: data?.phanLoai || PhanLoaiKH.CHINH_PHU,
        diaChi: data?.diaChi || "",
        dauMoiTiepCan: data?.dauMoiTiepCan || "",
        soDienThoaiDauMoi: data?.soDienThoaiDauMoi || "",
        ngaySinhDauMoi: formatDateForInput(data?.ngaySinhDauMoi),
        lanhDaoDonVi: data?.lanhDaoDonVi || "",
        soDienThoaiLanhDao: data?.soDienThoaiLanhDao || "",
        ngaySinhLanhDao: formatDateForInput(data?.ngaySinhLanhDao),
        ngayThanhLap: formatDateForInput(data?.ngayThanhLap),
        ngayKyNiem: formatDateForInput(data?.ngayKyNiem),
        ghiChu: data?.ghiChu || "",
      });
    }
  }, [open, data, form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const result = isEdit 
      ? await updateKhachHang(data.id, values) 
      : await createKhachHang(values);

    if (result.success) {
      toast.success(isEdit ? "Cập nhật thành công!" : "Tạo khách hàng thành công!");
      setOpen(false);
      form.reset();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] gap-0 p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-[#191c1e]">
            {isEdit ? "Chỉnh sửa Khách hàng" : "Thêm Khách hàng mới"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
            <ScrollArea className="max-h-[80vh] p-6 pt-0">
              <div className="space-y-6 py-4">
                {/* Core Info */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ten"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tên Khách hàng *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: Sở Y tế Đà Nẵng..." {...field} className="h-11 rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phanLoai"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phân loại Khách hàng *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Chọn phân loại">
                                {field.value === PhanLoaiKH.CHINH_PHU ? "Chính phủ/ Sở ban ngành" : 
                                 field.value === PhanLoaiKH.DOANH_NGHIEP ? "Doanh nghiệp" : 
                                 field.value === PhanLoaiKH.CONG_AN ? "Công an" : field.value}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={PhanLoaiKH.CHINH_PHU}>Chính phủ/ Sở ban ngành</SelectItem>
                            <SelectItem value={PhanLoaiKH.DOANH_NGHIEP}>Doanh nghiệp</SelectItem>
                            <SelectItem value={PhanLoaiKH.CONG_AN}>Công an</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diaChi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Địa chỉ</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập địa chỉ..." {...field} className="h-11 rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Đầu mối tiếp cận */}
                <div className="p-4 rounded-2xl bg-slate-50 space-y-4 border border-slate-100">
                  <h4 className="text-xs font-black text-[#0058bc] uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[#0058bc]" />
                    Thông tin Đầu mối Tiếp cận
                  </h4>
                  <FormField
                    control={form.control}
                    name="dauMoiTiepCan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Họ và tên đầu mối</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập họ tên..." {...field} className="h-10 bg-white" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="soDienThoaiDauMoi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Số điện thoại</FormLabel>
                          <FormControl>
                            <Input placeholder="0905..." {...field} className="h-10 bg-white" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ngaySinhDauMoi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Ngày sinh nhật</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="h-10 bg-white" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Lãnh đạo đơn vị */}
                <div className="p-4 rounded-2xl bg-slate-50 space-y-4 border border-slate-100">
                  <h4 className="text-xs font-black text-purple-600 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-purple-600" />
                    Thông tin Lãnh đạo Đơn vị
                  </h4>
                  <FormField
                    control={form.control}
                    name="lanhDaoDonVi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Họ và tên Lãnh đạo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập họ tên..." {...field} className="h-10 bg-white" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="soDienThoaiLanhDao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Số điện thoại</FormLabel>
                          <FormControl>
                            <Input placeholder="0905..." {...field} className="h-10 bg-white" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ngaySinhLanhDao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Ngày sinh nhật</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="h-10 bg-white" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Milestone Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ngayThanhLap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ngày thành lập</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="h-11 rounded-xl" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ngayKyNiem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ngày kỷ niệm</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="h-11 rounded-xl" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ghiChu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ghi chú thêm</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Nhập ghi chú quan trọng..." {...field} className="min-h-[100px] rounded-xl" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 border-t bg-slate-50/50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="rounded-xl font-bold">
                Hủy
              </Button>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#000719] to-[#0d1f3c] text-white px-8 rounded-xl font-bold shadow-lg shadow-black/20 hover:scale-[1.02] transition-all">
                {isEdit ? "Cập nhật" : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
