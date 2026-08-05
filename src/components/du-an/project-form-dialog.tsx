"use client";
// Updated: 2026-04-09 11:20


import { useForm, useWatch } from "react-hook-form";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CreatableSelect } from "@/components/ui/creatable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LinhVuc, PhanLoaiKH, TrangThaiDuAn } from "@prisma/client";
import { useState, useEffect, useCallback, useMemo } from "react";
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
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { SmartDateInput } from "@/components/ui/smart-date-input";


interface FormValues {
  tenDuAn: string;
  linhVuc: LinhVuc;
  tongDoanhThuDuKien: number;
  doanhThuTheoThang: number;
  maHopDong: string;
  ngayBatDau: string;
  customerId?: number;
  productId?: number;
  // Inline new customer
  newCustomerName?: string;
  newCustomerPhanLoai?: PhanLoaiKH;
  newCustomerDiaChi?: string;
  // Inline new product
  newProductTenChiTiet?: string;
  newProductNhom?: string;
  newProductMoTa?: string;

  amId: string;
  amHoTroId: string;
  chuyenVienId: string;
  cvHoTro1Id: string;
  cvHoTro2Id: string;
  trangThaiHienTai: TrangThaiDuAn;
  ngayKetThuc?: string | null;
  isTrongDiem: boolean;
  isKyVong: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  MOI: "Mới",
  DANG_LAM_VIEC: "Đang làm việc",
  DA_DEMO: "Đã demo",
  DA_GUI_BAO_GIA: "Đã gửi báo giá",
  DA_KY_HOP_DONG: "Đã ký hợp đồng",
  THAT_BAI: "Thất bại",
};

const PHAN_LOAI_KH_LABELS: Record<string, string> = {
  CHINH_PHU: "Chính phủ/ Sở ban ngành",
  DOANH_NGHIEP: "Doanh nghiệp",
  CONG_AN: "Công an",
  PHUONG_XA: "Phường xã",
};

const PRODUCT_GROUP_OPTIONS = [
  { value: "Cloud DC", label: "Cloud DC" },
  { value: "An ninh mạng", label: "An ninh mạng" },
  { value: "Giải pháp CNTT", label: "Giải pháp CNTT" },
  { value: "Dự án CĐS KHCP, KHDN lớn", label: "Dự án CĐS KHCP, KHDN lớn" },
  { value: "CNS trong lĩnh vực an ninh", label: "CNS trong lĩnh vực an ninh" },
];

const formSchema = z.object({
  customerId: z.number().optional(),
  productId: z.number().optional(),
  newCustomerName: z.string().optional(),
  newCustomerPhanLoai: z.nativeEnum(PhanLoaiKH).optional(),
  newCustomerDiaChi: z.string().optional(),
  newProductTenChiTiet: z.string().optional(),
  newProductNhom: z.string().optional(),
  newProductMoTa: z.string().optional(),
  amId: z.string(),
  amHoTroId: z.string(),
  chuyenVienId: z.string(),
  cvHoTro1Id: z.string(),
  cvHoTro2Id: z.string(),
  tenDuAn: z.string().min(5, "Tên dự án tối thiểu 5 ký tự"),
  linhVuc: z.nativeEnum(LinhVuc),
  tongDoanhThuDuKien: z.coerce.number().min(0, "Doanh thu không được âm"),
  doanhThuTheoThang: z.coerce.number(),
  maHopDong: z.string(),
  ngayBatDau: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  ngayKetThuc: z.string().optional().nullable().or(z.literal("")),
  trangThaiHienTai: z.nativeEnum(TrangThaiDuAn),
  isTrongDiem: z.boolean(),
  isKyVong: z.boolean(),
});

