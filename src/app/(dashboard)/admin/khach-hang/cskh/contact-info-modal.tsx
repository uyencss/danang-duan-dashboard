"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Cake,
  Crown,
  CalendarHeart,
  Pencil,
  Phone,
  User2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    ten: string;
    dauMoiTiepCan: string | null;
    soDienThoaiDauMoi: string | null;
    ngaySinhDauMoi: string | null;
    danhSachDauMoi?: any;
    lanhDaoDonVi: string | null;
    soDienThoaiLanhDao: string | null;
    ngaySinhLanhDao: string | null;
    danhSachLanhDao?: any;
    ngayKyNiem: string | null;
  } | null;
  onEdit: () => void;
}

function isHeat(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const m = d.getMonth();
  const currM = now.getMonth();
  const nextM = (currM + 1) % 12;
  return m === currM || m === nextM;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy");
}

export function ContactInfoModal({
  open,
  onOpenChange,
  customer,
  onEdit,
}: ContactInfoModalProps) {
  if (!customer) return null;

  const entries: any[] = [];
  
  if (customer.danhSachDauMoi && Array.isArray(customer.danhSachDauMoi) && customer.danhSachDauMoi.length > 0) {
    customer.danhSachDauMoi.forEach((d: any, idx: number) => {
      entries.push({
        key: `daumoi-${idx}`,
        icon: Cake,
        label: "Đầu mối" + (d.chucVu ? ` - ${d.chucVu}` : ""),
        subLabel: d.hoTen,
        phone: d.soDienThoai,
        date: d.ngaySinh,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-200",
      });
    });
  } else if (customer.dauMoiTiepCan) {
    entries.push({
      key: "daumoi-legacy",
      icon: Cake,
      label: "Đầu mối",
      subLabel: customer.dauMoiTiepCan,
      phone: customer.soDienThoaiDauMoi,
      date: customer.ngaySinhDauMoi,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
    });
  }

  if (customer.danhSachLanhDao && Array.isArray(customer.danhSachLanhDao) && customer.danhSachLanhDao.length > 0) {
    customer.danhSachLanhDao.forEach((d: any, idx: number) => {
      entries.push({
        key: `lanhdao-${idx}`,
        icon: Crown,
        label: "Lãnh đạo" + (d.chucVu ? ` - ${d.chucVu}` : ""),
        subLabel: d.hoTen,
        phone: d.soDienThoai,
        date: d.ngaySinh,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      });
    });
  } else if (customer.lanhDaoDonVi) {
    entries.push({
      key: "lanhdao-legacy",
      icon: Crown,
      label: "Lãnh đạo",
      subLabel: customer.lanhDaoDonVi,
      phone: customer.soDienThoaiLanhDao,
      date: customer.ngaySinhLanhDao,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    });
  }

  entries.push({
    key: "kyniem",
    icon: CalendarHeart,
    label: "Ngày kỷ niệm",
    subLabel: null,
    phone: null,
    date: customer.ngayKyNiem,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-br from-slate-50 to-white border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <User2 className="size-5 text-blue-700" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#191c1e]">
                Thông tin Liên hệ
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Khách hàng:{" "}
                <span className="font-bold text-gray-700">{customer.ten}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3">
          {entries.map((entry) => {
            const hot = isHeat(entry.date);
            const Icon = entry.icon;
            return (
              <div
                key={entry.key}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                  hot
                    ? "bg-amber-50/60 border-amber-200"
                    : entry.date
                    ? `${entry.bgColor} ${entry.borderColor}`
                    : "bg-gray-50 border-gray-100"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-lg shrink-0 mt-0.5",
                    hot ? "bg-amber-200 text-amber-700" : `${entry.bgColor} ${entry.color}`
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      {entry.label}
                    </p>
                    {hot && (
                      <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 font-bold animate-pulse border-none">
                        Sắp tới!
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#191c1e] mt-0.5">
                    {formatDate(entry.date)}
                  </p>
                  {entry.subLabel && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="font-medium">{entry.subLabel}</span>
                      {entry.phone && (
                        <>
                          <span className="text-gray-300">·</span>
                          <Phone className="size-3" />
                          <span>{entry.phone}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t bg-gray-50/50 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-lg font-bold text-gray-500"
          >
            Đóng
          </Button>
          <Button
            size="sm"
            onClick={onEdit}
            className="bg-gradient-to-r from-[#000719] to-[#0d1f3c] text-white rounded-lg font-bold shadow-lg shadow-black/10 hover:scale-[1.02] transition-transform"
          >
            <Pencil className="size-3.5 mr-1.5" />
            Chỉnh sửa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
