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
import { LinhVuc, TrangThaiDuAn } from "@prisma/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  createDuAn,
  getKhachHangOptions,
  getSanPhamOptions,
  getUserOptions,
} from "../actions";
import { useRouter } from "next/navigation";
import { extractTimeFields } from "@/lib/utils/time-extract";
import {
  FileText,
  Lock,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

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

export default function ProjectForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [khOptions, setKhOptions] = useState<any[]>([]);
  const [spOptions, setSpOptions] = useState<any[]>([]);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [timePreview, setTimePreview] = useState<any>(null);
  const [selectedKh, setSelectedKh] = useState<any>(null);

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
    } as any,
  });

  const watchNgayBatDau = form.watch("ngayBatDau");
  useEffect(() => {
    if (watchNgayBatDau) {
      setTimePreview(extractTimeFields(watchNgayBatDau));
    }
  }, [watchNgayBatDau]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    const result = await createDuAn(values);
    if (result.success) {
      toast.success("Tạo dự án thành công!");
      router.push(`/du-an/${result.id}`);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Single large card */}
        <div className="bg-white rounded-2xl shadow-[0px_8px_30px_rgba(25,28,30,0.06)] overflow-hidden border border-[#eceef0]">

          {/* Card Header — left-bordered accent */}
          <div className="px-8 py-6 border-l-4 border-[#0058bc] bg-[#f2f4f6]/50 flex items-center gap-3">
            <FileText className="size-5 text-[#0058bc]" />
            <h3 className="text-lg font-extrabold text-[#000719]">
              Thông tin Dự án
            </h3>
          </div>

          <div className="p-5 space-y-4">

            {/* ── Section 1: Thông tin chung ── */}
            <div className="space-y-3">
              <SectionTitle>Thông tin chung</SectionTitle>
              <div className="space-y-5">

                {/* Tên dự án */}
                <FormField
                  control={form.control as any}
                  name="tenDuAn"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Tên Dự án</FieldLabel>
                      <FormControl>
                        <input
                          {...field}
                          placeholder="Nhập tên dự án..."
                          className="w-full bg-[#f2f4f6] border-none rounded-full px-4 h-[36px] text-[#191c1e] font-medium text-sm focus:ring-2 focus:ring-[#0058bc]/20 outline-none transition-all placeholder:text-[#8a8d93]"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                {/* Lĩnh vực */}
                <FormField
                  control={form.control as any}
                  name="linhVuc"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Lĩnh vực</FieldLabel>
                      <Select key={field.name} onValueChange={field.onChange} value={field.value === undefined ? "" : String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                            <SelectValue placeholder="Chọn lĩnh vực..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={LinhVuc.CHINH_PHU as any}>Chính phủ/ Sở ban ngành</SelectItem>
                          <SelectItem value={LinhVuc.DOANH_NGHIEP as any}>Doanh nghiệp</SelectItem>
                          <SelectItem value={LinhVuc.CONG_AN as any}>Công an</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Section 2: Khách hàng ── */}
            <div className="space-y-3 mt-4">
              <SectionTitle>Thông tin Khách hàng</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Khách hàng</FieldLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(Number(val));
                          const found = khOptions.find((k) => k.id.toString() === val);
                          setSelectedKh(found || null);
                        }}
                        value={field.value === undefined ? "" : String(field.value)}
                        key={field.name}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                            <SelectValue placeholder="Chọn khách hàng...">
                                {khOptions.find((kh) => String(kh.id) === String(field.value))?.ten}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {khOptions.map((kh) => (
                            <SelectItem key={kh.id} value={kh.id.toString()}>
                              {kh.ten}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                {/* Loại khách hàng - readonly */}
                <div className="space-y-2">
                  <FieldLabel>Phân loại</FieldLabel>
                  <div className="bg-[#f2f4f6] rounded-full h-[36px] px-4 flex items-center">
                    {selectedKh ? (
                      <span className="bg-[#0058bc]/10 text-[#0058bc] text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-widest">
                        {selectedKh.phanLoai === "CHINH_PHU" ? "Chính phủ/ Sở ban ngành" : selectedKh.phanLoai === "CONG_AN" ? "Công an" : "Doanh nghiệp"}
                      </span>
                    ) : (
                      <span className="text-[#8a8d93] text-sm italic">Tự động từ khách hàng</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 3: Sản phẩm & Phân công ── */}
            <div className="space-y-3 mt-4">
              <SectionTitle>Sản phẩm &amp; Phân công</SectionTitle>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* Column LEFT */}
                <div className="space-y-4">
                  {/* Sản phẩm */}
                  <FormField
                    control={form.control as any}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel required>Sản phẩm dịch vụ</FieldLabel>
                        <Select key={field.name} onValueChange={(val) => field.onChange(Number(val))} value={field.value === undefined ? "" : String(field.value)}>
                          <FormControl>
                            <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                              <SelectValue placeholder="Chọn sản phẩm...">
                                {spOptions.find((sp) => String(sp.id) === String(field.value)) ? `[${spOptions.find((sp) => String(sp.id) === String(field.value))?.nhom}] ${spOptions.find((sp) => String(sp.id) === String(field.value))?.tenChiTiet}` : undefined}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {spOptions.map((sp) => (
                              <SelectItem key={sp.id} value={sp.id.toString()}>
                                [{sp.nhom}] {sp.tenChiTiet}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* AM Phụ trách */}
                  <FormField
                    control={form.control as any}
                    name="amId"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel>AM phụ trách</FieldLabel>
                        <Select key={field.name} onValueChange={field.onChange} value={field.value === undefined ? "" : String(field.value)}>
                          <FormControl>
                            <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                              <SelectValue placeholder="Chọn AM...">
                                {userOptions.find((u) => u.id === field.value)?.name}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">--- Trống ---</SelectItem>
                            {userOptions.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* AM Hỗ trợ */}
                  <FormField
                    control={form.control as any}
                    name="amHoTroId"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel>AM hỗ trợ</FieldLabel>
                        <Select key={field.name} onValueChange={field.onChange} value={field.value === undefined ? "" : String(field.value)}>
                          <FormControl>
                            <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                              <SelectValue placeholder="Chọn AM hỗ trợ...">
                                {userOptions.find((u) => u.id === field.value)?.name}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">--- Trống ---</SelectItem>
                            {userOptions.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Column RIGHT */}
                <div className="space-y-4">
                  {/* Trạng thái ban đầu */}
                  <FormField
                    control={form.control as any}
                    name="trangThaiHienTai"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel>Trạng thái ban đầu</FieldLabel>
                        <Select 
                          key={field.name}
                          onValueChange={field.onChange} 
                          value={String(field.value ?? "")}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                              <SelectValue placeholder="Chọn trạng thái..." />
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
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* Chuyên viên chủ trì */}
                  <FormField
                    control={form.control as any}
                    name="chuyenVienId"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel>Chuyên viên chủ trì</FieldLabel>
                        <Select key={field.name} onValueChange={field.onChange} value={field.value === undefined ? "" : String(field.value)}>
                          <FormControl>
                            <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                              <SelectValue placeholder="Chọn chuyên viên...">
                                {userOptions.find((u) => u.id === field.value)?.name}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">--- Trống ---</SelectItem>
                            {userOptions.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* CV Hỗ trợ 1 */}
                  <FormField
                    control={form.control as any}
                    name="cvHoTro1Id"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel>Chuyên viên hỗ trợ 1</FieldLabel>
                        <Select key={field.name} onValueChange={field.onChange} value={field.value === undefined ? "" : String(field.value)}>
                          <FormControl>
                            <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                              <SelectValue placeholder="Chọn chuyên viên...">
                                {userOptions.find((u) => u.id === field.value)?.name}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">--- Trống ---</SelectItem>
                            {userOptions.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* CV Hỗ trợ 2 */}
                  <FormField
                    control={form.control as any}
                    name="cvHoTro2Id"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel>Chuyên viên hỗ trợ 2</FieldLabel>
                        <Select key={field.name} onValueChange={field.onChange} value={field.value === undefined ? "" : String(field.value)}>
                          <FormControl>
                            <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                              <SelectValue placeholder="Chọn chuyên viên...">
                                {userOptions.find((u) => u.id === field.value)?.name}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">--- Trống ---</SelectItem>
                            {userOptions.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 4: Ngày bắt đầu full or grid */}
              <div className="grid grid-cols-2 gap-6 mt-4">
                <FormField
                  control={form.control as any}
                  name="ngayBatDau"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Ngày bắt đầu</FieldLabel>
                      <FormControl>
                        <div className="relative">
                          <input
                            type="date"
                            {...field}
                            className="w-full bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-[#191c1e] font-medium text-sm focus:ring-2 focus:ring-[#0058bc]/20 outline-none transition-all"
                          />
                        </div>
                      </FormControl>
                      <div className="flex gap-2 mt-2">
                        {["Tuần", "Tháng", "Quý", "Năm"].map((label) => (
                          <div key={label} className="bg-blue-50 text-[#0058bc] text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100/50">
                            {label} {
                              label === "Tuần" ? extractTimeFields(field.value).tuan :
                                label === "Tháng" ? extractTimeFields(field.value).thang :
                                  label === "Quý" ? extractTimeFields(field.value).quy :
                                    extractTimeFields(field.value).nam
                            }
                          </div>
                        ))}
                      </div>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Section 4: Tài chính & Hợp đồng ── */}
            <div className="space-y-3 mt-4">
              <SectionTitle>Tài chính &amp; Hợp đồng</SectionTitle>
              <div className="grid grid-cols-2 gap-4">

                {/* Doanh thu */}
                <FormField
                  control={form.control as any}
                  name="tongDoanhThuDuKien"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Tổng doanh thu dự kiến</FieldLabel>
                      <FormControl>
                        <div className="relative">
                          <input
                            type="number"
                            {...field}
                            className="w-full bg-[#f2f4f6] border-none rounded-full h-[36px] pl-4 pr-20 text-[#000719] font-bold text-sm focus:ring-2 focus:ring-[#0058bc]/20 outline-none transition-all"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#8a8d93] uppercase">
                            Triệu đồng
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="doanhThuTheoThang"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Doanh thu theo tháng</FieldLabel>
                      <FormControl>
                        <div className="relative group">
                          <input
                            {...field}
                            type="number"
                            placeholder="0"
                            className="w-full bg-[#f2f4f6] border-none rounded-full h-[36px] pl-4 pr-24 text-[#191c1e] font-medium text-sm focus:ring-2 focus:ring-[#0058bc]/20 outline-none transition-all placeholder:text-[#8a8d93]"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#8a8d93] uppercase tracking-wider group-focus-within:text-[#0058bc] transition-colors pointer-events-none">
                            TRIỆU ĐỒNG
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="maHopDong"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Mã hợp đồng</FieldLabel>
                      <FormControl>
                          <input
                            {...field}
                            placeholder="VD: MBF-DN-001"
                            className="w-full bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-[#191c1e] font-medium text-sm focus:ring-2 focus:ring-[#0058bc]/20 outline-none transition-all placeholder:text-[#8a8d93]"
                          />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Bottom Actions ── */}
            <div className="pt-5 mt-3 flex justify-end items-center gap-4 border-t border-[#eceef0]">
              <Link
                href="/du-an"
                className="px-8 py-2.5 h-[40px] rounded-full border-2 border-[#c5c6ce] text-[#44474d] text-sm font-bold hover:bg-[#f2f4f6] transition-all inline-flex items-center gap-2"
              >
                <ArrowLeft className="size-4" />
                Hủy
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-2.5 h-[40px] rounded-full bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-white text-sm font-black shadow-lg shadow-[#0058bc]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                <CheckCircle className="size-4" />
                {loading ? "Đang xử lý..." : "Tạo dự án"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

// ── Micro-components ────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[#0058bc] font-bold text-xs uppercase tracking-widest flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-[#0058bc]" />
      {children}
    </h4>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="block text-xs font-bold text-[#44474d] uppercase tracking-tight mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}