interface ProjectData {
  id: number;
  tenDuAn: string;
  linhVuc: LinhVuc;
  tongDoanhThuDuKien: number;
  doanhThuTheoThang: number | null;
  maHopDong: string | null;
  ngayBatDau: string | Date;
  customerId: number;
  productId: number;
  amId: string | null;
  amHoTroId: string | null;
  chuyenVienId: string | null;
  cvHoTro1Id: string | null;
  cvHoTro2Id: string | null;
  trangThaiHienTai: TrangThaiDuAn;
  khachHang?: { id: number; ten: string };
  ngayKetThuc?: Date | string | null;
  isTrongDiem?: boolean;
  isKyVong?: boolean;
}

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData;
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [khOptions, setKhOptions] = useState<Array<{ id: number; ten: string; phanLoai: string; diaChi?: string | null }>>([]);
  const [spOptions, setSpOptions] = useState<Array<{ id: number; nhom: string; tenChiTiet: string; moTa?: string | null }>>([]);
  const [userOptions, setUserOptions] = useState<Array<{ id: string; name: string | null; role: string }>>([]);

  // ── Mode tracking for inline creation ──
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [productMode, setProductMode] = useState<"existing" | "new">("existing");
  const [customerDisplayName, setCustomerDisplayName] = useState("");
  const [productDisplayName, setProductDisplayName] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenDuAn: "",
      linhVuc: LinhVuc.CHINH_PHU,
      tongDoanhThuDuKien: 0,
      doanhThuTheoThang: 0,
      maHopDong: "",
      ngayBatDau: new Date().toISOString().split("T")[0],
      customerId: undefined,
      productId: undefined,
      newCustomerName: "",
      newCustomerPhanLoai: PhanLoaiKH.DOANH_NGHIEP,
      newCustomerDiaChi: "",
      newProductTenChiTiet: "",
      newProductNhom: "",
      newProductMoTa: "",
      amId: "",
      amHoTroId: "",
      chuyenVienId: "",
      cvHoTro1Id: "",
      cvHoTro2Id: "",
      trangThaiHienTai: TrangThaiDuAn.MOI,
      ngayKetThuc: "",
      isTrongDiem: false,
      isKyVong: false,
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

  const amOptions = userOptions
    .filter((u) => u.role === "AM")
    .map((u) => ({ value: u.id, label: u.name || "Không rõ" }));

  const cvOptions = userOptions
    .filter((u) => u.role === "CV" || u.role === "USER")
    .map((u) => ({ value: u.id, label: u.name || "Không rõ" }));

  const amSearchOptions = [{ value: "", label: "--- Trống ---" }, ...amOptions];
  const cvSearchOptions = [{ value: "", label: "--- Trống ---" }, ...cvOptions];

  const khSearchOptions = useMemo(() => khOptions.map((kh) => ({
    value: String(kh.id),
    label: kh.ten,
  })), [khOptions]);

  const spSearchOptions = useMemo(() => spOptions.map((sp) => ({
    value: String(sp.id),
    label: `[${sp.nhom}] ${sp.tenChiTiet}`,
  })), [spOptions]);

  const phanLoaiKHOptions = useMemo(
    () => Object.entries(PHAN_LOAI_KH_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  // ── Handlers for switching between existing / new ──
  const handleSelectExistingCustomer = useCallback((val: string) => {
    const id = Number(val);
    form.setValue("customerId", id);
    form.setValue("newCustomerName", "");
    setCustomerMode("existing");
    const selected = khOptions.find((k) => k.id === id);
    if (selected) {
      setCustomerDisplayName(selected.ten);
      form.setValue("newCustomerPhanLoai", selected.phanLoai as PhanLoaiKH);
      form.setValue("newCustomerDiaChi", selected.diaChi || "");
    }
  }, [form, khOptions]);

  const handleCreateNewCustomer = useCallback((name: string) => {
    form.setValue("customerId", undefined);
    form.setValue("newCustomerName", name);
    setCustomerDisplayName(name);
    setCustomerMode("new");
    form.setValue("newCustomerPhanLoai", PhanLoaiKH.DOANH_NGHIEP);
    form.setValue("newCustomerDiaChi", "");
  }, [form]);

  const handleSelectExistingProduct = useCallback((val: string) => {
    const id = Number(val);
    form.setValue("productId", id);
    form.setValue("newProductTenChiTiet", "");
    setProductMode("existing");
    const selected = spOptions.find((sp) => sp.id === id);
    if (selected) {
      setProductDisplayName(`[${selected.nhom}] ${selected.tenChiTiet}`);
      form.setValue("newProductNhom", selected.nhom || "");
      form.setValue("newProductMoTa", selected.moTa || "");
    }
  }, [form, spOptions]);

  const handleCreateNewProduct = useCallback((name: string) => {
    form.setValue("productId", undefined);
    form.setValue("newProductTenChiTiet", name);
    setProductDisplayName(name);
    setProductMode("new");
    form.setValue("newProductNhom", "");
    form.setValue("newProductMoTa", "");
  }, [form]);

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
        newCustomerName: "",
        newCustomerPhanLoai: PhanLoaiKH.DOANH_NGHIEP,
        newCustomerDiaChi: "",
        newProductTenChiTiet: "",
        newProductNhom: "",
        newProductMoTa: "",
        amId: project.amId || "",
        amHoTroId: project.amHoTroId || "",
        chuyenVienId: project.chuyenVienId || "",
        cvHoTro1Id: project.cvHoTro1Id || "",
        cvHoTro2Id: project.cvHoTro2Id || "",
        trangThaiHienTai: project.trangThaiHienTai,
        ngayKetThuc: project.ngayKetThuc ? new Date(project.ngayKetThuc).toISOString().split("T")[0] : "",
        isTrongDiem: project.isTrongDiem || false,
        isKyVong: project.isKyVong || false,
      });
      // Reset modes to "existing" when dialog opens with existing project
      setCustomerMode("existing");
      setProductMode("existing");
      setCustomerDisplayName(project.khachHang?.ten || "");
      setProductDisplayName("");
    }
  }, [project, open, form]);

  const onSubmit = async (values: FormValues) => {
    // Validate: must have either existing customer or new customer name
    if (!values.customerId && !values.newCustomerName?.trim()) {
      toast.error("Vui lòng chọn hoặc tạo mới khách hàng");
      return;
    }
    // Validate: must have either existing product or new product
    if (!values.productId && (!values.newProductTenChiTiet?.trim() || !values.newProductNhom?.trim())) {
      toast.error("Vui lòng chọn sản phẩm hoặc nhập đầy đủ nhóm SP và tên SP chi tiết");
      return;
    }
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

  const watchDate = useWatch({
    control: form.control,
    name: "ngayBatDau",
  });
  const timeInfo = watchDate ? extractTimeFields(watchDate) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl p-0 overflow-hidden rounded-2xl border-none">
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="tenDuAn"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
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
                  name="isTrongDiem"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-1 flex flex-col pt-[26px]">
                      <div className="flex items-center space-x-2 h-10 px-3 bg-red-50/50 border border-red-100 rounded-xl cursor-pointer" onClick={() => field.onChange(!field.value)}>
                        <input 
                          type="checkbox" 
                          checked={!!field.value} 
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="size-4 rounded text-red-600 focus:ring-red-600 outline-none border-red-300 accent-red-600 cursor-pointer"
                        />
                        <span className={`text-sm font-bold flex items-center gap-1.5 ${field.value ? 'text-red-600' : 'text-slate-500'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={field.value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          Trọng điểm
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isKyVong"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-1 flex flex-col pt-[26px]">
                      <div className="flex items-center space-x-2 h-10 px-3 bg-emerald-50/50 border border-emerald-100 rounded-xl cursor-pointer" onClick={() => field.onChange(!field.value)}>
                        <input 
                          type="checkbox" 
                          checked={!!field.value} 
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="size-4 rounded text-emerald-600 focus:ring-emerald-600 outline-none border-emerald-300 accent-emerald-600 cursor-pointer"
                        />
                        <span className={`text-sm font-bold flex items-center gap-1.5 ${field.value ? 'text-emerald-600' : 'text-slate-500'}`}>
                          <Banknote className="size-4" />
                          Kỳ vọng
                        </span>
                      </div>
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
                              {field.value === LinhVuc.CHINH_PHU ? "Chính phủ/ Sở ban ngành" : 
                               field.value === LinhVuc.DOANH_NGHIEP ? "Doanh nghiệp" : 
                               field.value === LinhVuc.CONG_AN ? "Công an" :
                               field.value === LinhVuc.PHUONG_XA ? "Phường xã" : field.value}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={LinhVuc.CHINH_PHU}>Chính phủ/ Sở ban ngành</SelectItem>
                          <SelectItem value={LinhVuc.DOANH_NGHIEP}>Doanh nghiệp</SelectItem>
                          <SelectItem value={LinhVuc.CONG_AN}>Công an</SelectItem>
                          <SelectItem value={LinhVuc.PHUONG_XA}>Phường xã</SelectItem>
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
                            <SelectValue placeholder="Chọn trạng thái">
                              {STATUS_LABELS[field.value] || field.value}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerId"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Khách hàng *
                        {customerMode === "new" && (
                          <span className="float-right text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-black ml-2">
                            ✨ Mới
                          </span>
                        )}
                      </FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productId"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Sản phẩm *
                        {productMode === "new" && (
                          <span className="float-right text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-black ml-2">
                            ✨ Mới
                          </span>
                        )}
                      </FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* ── Inline new customer fields ── */}
              {customerMode === "new" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 pb-2 px-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 mt-2">
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1.5">
                      ✨ Thông tin khách hàng mới: <span className="text-emerald-900">{customerDisplayName}</span>
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="newCustomerPhanLoai"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Phân loại khách hàng</FormLabel>
                        <SearchableSelect
                          options={phanLoaiKHOptions}
                          value={field.value ? String(field.value) : "DOANH_NGHIEP"}
                          onValueChange={field.onChange}
                          placeholder="Chọn phân loại..."
                          searchPlaceholder="Tìm phân loại..."
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newCustomerDiaChi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Địa chỉ</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="VD: 103 Hùng Vương, Hải Châu..."
                            className="rounded-xl h-10 border-slate-200"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* ── Inline new product fields ── */}
              {productMode === "new" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 pb-2 px-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 mt-2">
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1.5">
                      ✨ Thông tin sản phẩm mới: <span className="text-emerald-900">{productDisplayName}</span>
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="newProductNhom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Nhóm sản phẩm *</FormLabel>
                        <SearchableSelect
                          options={PRODUCT_GROUP_OPTIONS}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Chọn nhóm sản phẩm..."
                          searchPlaceholder="Tìm nhóm..."
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newProductMoTa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Mô tả sản phẩm</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Mô tả chi tiết sản phẩm..."
                            className="rounded-xl h-10 border-slate-200"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                 <h4 className="col-span-1 md:col-span-3 text-[10px] font-black uppercase text-[#0058bc]">Nhân sự phụ trách</h4>
                 
                  <FormField
                  control={form.control}
                  name="chuyenVienId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Chuyên viên chủ trì</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={cvSearchOptions}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Chọn CV..."
                          searchPlaceholder="Tìm CV..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                 />

                 <FormField
                  control={form.control}
                  name="cvHoTro1Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Chuyên viên hỗ trợ 1</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={cvSearchOptions}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Chọn CV..."
                          searchPlaceholder="Tìm CV..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                 />

                 <FormField
                  control={form.control}
                  name="cvHoTro2Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Chuyên viên hỗ trợ 2</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={cvSearchOptions}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Chọn CV..."
                          searchPlaceholder="Tìm CV..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                 />

                 <FormField
                  control={form.control}
                  name="amId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">AM phụ trách</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={amSearchOptions}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Chọn AM..."
                          searchPlaceholder="Tìm AM..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                 />

                 <FormField
                  control={form.control}
                  name="amHoTroId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">AM hỗ trợ 1</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={amSearchOptions}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Chọn AM..."
                          searchPlaceholder="Tìm AM..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-6 border-t border-slate-100">
                  <h4 className="col-span-1 md:col-span-5 text-[10px] font-black uppercase text-[#0058bc]">Tài chính & Thời gian</h4>
                  
                  <FormField
                    control={form.control}
                    name="ngayBatDau"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Ngày bắt đầu *</FormLabel>
                        <FormControl>
                          <SmartDateInput 
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="ngày/tháng/năm"
                          />
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
                    name="ngayKetThuc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Ngày kết thúc</FormLabel>
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
                    name="tongDoanhThuDuKien"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Tổng doanh thu (VNĐ)</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" className="rounded-xl h-10 border-slate-200" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doanhThuTheoThang"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">Thu theo tháng (VNĐ)</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" className="rounded-xl h-10 border-slate-200" {...field} />
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
