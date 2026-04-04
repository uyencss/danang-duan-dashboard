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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LinhVuc } from "@prisma/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createDuAn, getKhachHangOptions, getSanPhamOptions, getUserOptions } from "../actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { extractTimeFields } from "@/lib/utils/time-extract";

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

  useEffect(() => {
    async function loadData() {
        const [kh, sp, us] = await Promise.all([
          getKhachHangOptions(),
          getSanPhamOptions(),
          getUserOptions()
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="bg-gray-50/50 rounded-t-2xl">
                <CardTitle className="text-lg text-primary">Thông tin chung</CardTitle>
                <CardDescription>Nhập tiêu đề dự án và phân loại lĩnh vực.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="tenDuAn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên Dự án *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên dự án..." className="font-bold text-gray-800" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="linhVuc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lĩnh vực</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn lĩnh vực" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={LinhVuc.B2B_B2G}>B2B/B2G (Cloud, IT...)</SelectItem>
                            <SelectItem value={LinhVuc.B2A}>B2A (Police / Public Sector)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tongDoanhThuDuKien"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doanh thu dự kiến (Triệu VNĐ) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="bg-gray-50/50 rounded-t-2xl">
                <CardTitle className="text-lg text-primary">Dữ liệu Master</CardTitle>
                <CardDescription>Liên kết dự án với Khách hàng và Sản phẩm hiện có.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Khách hàng *</FormLabel>
                        <Select onValueChange={(val) => field.onChange(Number(val))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn khách hàng" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {khOptions.map(kh => (
                                <SelectItem key={kh.id} value={kh.id.toString()}>
                                    {kh.ten} ({kh.phanLoai})
                                </SelectItem>
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
                        <FormLabel>Sản phẩm dịch vụ *</FormLabel>
                        <Select onValueChange={(val) => field.onChange(Number(val))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn sản phẩm" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {spOptions.map(sp => (
                                <SelectItem key={sp.id} value={sp.id.toString()}>
                                    [{sp.nhom}] {sp.tenChiTiet}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="bg-gray-50/50 rounded-t-2xl">
                <CardTitle className="text-lg text-primary font-black">Thời gian</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                 <FormField
                    control={form.control}
                    name="ngayBatDau"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày bắt đầu dự án *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {timePreview && (
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 text-xs text-blue-700 flex flex-wrap gap-2">
                         <span className="font-bold">Hệ thống ghi nhận:</span>
                         <Badge variant="outline" className="text-[10px] bg-white">Tuần {timePreview.tuan}</Badge>
                         <Badge variant="outline" className="text-[10px] bg-white">Tháng {timePreview.thang}</Badge>
                         <Badge variant="outline" className="text-[10px] bg-white">Quý {timePreview.quy}</Badge>
                         <Badge variant="outline" className="text-[10px] bg-white">Năm {timePreview.nam}</Badge>
                      </div>
                  )}
              </CardContent>
            </Card>

            <Card className="border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="bg-gray-50/50 rounded-t-2xl">
                <CardTitle className="text-lg text-primary font-black">Nhân sự phụ trách</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                 <FormField
                    control={form.control}
                    name="amId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AM phụ trách *</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn AM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             {userOptions.map(u => (
                                 <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                             ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="chuyenVienId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chuyên viên hỗ trợ</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn chuyên viên (nếu có)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value="none">--- Không có ---</SelectItem>
                             {userOptions.map(u => (
                                 <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                             ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </CardContent>
            </Card>

            <Button type="submit" className="w-full h-12 text-lg font-black bg-primary shadow-lg shadow-primary/20 rounded-2xl" disabled={loading}>
              {loading ? "Đang xử lý..." : "Tạo Dự án Mới"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
