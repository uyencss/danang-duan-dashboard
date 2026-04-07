"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { createUser, updateUser, deleteUser } from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  email: z.string().min(1, "Tên đăng nhập là bắt buộc"),
  password: z.string().optional().or(z.literal("")),
  role: z.nativeEnum(UserRole),
  diaBan: z.string().optional().or(z.literal("")),
  banned: z.boolean(),
  banReason: z.string().optional().or(z.literal("")),
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
      password: data ? "" : "123456",
      role: data?.role || UserRole.USER,
      diaBan: data?.diaBan || "",
      banned: data?.banned || false,
      banReason: data?.banReason || "",
    },
  });

  // Use useEffect to reset form when data or open state changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: data?.name || "",
        email: data?.email || "",
        password: data ? "" : "123456",
        role: data?.role || UserRole.USER,
        diaBan: data?.diaBan || "",
        banned: data?.banned || false,
        banReason: data?.banReason || "",
      });
    }
  }, [open, data, form]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormLabel>Tên đăng nhập *</FormLabel>
                    <FormControl>
                        <Input placeholder="Nhập tên/SĐT/Email" {...field} />
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
                        <Input type="password" placeholder="Mật khẩu mặc định" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={"ADMIN" as any}>Quản trị viên (Admin)</SelectItem>
                          <SelectItem value={"USER" as any}>Quản trị viên (Chuyên viên)</SelectItem>
                          <SelectItem value={"AM" as any}>AM</SelectItem>
                          <SelectItem value={"CV" as any}>Chuyên viên (CV)</SelectItem>
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
                    <FormLabel>Tổ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn tổ" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Tổ nghiệp vụ">Tổ nghiệp vụ</SelectItem>
                          <SelectItem value="Tổ dự án">Tổ dự án</SelectItem>
                          <SelectItem value="Tổ kỹ thuật">Tổ kỹ thuật</SelectItem>
                          <SelectItem value="Tổ 1">Tổ 1</SelectItem>
                          <SelectItem value="Tổ 2">Tổ 2</SelectItem>
                          <SelectItem value="Tổ 3">Tổ 3</SelectItem>
                          <SelectItem value="Lãnh đạo">Lãnh đạo</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {isEdit && (
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                    <FormField
                    control={form.control}
                    name="banned"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                            <div className="space-y-0.5">
                                <FormLabel className="font-bold text-red-700">Khóa tài khoản (Ban)</FormLabel>
                                <p className="text-[10px] text-gray-500">Người dùng sẽ không thể đăng nhập</p>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-red-600"
                                />
                            </FormControl>
                        </FormItem>
                    )}
                    />

                    {form.watch("banned") && (
                        <FormField
                        control={form.control}
                        name="banReason"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-bold">Lý do khóa</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Vi phạm quy định / Nghỉ việc / ..." 
                                    className="bg-white"
                                    {...field} 
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    )}
                </div>
            )}

            {isEdit && (
              <div className="mt-8 pt-6 border-t border-red-100 bg-red-50/30 -mx-6 px-6 rounded-b-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-red-700 flex items-center gap-2">
                      <AlertTriangle className="size-4" /> Khu vực nguy hiểm
                    </h4>
                    <p className="text-xs text-red-600/80">
                      Xóa vĩnh viễn tài khoản này khỏi hệ thống. Thao tác này không thể hoàn tác.
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger
                      nativeButton={true}
                      render={
                        <Button type="button" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-100 rounded-xl font-bold h-9 px-4 flex items-center gap-2 border border-red-200" />
                      }
                    >
                        <Trash2 className="size-4" /> Xóa tài khoản
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-red-100">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-red-700">Xác nhận xóa tài khoản?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500">
                          Bạn đang thực hiện xóa tài khoản của <span className="font-bold text-gray-900">{data?.name}</span>. 
                          Hành động này sẽ xóa vĩnh viễn quyền truy cập và dữ liệu liên quan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl font-bold">Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700 rounded-xl font-black shadow-lg shadow-red-200"
                          onClick={async () => {
                            setLoading(true);
                            const res = await deleteUser(data.id);
                            if (res.success) {
                              toast.success("Đã xóa tài khoản vĩnh viễn");
                              setOpen(false);
                            } else {
                              toast.error(res.error);
                            }
                            setLoading(false);
                          }}
                        >
                          Xác nhận xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            <DialogFooter className="pt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="rounded-xl h-11 font-bold px-6">
                Hủy
              </Button>
              <Button type="submit" disabled={loading} className="rounded-xl h-11 font-black px-8 bg-primary shadow-lg shadow-primary/20">
                {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Tạo tài khoản"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
