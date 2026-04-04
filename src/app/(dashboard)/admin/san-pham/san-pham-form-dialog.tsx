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
import { useState } from "react";
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
                  <FormControl>
                    <Input placeholder="Ví dụ: Cloud, IOC, mInvoice..." {...field} />
                  </FormControl>
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
