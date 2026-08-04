"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import { format } from "date-fns";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { SmartDateInput } from "@/components/ui/smart-date-input";

const ContactSchema = z.object({
  hoTen: z.string().optional().or(z.literal("")),
  chucVu: z.string().optional().or(z.literal("")),
  soDienThoai: z.string().optional().or(z.literal("")),
  ngaySinh: z.string().optional().or(z.literal("")),
});

const formSchema = z.object({
  ten: z.string().min(2, "Tên khách hàng tối thiểu 2 ký tự"),
  phanLoai: z.nativeEnum(PhanLoaiKH),
  diaChi: z.string().optional().or(z.literal("")),
  danhSachDauMoi: z.array(ContactSchema).optional(),
  danhSachLanhDao: z.array(ContactSchema).optional(),
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
  const [saveAction, setSaveAction] = useState<"close" | "keep">("close");
  const isEdit = !!data;

  const formatDateForInput = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
  };

  const getInitialContacts = (jsonArr: any, legacyName: string, legacyPos: string, legacyPhone: string, legacyDob: any) => {
    if (jsonArr && Array.isArray(jsonArr) && jsonArr.length > 0) {
      return jsonArr.map((item: any) => ({
        hoTen: item.hoTen || "",
        chucVu: item.chucVu || "",
        soDienThoai: item.soDienThoai || "",
        ngaySinh: formatDateForInput(item.ngaySinh),
      }));
    }
    if (legacyName) {
      return [{
        hoTen: legacyName,
        chucVu: legacyPos || "",
        soDienThoai: legacyPhone || "",
        ngaySinh: formatDateForInput(legacyDob)
      }];
    }
    return [];
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ten: data?.ten || "",
      phanLoai: data?.phanLoai || PhanLoaiKH.CHINH_PHU,
      diaChi: data?.diaChi || "",
      danhSachDauMoi: getInitialContacts(data?.danhSachDauMoi, data?.dauMoiTiepCan, "", data?.soDienThoaiDauMoi, data?.ngaySinhDauMoi),
      danhSachLanhDao: getInitialContacts(data?.danhSachLanhDao, data?.lanhDaoDonVi, "", data?.soDienThoaiLanhDao, data?.ngaySinhLanhDao),
      ngayThanhLap: formatDateForInput(data?.ngayThanhLap),
      ngayKyNiem: formatDateForInput(data?.ngayKyNiem),
      ghiChu: data?.ghiChu || "",
    },
  });

  const { fields: dauMoiFields, append: appendDauMoi, remove: removeDauMoi } = useFieldArray({
    control: form.control,
    name: "danhSachDauMoi"
  });

  const { fields: lanhDaoFields, append: appendLanhDao, remove: removeLanhDao } = useFieldArray({
    control: form.control,
    name: "danhSachLanhDao"
  });

  useEffect(() => {
    if (open) {
      form.reset({
        ten: data?.ten || "",
        phanLoai: data?.phanLoai || PhanLoaiKH.CHINH_PHU,
        diaChi: data?.diaChi || "",
        danhSachDauMoi: getInitialContacts(data?.danhSachDauMoi, data?.dauMoiTiepCan, "", data?.soDienThoaiDauMoi, data?.ngaySinhDauMoi),
        danhSachLanhDao: getInitialContacts(data?.danhSachLanhDao, data?.lanhDaoDonVi, "", data?.soDienThoaiLanhDao, data?.ngaySinhLanhDao),
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
      if (isEdit) {
        toast.success("Cập nhật thành công!");
        setOpen(false);
      } else {
        toast.success("Tạo khách hàng thành công!");
        if (saveAction === "keep") {
          form.reset({
            ten: "",
            phanLoai: PhanLoaiKH.CHINH_PHU,
            diaChi: "",
            danhSachDauMoi: [],
            danhSachLanhDao: [],
            ngayThanhLap: "",
            ngayKyNiem: "",
            ghiChu: "",
          });
        } else {
          setOpen(false);
          form.reset();
        }
      }
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px] gap-0 p-0">
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phanLoai"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phân loại *</FormLabel>
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
                </div>

                {/* Đầu mối tiếp cận */}
                <div className="p-4 rounded-2xl bg-slate-50 space-y-4 border border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-black text-[#0058bc] uppercase tracking-wider flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-[#0058bc]" />
                      Đầu mối Tiếp cận
                    </h4>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => appendDauMoi({ hoTen: "", chucVu: "", soDienThoai: "", ngaySinh: "" })}
                      className="h-7 text-[10px] font-bold"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Thêm đầu mối
                    </Button>
                  </div>
                  
                  {dauMoiFields.map((field, index) => (
                    <div key={field.id} className="relative p-3 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3">
                      {dauMoiFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeDauMoi(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                      <div className="grid grid-cols-2 gap-3 pr-6">
                        <FormField
                          control={form.control}
                          name={`danhSachDauMoi.${index}.hoTen`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Họ và tên</FormLabel>
                              <FormControl>
                                <Input placeholder="Nhập họ tên..." {...field} className="h-9" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`danhSachDauMoi.${index}.chucVu`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Chức vụ</FormLabel>
                              <FormControl>
                                <Input placeholder="Giám đốc, Trưởng phòng..." {...field} className="h-9" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`danhSachDauMoi.${index}.soDienThoai`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Số điện thoại</FormLabel>
                              <FormControl>
                                <Input placeholder="0905..." {...field} className="h-9" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`danhSachDauMoi.${index}.ngaySinh`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Ngày sinh</FormLabel>
                              <FormControl>
                                <SmartDateInput 
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="ngày/tháng/năm"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  {dauMoiFields.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400 italic">Chưa có thông tin đầu mối</div>
                  )}
                </div>

                {/* Lãnh đạo đơn vị */}
                <div className="p-4 rounded-2xl bg-slate-50 space-y-4 border border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-black text-purple-600 uppercase tracking-wider flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-purple-600" />
                      Lãnh đạo Đơn vị
                    </h4>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => appendLanhDao({ hoTen: "", chucVu: "", soDienThoai: "", ngaySinh: "" })}
                      className="h-7 text-[10px] font-bold"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Thêm lãnh đạo
                    </Button>
                  </div>
                  
                  {lanhDaoFields.map((field, index) => (
                    <div key={field.id} className="relative p-3 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3">
                      {lanhDaoFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeLanhDao(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                      <div className="grid grid-cols-2 gap-3 pr-6">
                        <FormField
                          control={form.control}
                          name={`danhSachLanhDao.${index}.hoTen`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Họ và tên</FormLabel>
                              <FormControl>
                                <Input placeholder="Nhập họ tên..." {...field} className="h-9" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`danhSachLanhDao.${index}.chucVu`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Chức vụ</FormLabel>
                              <FormControl>
                                <Input placeholder="Giám đốc, Trưởng phòng..." {...field} className="h-9" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`danhSachLanhDao.${index}.soDienThoai`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Số điện thoại</FormLabel>
                              <FormControl>
                                <Input placeholder="0905..." {...field} className="h-9" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`danhSachLanhDao.${index}.ngaySinh`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Ngày sinh</FormLabel>
                              <FormControl>
                                <SmartDateInput 
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="ngày/tháng/năm"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  {lanhDaoFields.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400 italic">Chưa có thông tin lãnh đạo</div>
                  )}
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
                          <SmartDateInput 
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="ngày/tháng/năm"
                          />
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
                          <SmartDateInput 
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="ngày/tháng/năm"
                          />
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
              {isEdit ? (
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#000719] to-[#0d1f3c] text-white px-8 rounded-xl font-bold shadow-lg shadow-black/20 hover:scale-[1.02] transition-all" onClick={() => setSaveAction("close")}>
                  Cập nhật
                </Button>
              ) : (
                <>
                  <Button type="submit" variant="outline" disabled={loading} className="px-6 rounded-xl font-bold text-[#0058bc] border-[#0058bc] hover:bg-[#0058bc]/5 bg-white" onClick={() => setSaveAction("keep")}>
                    Lưu & thêm KH mới
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#000719] to-[#0d1f3c] text-white px-8 rounded-xl font-bold shadow-lg shadow-black/20 hover:scale-[1.02] transition-all" onClick={() => setSaveAction("close")}>
                    Lưu & Thoát
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
