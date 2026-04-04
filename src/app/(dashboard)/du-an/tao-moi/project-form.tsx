"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { LinhVuc, TrangThaiDuAn } from "@prisma/client";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  createDuAn,
  getKhachHangOptions,
  getSanPhamOptions,
  getUserOptions,
} from "../actions";
import { useRouter } from "next/navigation";
import { extractTimeFields } from "@/lib/utils/time-extract";
import { FileText, CheckCircle } from "lucide-react";
import Link from "next/link";
import { SearchableSelect } from "@/components/ui/searchable-select";

// ── Maps for human-readable labels ──
const LINH_VUC_LABELS: Record<string, string> = {
  CHINH_PHU: "Chính phủ / Sở ban ngành",
  DOANH_NGHIEP: "Doanh nghiệp",
  CONG_AN: "Công an (B2A)",
};

const TRANG_THAI_LABELS: Record<string, string> = {
  MOI: "Mới",
  DANG_LAM_VIEC: "Đang làm việc",
  DA_DEMO: "Đã Demo",
  DA_GUI_BAO_GIA: "Đã gửi báo giá",
  DA_KY_HOP_DONG: "Đã ký hợp đồng",
  THAT_BAI: "Thất bại",
};

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
      linhVuc: "CHINH_PHU" as any,
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
      trangThaiHienTai: "MOI" as any,
    } as any,
  });

  const watchNgayBatDau = form.watch("ngayBatDau");
  useEffect(() => {
    if (watchNgayBatDau) {
      setTimePreview(extractTimeFields(watchNgayBatDau));
    }
  }, [watchNgayBatDau]);

  // ── Derived option lists for SearchableSelect ──
  const linhVucOptions = useMemo(
    () =>
      Object.entries(LINH_VUC_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    []
  );

  const trangThaiOptions = useMemo(
    () =>
      Object.entries(TRANG_THAI_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    []
  );

  const khSearchOptions = useMemo(
    () =>
      khOptions.map((kh) => ({
        value: kh.id.toString(),
        label: kh.ten,
      })),
    [khOptions]
  );

  const spSearchOptions = useMemo(
    () =>
      spOptions.map((sp) => ({
        value: sp.id.toString(),
        label: `[${sp.nhom}] ${sp.tenChiTiet}`,
      })),
    [spOptions]
  );

  const allUserSearchOptions = useMemo(
    () =>
      userOptions.map((u) => ({
        value: u.id,
        label: u.name,
      })),
    [userOptions]
  );

  const amSearchOptions = useMemo(
    () => [
      { value: "", label: "--- Trống ---" },
      ...userOptions
        .filter((u) => u.role === "AM" || u.role === "ADMIN")
        .map((u) => ({ value: u.id, label: u.name })),
    ],
    [userOptions]
  );

  const cvSearchOptions = useMemo(
    () => [
      { value: "", label: "--- Trống ---" },
      ...userOptions
        .filter((u) => u.role === "CV" || u.role === "ADMIN")
        .map((u) => ({ value: u.id, label: u.name })),
    ],
    [userOptions]
  );

  const allUserWithEmpty = useMemo(
    () => [{ value: "", label: "--- Trống ---" }, ...allUserSearchOptions],
    [allUserSearchOptions]
  );

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_rgba(0,88,188,0.08)] border border-white/50 ring-1 ring-blue-100/30 overflow-hidden">
          {/* Header Area */}
          <div className="px-8 py-5 border-b border-blue-50/50 bg-gradient-to-r from-blue-50/40 via-white to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-[18px] bg-gradient-to-br from-[#0058bc] to-[#00c2ff] text-white shadow-xl shadow-blue-500/20 ring-4 ring-blue-50 transition-all">
                <FileText className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-[1000] text-[#0D1F3C] tracking-tighter uppercase">
                  Cấu Hình Dự Án
                </h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">
                  Khởi tạo nhanh hồ sơ hệ thống
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/du-an"
                className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm bg-white"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-2.5 rounded-full bg-gradient-to-r from-[#0058bc] to-[#00aaff] text-white font-[1000] text-sm shadow-2xl shadow-blue-500/30 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2 border border-white/20"
              >
                <CheckCircle className="size-4" />{" "}
                {loading ? "Đang xử lý..." : "KHỞI TẠO DỰ ÁN"}
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-7">
              {/* ═══ HÀNG 1: THÔNG TIN CƠ BẢN ═══ */}
              <div className="xl:col-span-2">
                <FormField
                  control={form.control as any}
                  name="tenDuAn"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Tên Dự Án</FieldLabel>
                      <FormControl>
                        <input
                          {...field}
                          placeholder="VD: Triển khai CĐS TP Đà Nẵng..."
                          className="w-full bg-[#f8fbfe] border-none rounded-2xl h-[44px] px-4 text-[#0D1F3C] font-bold text-sm focus:ring-2 focus:ring-[#0058bc]/30 outline-none transition-all placeholder:text-slate-300"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] text-red-500 mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Lĩnh vực */}
              <FormField
                control={form.control as any}
                name="linhVuc"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>Lĩnh Vực</FieldLabel>
                    <SearchableSelect
                      options={linhVucOptions}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={field.onChange}
                      placeholder="Chọn lĩnh vực..."
                      searchPlaceholder="Tìm lĩnh vực..."
                    />
                  </FormItem>
                )}
              />

              {/* Khách hàng */}
              <FormField
                control={form.control as any}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>
                      Khách Hàng{" "}
                      {selectedKh && (
                        <span className="float-right text-[9px] bg-blue-100 text-[#0058bc] px-2 py-0.5 rounded-md font-black italic">
                          {selectedKh.phanLoai === "CHINH_PHU"
                            ? "Chính phủ"
                            : selectedKh.phanLoai === "CONG_AN"
                            ? "Công an"
                            : "Doanh nghiệp"}
                        </span>
                      )}
                    </FieldLabel>
                    <SearchableSelect
                      options={khSearchOptions}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(val) => {
                        field.onChange(Number(val));
                        setSelectedKh(
                          khOptions.find((k) => k.id.toString() === val) || null
                        );
                      }}
                      placeholder="Tìm & chọn khách hàng..."
                      searchPlaceholder="Gõ tên khách hàng..."
                    />
                    <FormMessage className="text-[10px] text-red-500 mt-1" />
                  </FormItem>
                )}
              />

              {/* ═══ HÀNG 2: TÀI CHÍNH & THỜI GIAN ═══ */}
              <FormField
                control={form.control as any}
                name="tongDoanhThuDuKien"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>
                      Tổng Doanh Thu{" "}
                      <span className="float-right text-[9px] text-[#0058bc] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md font-bold">
                        Triệu đ.
                      </span>
                    </FieldLabel>
                    <FormControl>
                      <input
                        type="number"
                        {...field}
                        className="w-full bg-[#f8fbfe] border-none rounded-2xl h-[44px] px-4 text-[#0058bc] font-black text-base focus:ring-2 focus:ring-[#0058bc]/30 outline-none text-right"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="doanhThuTheoThang"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>
                      DT Theo Tháng{" "}
                      <span className="float-right text-[9px] text-slate-400 font-bold italic">
                        Triệu đ./th.
                      </span>
                    </FieldLabel>
                    <FormControl>
                      <input
                        type="number"
                        {...field}
                        placeholder="0"
                        className="w-full bg-[#f8fbfe] border-none rounded-2xl h-[44px] px-4 text-[#0D1F3C] font-black text-base text-right"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="maHopDong"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>Mã Hợp Đồng</FieldLabel>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="VD: MBF-DN-001"
                        className="w-full bg-[#f8fbfe] border-none rounded-2xl h-[44px] px-4 text-[#0D1F3C] font-bold text-sm uppercase placeholder:normal-case"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="ngayBatDau"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>
                      Ngày Bắt Đầu{" "}
                      {timePreview && (
                        <span className="float-right text-[9px] text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          Q{timePreview.quy}/{timePreview.nam}
                        </span>
                      )}
                    </FieldLabel>
                    <FormControl>
                      <input
                        type="date"
                        {...field}
                        className="w-full bg-[#f8fbfe] border-none rounded-2xl h-[44px] px-4 text-[#0D1F3C] font-bold text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* ═══ HÀNG 3: SẢN PHẨM & PHỤ TRÁCH ═══ */}
              <div className="xl:col-span-2">
                <FormField
                  control={form.control as any}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Sản Phẩm & Dịch Vụ</FieldLabel>
                      <SearchableSelect
                        options={spSearchOptions}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(val) => field.onChange(Number(val))}
                        placeholder="Tìm & chọn sản phẩm..."
                        searchPlaceholder="Gõ tên sản phẩm hoặc nhóm..."
                      />
                      <FormMessage className="text-[10px] text-red-500 mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* AM Phụ trách */}
              <FormField
                control={form.control as any}
                name="amId"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>AM Phụ Trách</FieldLabel>
                    <SearchableSelect
                      options={amSearchOptions}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={field.onChange}
                      placeholder="Chọn AM..."
                      searchPlaceholder="Tìm AM..."
                    />
                  </FormItem>
                )}
              />

              {/* Chuyên viên phụ trách */}
              <FormField
                control={form.control as any}
                name="chuyenVienId"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>Chuyên Viên Phụ Trách</FieldLabel>
                    <SearchableSelect
                      options={cvSearchOptions}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={field.onChange}
                      placeholder="Chọn CV..."
                      searchPlaceholder="Tìm chuyên viên..."
                    />
                  </FormItem>
                )}
              />

              {/* ═══ HÀNG 4: HỖ TRỢ & TRẠNG THÁI ═══ */}
              <FormField
                control={form.control as any}
                name="amHoTroId"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>AM Hỗ Trợ</FieldLabel>
                    <SearchableSelect
                      options={allUserWithEmpty}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={field.onChange}
                      placeholder="Chọn AM hỗ trợ..."
                      searchPlaceholder="Tìm nhân viên..."
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="cvHoTro1Id"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>CV Hỗ Trợ 1</FieldLabel>
                    <SearchableSelect
                      options={allUserWithEmpty}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={field.onChange}
                      placeholder="Chọn CV hỗ trợ..."
                      searchPlaceholder="Tìm nhân viên..."
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="cvHoTro2Id"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>CV Hỗ Trợ 2</FieldLabel>
                    <SearchableSelect
                      options={allUserWithEmpty}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={field.onChange}
                      placeholder="Chọn CV hỗ trợ..."
                      searchPlaceholder="Tìm nhân viên..."
                    />
                  </FormItem>
                )}
              />

              {/* Trạng thái */}
              <FormField
                control={form.control as any}
                name="trangThaiHienTai"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>Trạng Thái Khởi Tạo</FieldLabel>
                    <SearchableSelect
                      options={trangThaiOptions}
                      value={String(field.value ?? "")}
                      onValueChange={field.onChange}
                      placeholder="Chọn trạng thái..."
                      searchPlaceholder="Tìm trạng thái..."
                      triggerClassName="bg-gradient-to-r from-[#0058bc] to-[#0070eb] text-white font-black hover:from-[#004da3] hover:to-[#005ed1] shadow-lg shadow-blue-500/20 ring-4 ring-blue-50"
                    />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

// ── Micro-components ────────────────────────────────────────────────
function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="block text-[10px] font-[1000] text-slate-400 uppercase tracking-widest mb-1.5 leading-none">
      {children}
      {required && (
        <span className="text-red-500 ml-1 opacity-70">*</span>
      )}
    </p>
  );
}
