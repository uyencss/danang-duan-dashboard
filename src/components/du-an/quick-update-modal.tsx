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
  DialogDescription,
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
import { TrangThaiDuAn } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";
import { createTaskLog } from "@/app/(dashboard)/du-an/actions";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, History } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  trangThaiMoi: z.nativeEnum(TrangThaiDuAn),
  noiDungChiTiet: z.string().min(10, "Vui lòng nhập tối thiểu 10 ký tự nội dung"),
  ngayGio: z.string(),
});

export function QuickUpdateModal({ 
  open, 
  setOpen, 
  project 
}: { 
  open: boolean, 
  setOpen: (open: boolean) => void, 
  project: any 
}) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trangThaiMoi: project?.trangThaiHienTai || TrangThaiDuAn.MOI,
      noiDungChiTiet: "",
      ngayGio: new Date().toISOString().substring(0, 16),
    },
  });

  const onSubmit = async (values: any) => {
    setLoading(true);
    const result = await createTaskLog({
        projectId: project.id,
        trangThaiMoi: values.trangThaiMoi,
        noiDungChiTiet: values.noiDungChiTiet,
        ngayGio: new Date(values.ngayGio),
    });

    if (result.success) {
      toast.success("Cập nhật tiến độ thành công!");
      setOpen(false);
      form.reset();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const getStatusBadge = (state: TrangThaiDuAn) => {
    if (!state) return null;
    const colors: any = {
        MOI: "bg-gray-100 text-gray-600",
        DANG_LAM_VIEC: "bg-blue-100 text-blue-600",
        DA_DEMO: "bg-purple-100 text-purple-600",
        DA_GUI_BAO_GIA: "bg-yellow-100 text-yellow-700",
        DA_KY_HOP_DONG: "bg-green-100 text-green-700",
        THAT_BAI: "bg-red-100 text-red-600",
    };
    const colorClass = colors[state] || "bg-gray-100 text-gray-600";
    return <Badge className={cn("text-[10px] h-5", colorClass)}>{state?.replace(/_/g, ' ') || '...'}</Badge>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-[#003466] flex items-center gap-2">
            <History className="size-6 text-primary" /> Cập nhật Tiến độ
          </DialogTitle>
          <DialogDescription className="font-medium text-gray-500 pt-1">
             Dự án: <span className="text-gray-900 font-bold">{project?.tenDuAn}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 justify-center">
            <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Hiện tại</span>
                {getStatusBadge(project?.trangThaiHienTai)}
            </div>
            <ArrowRight className="size-4 text-gray-300 mx-2" />
            <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Mới</span>
                {getStatusBadge(form.watch("trangThaiMoi"))}
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="trangThaiMoi"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Chuyển trạng thái sang</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {Object.values(TrangThaiDuAn).map(state => (
                                <SelectItem key={state} value={state}>{state.replace(/_/g, ' ')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="ngayGio"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Ngày giờ thực hiện</FormLabel>
                    <FormControl>
                        <Input type="datetime-local" {...field} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="noiDungChiTiet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung chi tiết *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Mô tả công việc đã thực hiện, kết quả đạt được hoặc khó khăn..." 
                      className="min-h-[120px] bg-white rounded-xl" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="font-bold">
                Bỏ qua
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 font-black h-12 px-8 rounded-2xl shadow-lg shadow-primary/20">
                {loading ? "Đang lưu..." : "Xác nhận & Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
