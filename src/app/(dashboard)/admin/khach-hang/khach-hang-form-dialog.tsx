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

const formSchema = z.object({
  ten: z.string().min(2, "Tên khách hàng tối thiểu 2 ký tự"),
  phanLoai: z.nativeEnum(PhanLoaiKH),
  diaChi: z.string().optional(),
  soDienThoai: z.string().optional().or(z.literal("")),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ten: data?.ten || "",
      phanLoai: data?.phanLoai || PhanLoaiKH.CHINH_PHU,
      diaChi: data?.diaChi || "",
      soDienThoai: data?.soDienThoai || "",
      email: data?.email || "",
    },
  });

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            {isEdit ? "Chỉnh sửa Khách hàng" : "Thêm Khách hàng mới"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="ten"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên Khách hàng *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Sở Y tế Đà Nẵng..." {...field} />
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
                  <FormLabel>Phân loại Khách hàng</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phân loại" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PhanLoaiKH.CHINH_PHU}>Chính phủ / Sở Ban Ngành</SelectItem>
                      <SelectItem value={PhanLoaiKH.DOANH_NGHIEP}>Doanh nghiệp tư nhân</SelectItem>
                      <SelectItem value={PhanLoaiKH.CONG_AN}>Công an (B2A)</SelectItem>
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
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập địa chỉ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="soDienThoai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <Input placeholder="Số điện thoại..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email liên hệ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                {isEdit ? "Cập nhật" : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
