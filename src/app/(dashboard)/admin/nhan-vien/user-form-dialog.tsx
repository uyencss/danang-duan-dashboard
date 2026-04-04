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
import { UserRole } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";
import { createUser, updateUser } from "./actions";

const formSchema = z.object({
  name: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().optional().or(z.literal("")),
  role: z.nativeEnum(UserRole),
  diaBan: z.string().optional().or(z.literal("")),
}).refine((data) => {
    // If not edit, password is required
    return true; // Simplified for this UI
}, {
    message: "Mật khẩu là bắt buộc khi tạo mới",
    path: ["password"],
});

type FormValues = z.infer<typeof formSchema>;

export function UserFormDialog({ open, setOpen, data }: { open: boolean, setOpen: (open: boolean) => void, data?: any }) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!data;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || "",
      email: data?.email || "",
      password: "",
      role: data?.role || UserRole.USER,
      diaBan: data?.diaBan || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!isEdit && !values.password) {
        form.setError("password", { message: "Mật khẩu là bắt buộc" });
        return;
    }
    
    setLoading(true);
    const result = isEdit 
      ? await updateUser(data.id, values) 
      : await createUser(values);

    if (result.success) {
      toast.success(isEdit ? "Cập nhật thành công!" : "Tạo tài khoản thành công!");
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
            {isEdit ? "Sửa tài khoản nhân viên" : "Tạo tài khoản mới"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Họ và Tên *</FormLabel>
                    <FormControl>
                        <Input placeholder="Nguyễn Văn A" {...field} />
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                        <Input placeholder="email@mobifone.vn" {...field} disabled={isEdit} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {!isEdit && (
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mật khẩu mặc định *</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="Tối thiểu 8 ký tự" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Quyền hạn</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value={UserRole.ADMIN}>Quản trị viên (Admin)</SelectItem>
                        <SelectItem value={UserRole.USER}>Nhân viên (User)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="diaBan"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Địa bàn phụ trách</FormLabel>
                    <FormControl>
                        <Input placeholder="Tổ 1 / Hải Châu..." {...field} />
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
              <Button type="submit" disabled={loading}>
                {isEdit ? "Cập nhật" : "Tạo tài khoản"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
