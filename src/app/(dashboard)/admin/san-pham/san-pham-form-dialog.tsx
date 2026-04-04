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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createSanPham, updateSanPham } from "./actions";

const formSchema = z.object({
  nhom: z.string().min(2, "Nhóm sản phẩm tối thiểu 2 ký tự"),
  tenChiTiet: z.string().min(2, "Tên chi tiết tối thiểu 2 ký tự"),
  moTa: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function SanPhamFormDialog({ open, setOpen, data }: { open: boolean, setOpen: (open: boolean) => void, data?: any }) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!data;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nhom: data?.nhom || "",
      tenChiTiet: data?.tenChiTiet || "",
      moTa: data?.moTa || "",
    },
  });

  // Update form when data changes (for edit mode)
  useEffect(() => {
    if (data) {
      form.reset({
        nhom: data.nhom,
        tenChiTiet: data.tenChiTiet,
        moTa: data.moTa || "",
      });
    } else {
      form.reset({
        nhom: "",
        tenChiTiet: "",
        moTa: "",
      });
    }
  }, [data, form]);

  const nhomOptions = [
    "Dự án",
    "Hoá đơn điện tử",
    "Chữ ký số",
    "IOC",
    "Camera AI",
    "Cloud",
    "Khác"
  ];

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const result = isEdit 
      ? await updateSanPham(data.id, values) 
      : await createSanPham(values);

    if (result.success) {
      toast.success(isEdit ? "Cập nhật thành công!" : "Tạo sản phẩm thành công!");
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
            {isEdit ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm mới"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nhom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhóm Sản phẩm *</FormLabel>
                  <Select 
                    key={field.name + (isEdit ? "-edit" : "-new")}
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Chọn nhóm sản phẩm..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {nhomOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tenChiTiet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên Sản phẩm Chi tiết *</FormLabel>
                  <FormControl>
                    <Input placeholder="Tên sản phẩm..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moTa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả sản phẩm</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Mô tả tóm tắt tính năng..." 
                      className="min-h-[100px] bg-gray-50 border-gray-100" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {isEdit ? "Cập nhật" : "Lưu sản phẩm"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
