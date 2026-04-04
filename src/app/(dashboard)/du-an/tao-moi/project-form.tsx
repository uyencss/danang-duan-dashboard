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
import { LinhVuc } from "@prisma/client";
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
  amId: z.string().min(1, "Vui lòng chọn AM phụ trách"),
  chuyenVienId: z.string().optional().or(z.literal("")),
  tenDuAn: z.string().min(5, "Tên dự án tối thiểu 5 ký tự"),
  linhVuc: z.nativeEnum(LinhVuc),
  tongDoanhThuDuKien: z.coerce.number().min(0, "Doanh thu không được âm"),
  soHopDong: z.string().optional().or(z.literal("")),
  maHopDong: z.string().optional().or(z.literal("")),
  ngayBatDau: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
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
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenDuAn: "",
      linhVuc: LinhVuc.B2B_B2G,
      tongDoanhThuDuKien: 0,
      soHopDong: "",
      maHopDong: "",
      ngayBatDau: new Date().toISOString().split("T")[0],
    },
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
                  control={form.control}
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
                  control={form.control}
                  name="linhVuc"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Lĩnh vực</FieldLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                            <SelectValue placeholder="Chọn lĩnh vực...">
                              {field.value === LinhVuc.B2B_B2G ? "B2B/B2G (Cloud, IT...)" : field.value === LinhVuc.B2A ? "B2A (Police / Public Sector)" : undefined}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={LinhVuc.B2B_B2G}>B2B/B2G (Cloud, IT...)</SelectItem>
                          <SelectItem value={LinhVuc.B2A}>B2A (Police / Public Sector)</SelectItem>
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
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Khách hàng</FieldLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(Number(val));
                          const found = khOptions.find((k) => k.id === Number(val));
                          setSelectedKh(found || null);
                        }}
                        value={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                            <SelectValue placeholder="Chọn khách hàng...">
                              {khOptions.find((kh) => kh.id === field.value)?.ten}
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
                        {selectedKh.phanLoai}
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
              <div className="grid grid-cols-2 gap-4">

                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Sản phẩm dịch vụ</FieldLabel>
                      <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? field.value.toString() : undefined}>
                        <FormControl>
                          <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                            <SelectValue placeholder="Chọn sản phẩm...">
                              {spOptions.find((sp) => sp.id === field.value) ? `[${spOptions.find((sp) => sp.id === field.value)?.nhom}] ${spOptions.find((sp) => sp.id === field.value)?.tenChiTiet}` : undefined}
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

                <FormField
                  control={form.control}
                  name="amId"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>AM phụ trách</FieldLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                            <SelectValue placeholder="Chọn AM...">
                              {userOptions.find((u) => u.id === field.value)?.name}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userOptions.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chuyenVienId"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Chuyên viên kỹ thuật</FieldLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-sm font-medium focus:ring-2 focus:ring-[#0058bc]/20">
                            <SelectValue placeholder="Chọn chuyên viên (nếu có)...">
                              {field.value === "none" ? "--- Không có ---" : userOptions.find((u) => u.id === field.value)?.name}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">--- Không có ---</SelectItem>
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

                {/* Ngày bắt đầu */}
                <FormField
                  control={form.control}
                  name="ngayBatDau"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Ngày bắt đầu</FieldLabel>
                      <FormControl>
                        <div>
                          <input
                            type="date"
                            {...field}
                            className="w-full bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-[#000719] font-bold text-sm focus:ring-2 focus:ring-[#0058bc]/20 outline-none transition-all"
                          />
                          {timePreview && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {[
                                `Tuần ${timePreview.tuan}`,
                                `Tháng ${timePreview.thang}`,
                                `Quý ${timePreview.quy}`,
                                `Năm ${timePreview.nam}`,
                              ].map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-[#0058bc]/10 text-[#0058bc] text-[10px] font-bold px-2 py-0.5 rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
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
                  control={form.control}
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

                {/* Trạng thái ban đầu - readonly */}
                <div className="space-y-2">
                  <FieldLabel>Trạng thái ban đầu</FieldLabel>
                  <div className="bg-[#f2f4f6] rounded-full h-[36px] px-4 flex items-center justify-between">
                    <span className="bg-[#0058bc] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                      Mới
                    </span>
                    <Lock className="size-3.5 text-[#8a8d93]" />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="soHopDong"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Số hợp đồng</FieldLabel>
                      <FormControl>
                          <input
                            {...field}
                            placeholder="VD: HĐ-2026-001"
                            className="w-full bg-[#f2f4f6] border-none rounded-full h-[36px] px-4 text-[#191c1e] font-medium text-sm focus:ring-2 focus:ring-[#0058bc]/20 outline-none transition-all placeholder:text-[#8a8d93]"
                          />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
