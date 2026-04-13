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
import { TrangThaiDuAn, PhanLoaiKH } from "@prisma/client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  createDuAn,
  getKhachHangOptions,
  getSanPhamOptions,
  getSanPhamGroups,
  getUserOptions,
} from "../actions";
import { useRouter } from "next/navigation";
import { extractTimeFields } from "@/lib/utils/time-extract";
import { FileText, CheckCircle, Building2, Package, Users, Calendar, Banknote } from "lucide-react";
import Link from "next/link";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CreatableSelect } from "@/components/ui/creatable-select";

// ── Maps for human-readable labels ──

const PHAN_LOAI_KH_LABELS: Record<string, string> = {
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
  tenDuAn: z.string().min(5, "Tên dự án tối thiểu 5 ký tự"),

  // Customer – either pick existing (customerId) or create new (customerName)
  customerId: z.number().optional(),
  customerName: z.string().optional(),
  customerPhanLoai: z.nativeEnum(PhanLoaiKH).optional(),
  customerDiaChi: z.string().optional(),

  // Product – either pick existing (productId) or create new
  productId: z.number().optional(),
  productNhom: z.string().optional(),
  productTenChiTiet: z.string().optional(),
  productMoTa: z.string().optional(),

  tongDoanhThuDuKien: z.coerce.number().min(0, "Doanh thu không được âm"),
  doanhThuTheoThang: z.coerce.number().default(0),
  maHopDong: z.string().optional().or(z.literal("")),
  ngayBatDau: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  ngayKetThuc: z.string().optional().or(z.literal("")),
  amId: z.string().optional().or(z.literal("")),
  amHoTroId: z.string().optional().or(z.literal("")),
  chuyenVienId: z.string().optional().or(z.literal("")),
  cvHoTro1Id: z.string().optional().or(z.literal("")),
  cvHoTro2Id: z.string().optional().or(z.literal("")),
  trangThaiHienTai: z.nativeEnum(TrangThaiDuAn).optional(),
  isTrongDiem: z.boolean().optional().default(false),
  isKyVong: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProjectForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [khOptions, setKhOptions] = useState<any[]>([]);
  const [spOptions, setSpOptions] = useState<any[]>([]);
  const [spGroups, setSpGroups] = useState<string[]>([]);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [timePreview, setTimePreview] = useState<any>(null);

  // Track whether customer/product is existing or new
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [productMode, setProductMode] = useState<"existing" | "new">("existing");
  const [customerDisplayName, setCustomerDisplayName] = useState("");
  const [productDisplayName, setProductDisplayName] = useState("");

  useEffect(() => {
    async function loadData() {
      const [kh, sp, groups, us] = await Promise.all([
        getKhachHangOptions(),
        getSanPhamOptions(),
        getSanPhamGroups(),
        getUserOptions(),
      ]);
      setKhOptions(kh.data || []);
      setSpOptions(sp.data || []);
      setSpGroups(groups.data || []);
      setUserOptions(us.data || []);
    }
    loadData();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      tenDuAn: "",
      tongDoanhThuDuKien: 0,
      doanhThuTheoThang: 0,
      maHopDong: "",
      ngayBatDau: new Date().toISOString().split("T")[0],
      ngayKetThuc: "",
      customerId: undefined,
      customerName: "",
      customerPhanLoai: "DOANH_NGHIEP" as any,
      customerDiaChi: "",
      productId: undefined,
      productNhom: "",
      productTenChiTiet: "",
      productMoTa: "",
      amId: "",
      amHoTroId: "",
      chuyenVienId: "",
      cvHoTro1Id: "",
      cvHoTro2Id: "",
      trangThaiHienTai: "MOI" as any,
      isTrongDiem: false,
      isKyVong: false,
    } as any,
  });

  const watchNgayBatDau = form.watch("ngayBatDau");
  useEffect(() => {
    if (watchNgayBatDau) {
      setTimePreview(extractTimeFields(watchNgayBatDau));
    }
  }, [watchNgayBatDau]);

  // ── Derived option lists ──


  const phanLoaiKHOptions = useMemo(
    () => Object.entries(PHAN_LOAI_KH_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  const trangThaiOptions = useMemo(
    () => Object.entries(TRANG_THAI_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  const khSearchOptions = useMemo(
    () => khOptions.map((kh) => ({
      value: kh.id.toString(),
      label: kh.ten,
    })),
    [khOptions]
  );

  const spSearchOptions = useMemo(
    () => spOptions.map((sp) => ({
      value: sp.id.toString(),
      label: `[${sp.nhom}] ${sp.tenChiTiet}`,
    })),
    [spOptions]
  );

  // Fixed 7 product group options
  const productGroupOptions = useMemo(
    () => [
      { value: "Dự án", label: "Dự án" },
      { value: "Hoá đơn điện tử", label: "Hoá đơn điện tử" },
      { value: "Chữ ký số", label: "Chữ ký số" },
      { value: "IOC", label: "IOC" },
      { value: "Camera AI", label: "Camera AI" },
      { value: "Cloud", label: "Cloud" },
      { value: "Khác", label: "Khác" },
    ],
    []
  );

  const amSearchOptions = useMemo(
    () => [
      { value: "", label: "--- Trống ---" },
      ...userOptions
        .filter((u) => u.role === "AM")
        .map((u) => ({ value: u.id, label: u.name })),
    ],
    [userOptions]
  );

  const cvSearchOptions = useMemo(
    () => [
      { value: "", label: "--- Trống ---" },
      ...userOptions
        .filter((u) => u.role === "CV" || u.role === "USER")
        .map((u) => ({ value: u.id, label: u.name })),
    ],
    [userOptions]
  );

  const allUserWithEmpty = useMemo(
    () => [
      { value: "", label: "--- Trống ---" },
      ...userOptions.map((u) => ({ value: u.id, label: u.name })),
    ],
    [userOptions]
  );

  // ── Handlers for creating new customer / product inline ──
  const handleSelectExistingCustomer = useCallback((val: string) => {
    const customerId = Number(val);
    form.setValue("customerId", customerId);
    form.setValue("customerName", "");
    setCustomerMode("existing");
    // Auto-fill phanLoai and diaChi from selected customer
    const selected = khOptions.find((k) => k.id === customerId);
    if (selected) {
      setCustomerDisplayName(selected.ten);
      form.setValue("customerPhanLoai", selected.phanLoai);
      form.setValue("customerDiaChi", selected.diaChi || "");
    }
  }, [form, khOptions]);

  const handleCreateNewCustomer = useCallback((name: string) => {
    form.setValue("customerId", undefined);
    form.setValue("customerName", name);
    setCustomerDisplayName(name);
    setCustomerMode("new");
    // Reset phanLoai to default for new customer
    form.setValue("customerPhanLoai", PhanLoaiKH.DOANH_NGHIEP);
    form.setValue("customerDiaChi", "");
  }, [form]);

  const handleSelectExistingProduct = useCallback((val: string) => {
    const productId = Number(val);
    form.setValue("productId", productId);
    setProductMode("existing");
    const selected = spOptions.find((sp) => sp.id === productId);
    if (selected) {
      setProductDisplayName(selected.tenChiTiet);
      // Auto-fill nhóm and mô tả from existing product
      form.setValue("productNhom", selected.nhom || "");
      form.setValue("productTenChiTiet", selected.tenChiTiet || "");
      form.setValue("productMoTa", selected.moTa || "");
    }
  }, [form, spOptions]);

  const handleCreateNewProduct = useCallback((name: string) => {
    form.setValue("productId", undefined);
    form.setValue("productTenChiTiet", name);
    setProductDisplayName(name);
    setProductMode("new");
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    // Validate customer
    if (!values.customerId && !values.customerName) {
      toast.error("Vui lòng chọn hoặc nhập tên khách hàng");
      return;
    }
    // Validate product
    if (!values.productId && (!values.productNhom || !values.productTenChiTiet)) {
      toast.error("Vui lòng chọn sản phẩm hoặc nhập đầy đủ nhóm SP và tên SP chi tiết");
      return;
    }

    setLoading(true);
    const result = await createDuAn(values);
    if (result.success) {
      toast.success("Tạo dự án thành công! Khách hàng và sản phẩm đã được ghi nhận.");
      router.push(`/du-an/${result.id}`);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
        {/* ═══ CARD: CẤU HÌNH DỰ ÁN ═══ */}
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
                  Nhập trực tiếp hoặc chọn từ danh mục có sẵn
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

          <div className="p-8 space-y-8">
            {/* ═══════ SECTION 1: THÔNG TIN DỰ ÁN ═══════ */}
            <div>
              <SectionHeader icon={<FileText className="size-4" />} title="Thông tin dự án" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-4">
                {/* Tên Dự Án */}
                <FormField
                  control={form.control as any}
                  name="tenDuAn"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
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

                {/* Trọng Điểm */}
                <FormField
                  control={form.control as any}
                  name="isTrongDiem"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1 pt-[26px]">
                      <div className="flex items-center justify-center space-x-3 h-[44px] px-5 bg-[#fffaf9] border border-red-100 hover:border-red-200 rounded-2xl cursor-pointer transition-all" onClick={() => field.onChange(!field.value)}>
                        <input 
                          type="checkbox" 
                          checked={!!field.value} 
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="size-5 rounded text-red-600 focus:ring-red-600 outline-none border-red-300 accent-red-600 cursor-pointer"
                        />
                        <span className={`text-base font-[1000] flex items-center gap-2 ${field.value ? 'text-[#e10b17]' : 'text-slate-400'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={field.value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          Trọng điểm
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Kỳ Vọng */}
                <FormField
                  control={form.control as any}
                  name="isKyVong"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1 pt-[26px]">
                      <div className="flex items-center justify-center space-x-3 h-[44px] px-5 bg-[#fafffa] border border-emerald-100 hover:border-emerald-200 rounded-2xl cursor-pointer transition-all" onClick={() => field.onChange(!field.value)}>
                        <input 
                          type="checkbox" 
                          checked={!!field.value} 
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="size-5 rounded text-emerald-600 focus:ring-emerald-600 outline-none border-emerald-300 accent-emerald-600 cursor-pointer"
                        />
                        <span className={`text-base font-[1000] flex items-center gap-2 ${field.value ? 'text-[#059669]' : 'text-slate-400'}`}>
                          <Banknote className="size-5" />
                          Kỳ vọng
                        </span>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ═══════ SECTION 2: KHÁCH HÀNG ═══════ */}
            <div>
              <SectionHeader icon={<Building2 className="size-4" />} title="Thông tin khách hàng" subtitle="Chọn khách hàng có sẵn hoặc nhập mới" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-5 mt-4">
                {/* Khách hàng – Creatable */}
                <FormField
                  control={form.control as any}
                  name="customerId"
                  render={() => (
                    <FormItem>
                      <FieldLabel required>
                        Khách Hàng
                        {customerMode === "new" && (
                          <span className="float-right text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-black">
                            ✨ Mới
                          </span>
                        )}
                      </FieldLabel>
                      <CreatableSelect
                        options={khSearchOptions}
                        value={customerMode === "existing" ? String(form.getValues("customerId") || "") : ""}
                        displayValue={customerDisplayName}
                        onValueChange={handleSelectExistingCustomer}
                        onCreateNew={handleCreateNewCustomer}
                        placeholder="Tìm & chọn hoặc nhập tên KH mới..."
                        searchPlaceholder="Gõ tên khách hàng..."
                        createText="Tạo khách hàng mới"
                        allowCreate={true}
                      />
                      <FormMessage className="text-[10px] text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                {/* Phân loại khách hàng */}
                <FormField
                  control={form.control as any}
                  name="customerPhanLoai"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Phân Loại Khách Hàng</FieldLabel>
                      <SearchableSelect
                        options={phanLoaiKHOptions}
                        value={field.value ? String(field.value) : "DOANH_NGHIEP"}
                        onValueChange={field.onChange}
                        placeholder="Chọn phân loại..."
                        searchPlaceholder="Tìm phân loại..."
                        disabled={customerMode === "existing"}
                      />
                    </FormItem>
                  )}
                />

                {/* Địa chỉ */}
                <FormField
                  control={form.control as any}
                  name="customerDiaChi"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Địa Chỉ</FieldLabel>
                      <FormControl>
                        <input
                          {...field}
                          placeholder="VD: 103 Hùng Vương, Hải Châu..."
                          className="w-full bg-[#f8fbfe] border-none rounded-2xl h-[44px] px-4 text-[#0D1F3C] font-bold text-sm focus:ring-2 focus:ring-[#0058bc]/30 outline-none transition-all placeholder:text-slate-300"
                          disabled={customerMode === "existing"}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ═══════ SECTION 3: SẢN PHẨM ═══════ */}
            <div>
              <SectionHeader icon={<Package className="size-4" />} title="Thông tin sản phẩm / dịch vụ" subtitle="Chọn sản phẩm có sẵn hoặc nhập mới" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-5 mt-4">
                {/* Tên Sản phẩm chi tiết – Creatable */}
                <FormField
                  control={form.control as any}
                  name="productId"
                  render={() => (
                    <FormItem>
                      <FieldLabel required>
                        Tên Sản Phẩm Chi Tiết
                        {productMode === "new" && (
                          <span className="float-right text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-black">
                            ✨ Mới
                          </span>
                        )}
                      </FieldLabel>
                      <CreatableSelect
                        options={spSearchOptions}
                        value={productMode === "existing" ? String(form.getValues("productId") || "") : ""}
                        displayValue={productDisplayName}
                        onValueChange={handleSelectExistingProduct}
                        onCreateNew={handleCreateNewProduct}
                        placeholder="Tìm & chọn hoặc nhập tên SP mới..."
                        searchPlaceholder="Gõ tên sản phẩm..."
                        createText="Tạo sản phẩm mới"
                        allowCreate={true}
                      />
                      <FormMessage className="text-[10px] text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                {/* Nhóm sản phẩm – Fixed 7 options */}
                <FormField
                  control={form.control as any}
                  name="productNhom"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Nhóm Sản Phẩm</FieldLabel>
                      <SearchableSelect
                        options={productGroupOptions}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Chọn nhóm sản phẩm..."
                        searchPlaceholder="Tìm nhóm SP..."
                        disabled={productMode === "existing"}
                      />
                    </FormItem>
                  )}
                />

                {/* Mô tả sản phẩm */}
                <FormField
                  control={form.control as any}
                  name="productMoTa"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Mô Tả Sản Phẩm</FieldLabel>
                      <FormControl>
                        <input
                          {...field}
                          placeholder="Mô tả ngắn gọn về sản phẩm..."
                          className="w-full bg-[#f8fbfe] border-none rounded-2xl h-[44px] px-4 text-[#0D1F3C] font-bold text-sm focus:ring-2 focus:ring-[#0058bc]/30 outline-none transition-all placeholder:text-slate-300"
                          disabled={productMode === "existing"}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ═══════ SECTION 4: TÀI CHÍNH & THỜI GIAN ═══════ */}
            <div>
              <SectionHeader icon={<Banknote className="size-4" />} title="Tài chính & Thời gian" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-5 mt-4">
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

                {/* Ngày kết thúc - NEW */}
                <FormField
                  control={form.control as any}
                  name="ngayKetThuc"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Ngày Kết Thúc</FieldLabel>
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
              </div>
            </div>

            {/* ═══════ SECTION 5: NHÂN SỰ ═══════ */}
            <div>
              <SectionHeader icon={<Users className="size-4" />} title="Nhân sự phụ trách" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-5 mt-4">
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

                <FormField
                  control={form.control as any}
                  name="amHoTroId"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>AM Hỗ Trợ 1</FieldLabel>
                      <SearchableSelect
                        options={amSearchOptions}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={field.onChange}
                        placeholder="Chọn AM hỗ trợ..."
                        searchPlaceholder="Tìm AM hỗ trợ..."
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="cvHoTro1Id"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Chuyên Viên Hỗ Trợ 1</FieldLabel>
                      <SearchableSelect
                        options={cvSearchOptions}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={field.onChange}
                        placeholder="Chọn CV hỗ trợ..."
                        searchPlaceholder="Tìm CV hỗ trợ..."
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="cvHoTro2Id"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Chuyên Viên Hỗ Trợ 2</FieldLabel>
                      <SearchableSelect
                        options={cvSearchOptions}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={field.onChange}
                        placeholder="Chọn CV hỗ trợ..."
                        searchPlaceholder="Tìm CV hỗ trợ..."
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

          {/* Footer Area with duplicate buttons */}
          <div className="px-8 py-6 border-t border-blue-50/50 bg-gradient-to-r from-transparent via-white to-blue-50/40 flex items-center justify-end gap-3">
            <Link
              href="/du-an"
              className="px-8 py-3 rounded-full border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm bg-white shadow-sm"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-3 rounded-full bg-gradient-to-r from-[#0058bc] to-[#00aaff] text-white font-[1000] text-sm shadow-2xl shadow-blue-500/30 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2 border border-white/20"
            >
              <CheckCircle className="size-4" />{" "}
              {loading ? "Đang xử lý..." : "KHỞI TẠO DỰ ÁN"}
            </button>
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

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
      <div className="p-1.5 rounded-lg bg-[#0058bc]/10 text-[#0058bc]">
        {icon}
      </div>
      <div>
        <h4 className="text-[11px] font-[1000] text-[#0058bc] uppercase tracking-wider">{title}</h4>
        {subtitle && (
          <p className="text-[9px] text-slate-400 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
