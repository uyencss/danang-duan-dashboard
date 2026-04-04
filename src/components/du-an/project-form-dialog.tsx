"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LinhVuc, TrangThaiDuAn } from "@prisma/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  updateDuAn,
  getKhachHangOptions,
  getSanPhamOptions,
  getUserOptions,
} from "@/app/(dashboard)/du-an/actions";
import { extractTimeFields } from "@/lib/utils/time-extract";
import {
  FileText,
  CheckCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  customerId: z.number().min(1, "Vui lòng chọn khách hàng"),
  productId: z.number().min(1, "Vui lòng chọn sản phẩm"),
  amId: z.string().optional().or(z.literal("")),
  amHoTroId: z.string().optional().or(z.literal("")),
  chuyenVienId: z.string().optional().or(z.literal("")),
  cvHoTro1Id: z.string().optional().or(z.literal("")),
  cvHoTro2Id: z.string().optional().or(z.literal("")),
  tenDuAn: z.string().min(5, "Tên dự án tối thiểu 5 ký tự"),
  linhVuc: z.nativeEnum(LinhVuc),
  tongDoanhThuDuKien: z.coerce.number().min(0, "Doanh thu không được âm"),
  doanhThuTheoThang: z.coerce.number().default(0),
  maHopDong: z.string().optional().or(z.literal("")),
  ngayBatDau: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  trangThaiHienTai: z.nativeEnum(TrangThaiDuAn).optional(),
});

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [khOptions, setKhOptions] = useState<any[]>([]);
  const [spOptions, setSpOptions] = useState<any[]>([]);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [selectedKh, setSelectedKh] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      tenDuAn: "",
      linhVuc: LinhVuc.B2B_B2G,
      tongDoanhThuDuKien: 0,
      doanhThuTheoThang: 0,
      maHopDong: "",
      ngayBatDau: new Date().toISOString().split("T")[0],
      customerId: 0,
      productId: 0,
      amId: "",
      amHoTroId: "",
      chuyenVienId: "",
      cvHoTro1Id: "",
      cvHoTro2Id: "",
      trangThaiHienTai: TrangThaiDuAn.MOI,
    },
  });

  useEffect(() => {
    async function loadData() {
      const [kh, sp, us] = await Promise.all([
        getKhachHangOptions(),
        getSanPhamOptions(),
        getUserOptions(),
      ]);
      setKhOptions(kh.data || []);
      setSpOptions(sp.data || []);
      setUserOptions(us.data || []);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (project && open) {
      form.reset({
        tenDuAn: project.tenDuAn,
        linhVuc: project.linhVuc,
        tongDoanhThuDuKien: project.tongDoanhThuDuKien,
        doanhThuTheoThang: project.doanhThuTheoThang || 0,
        maHopDong: project.maHopDong || "",
        ngayBatDau: new Date(project.ngayBatDau).toISOString().split("T")[0],
        customerId: project.customerId,
        productId: project.productId,
        amId: project.amId || "",
        amHoTroId: project.amHoTroId || "",
        chuyenVienId: project.chuyenVienId || "",
        cvHoTro1Id: project.cvHoTro1Id || "",
        cvHoTro2Id: project.cvHoTro2Id || "",
        trangThaiHienTai: project.trangThaiHienTai,
      });
      setSelectedKh(project.khachHang);
    }
  }, [project, open, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    const result = await updateDuAn(project.id, values);
    if (result.success) {
      toast.success("Cập nhật dự án thành công!");
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const watchDate = form.watch("ngayBatDau");
  const timeInfo = watchDate ? extractTimeFields(watchDate) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none">
        <DialogHeader className="px-6 py-4 bg-[#f2f4f6] border-b border-[#eceef0]">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#0058bc]/10 text-[#0058bc] rounded-lg">
                <FileText className="size-4" />
             </div>
             <DialogTitle className="text-lg font-black text-[#191c1e]">Chỉnh sửa Thông tin Dự án</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[85vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tenDuAn"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tên dự án *</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl h-10 border-slate-200" placeholder="Tên dự án..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linhVuc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lĩnh vực *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-10 border-slate-200">
                            <SelectValue placeholder="Chọn lĩnh vực">
                              {(field.value as any) === "CHINH_PHU" ? "Chính phủ/ Sở ban ngành" : 
                               (field.value as any) === "DOANH_NGHIEP" ? "Doanh nghiệp" : 
                               (field.value as any) === "CONG_AN" ? "Công an" : field.value}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={LinhVuc.CHINH_PHU as any}>Chính phủ/ Sở ban ngành</SelectItem>
                          <SelectItem value={LinhVuc.DOANH_NGHIEP as any}>Doanh nghiệp</SelectItem>
                          <SelectItem value={LinhVuc.CONG_AN as any}>Công an</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trangThaiHienTai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trạng thái *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-10 border-slate-200">
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TrangThaiDuAn.MOI}>Mới</SelectItem>
                          <SelectItem value={TrangThaiDuAn.DANG_LAM_VIEC}>Đang làm việc</SelectItem>
                          <SelectItem value={TrangThaiDuAn.DA_DEMO}>Đã Demo</SelectItem>
                          <SelectItem value={TrangThaiDuAn.DA_GUI_BAO_GIA}>Đã gửi báo giá</SelectItem>
                          <SelectItem value={TrangThaiDuAn.DA_KY_HOP_DONG}>Đã ký hợp đồng</SelectItem>
                          <SelectItem value={TrangThaiDuAn.THAT_BAI}>Thất bại</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Khách hàng *</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-10 border-slate-200">
                            <SelectValue placeholder="Chọn khách hàng">
                              {khOptions.find(kh => String(kh.id) === String(field.value))?.ten}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {khOptions.map(kh => (
                            <SelectItem key={kh.id} value={String(kh.id)}>{kh.ten}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sản phẩm *</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-10 border-slate-200">
                            <SelectValue placeholder="Chọn sản phẩm">
                              {spOptions.find(sp => String(sp.id) === String(field.value)) 
                                ? `[${spOptions.find(sp => String(sp.id) === String(field.value))?.nhom}] ${spOptions.find(sp => String(sp.id) === String(field.value))?.tenChiTiet}` 
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {spOptions.map(sp => (
                            <SelectItem key={sp.id} value={String(sp.id)}>[{sp.nhom}] {sp.tenChiTiet}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-2 grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                   <h4 className="col-span-2 text-[10px] font-black uppercase text-[#0058bc]">Nhân sự phụ trách</h4>
                   
                   <FormField
                    control={form.control}
                    name="amId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">AM phụ trách</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl h-10 border-slate-200">
                          <SelectValue placeholder="Chọn AM">
                            {userOptions.find(u => u.id === field.value)?.name}
                          </SelectValue>
                        </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value="">Trống</SelectItem>
                             {userOptions.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                   />

                   <FormField
                    control={form.control}
                    name="amHoTroId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">AM Hỗ trợ</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl h-10 border-slate-200">
                          <SelectValue placeholder="Chọn AM">
                            {userOptions.find(u => u.id === field.value)?.name}
                          </SelectValue>
                        </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value="">Trống</SelectItem>
                             {userOptions.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                   />

                   <FormField
                    control={form.control}
                    name="chuyenVienId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">CV Chủ trì</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl h-10 border-slate-200">
                          <SelectValue placeholder="Chọn CV">
                            {userOptions.find(u => u.id === field.value)?.name}
                          </SelectValue>
                        </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value="">Trống</SelectItem>
                             {userOptions.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                   />

                   <FormField
                    control={form.control}
                    name="cvHoTro1Id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">CV Hỗ trợ 1</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl h-10 border-slate-200">
                          <SelectValue placeholder="Chọn CV">
                            {userOptions.find(u => u.id === field.value)?.name}
                          </SelectValue>
                        </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value="">Trống</SelectItem>
                             {userOptions.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                   />
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <h4 className="col-span-2 text-[10px] font-black uppercase text-[#0058bc]">Tài chính & Thời gian</h4>
                    
                    <FormField
                      control={form.control}
                      name="ngayBatDau"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Ngày bắt đầu *</FormLabel>
                          <FormControl>
                            <Input type="date" className="rounded-xl h-10 border-slate-200" {...field} />
                          </FormControl>
                          {timeInfo && (
                            <p className="text-[9px] font-bold text-[#0058bc] uppercase mt-1">
                              Tuần {timeInfo.tuan} • Tháng {timeInfo.thang} • Q{timeInfo.quy}/{timeInfo.nam}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tongDoanhThuDuKien"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Tổng doanh thu (Tr.đ)</FormLabel>
                          <FormControl>
                            <Input type="number" className="rounded-xl h-10 border-slate-200" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="doanhThuTheoThang"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Thu theo tháng (Tr.đ)</FormLabel>
                          <FormControl>
                            <Input type="number" className="rounded-xl h-10 border-slate-200" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maHopDong"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Mã hợp đồng</FormLabel>
                          <FormControl>
                            <Input className="rounded-xl h-10 border-slate-200" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                 <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Hủy</Button>
                 <Button type="submit" disabled={loading} className="rounded-xl bg-[#0058bc] hover:bg-[#004a9e] text-white px-8 font-black">
                   {loading ? "Đang lưu..." : "Cập nhật thay đổi"}
                 </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
