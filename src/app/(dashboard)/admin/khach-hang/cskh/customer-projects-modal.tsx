"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { getCustomerProjectsDetails } from "./cskh-actions";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrangThaiDuAn } from "@prisma/client";

const LINH_VUC_LABELS: Record<string, string> = {
  CHINH_PHU: "Chính phủ",
  DOANH_NGHIEP: "Doanh nghiệp",
  CONG_AN: "Công an",
  PHUONG_XA: "Phường xã",
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  MOI: { label: "Mới", className: "bg-blue-100 text-blue-700" },
  DANG_LAM_VIEC: { label: "Đang làm việc", className: "bg-amber-100 text-amber-700" },
  DA_DEMO: { label: "Đã demo", className: "bg-purple-100 text-purple-700" },
  DA_GUI_BAO_GIA: { label: "Đã gửi báo giá", className: "bg-blue-100 text-blue-700" },
  DA_KY_HOP_DONG: { label: "Đã ký hợp đồng", className: "bg-green-100 text-green-700" },
  THAT_BAI: { label: "Thất bại", className: "bg-red-100 text-red-700" },
};

interface CustomerProjectsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number | null;
  customerName: string;
  type: "DANG_THEO_DOI" | "TRONG_DIEM" | "DA_KY" | null;
}

export function CustomerProjectsModal({
  open,
  onOpenChange,
  customerId,
  customerName,
  type,
}: CustomerProjectsModalProps) {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (open && customerId && type) {
      setLoading(true);
      getCustomerProjectsDetails(customerId, type)
        .then((res) => {
          if (res.success && res.data) {
            setProjects(res.data);
          } else {
            setProjects([]);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProjects([]);
    }
  }, [open, customerId, type]);

  let typeLabel = "";
  if (type === "DANG_THEO_DOI") typeLabel = "Đang theo dõi";
  if (type === "TRONG_DIEM") typeLabel = "Trọng điểm";
  if (type === "DA_KY") typeLabel = "Đã ký HĐ";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] w-[98vw] !max-h-[98vh] h-[98vh] flex flex-col p-0 overflow-hidden bg-[#f8f9fb]">
        <DialogHeader className="px-6 py-4 border-b bg-white">
          <DialogTitle className="text-lg font-black text-[#191c1e]">
            Dự án {typeLabel} - <span className="text-[#0058bc]">{customerName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-500">
              <Loader2 className="size-6 animate-spin text-[#0058bc]" />
              <p className="text-sm font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 italic font-medium">
              Không có dự án nào trong mục này.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-auto max-h-[80vh] relative">
                <table className="w-full text-left border-collapse table-auto text-xs md:text-sm">
                  <thead className="bg-gradient-to-r from-[#042654] to-[#0058bc] sticky top-0 z-10 shadow-md">
                    <tr>
                      <th className="py-2.5 px-3 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">#</th>
                      <th className="py-2.5 px-3 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">Tên dự án</th>
                      <th className="py-2.5 px-3 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">Phân loại</th>
                      <th className="py-2.5 px-3 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">Lĩnh vực</th>
                      <th className="py-2.5 px-3 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">Sản phẩm</th>
                      <th className="py-2.5 px-3 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">AM</th>
                      <th className="py-2.5 px-3 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">Chủ trì</th>
                      <th className="py-2.5 px-2 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">Trạng thái</th>
                      <th className="py-2.5 px-2 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">DT dự kiến</th>
                      <th className="py-2.5 px-2 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">DT tháng</th>
                      <th className="py-2.5 px-2 font-extrabold text-[11px] uppercase tracking-wider text-white whitespace-nowrap">Tiến độ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.map((p, index) => {
                      const statusStyle = STATUS_STYLES[p.trangThaiHienTai] || STATUS_STYLES.MOI;
                      const shortStep = p.hienTaiBuoc ? p.hienTaiBuoc.split(":")[0].trim() : null;

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-blue-50/60 transition-colors cursor-pointer group"
                          onClick={() => {
                            onOpenChange(false);
                            router.push(`/du-an/${p.id}`);
                          }}
                        >
                          <td className="py-2.5 px-3 text-slate-400 font-medium group-hover:text-blue-600 transition-colors">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[13px] text-[#191c1e] group-hover:text-[#0058bc] transition-colors leading-tight line-clamp-2 max-w-[200px]">
                              {p.tenDuAn}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col gap-1">
                              {p.isTrongDiem && (
                                <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold w-fit whitespace-nowrap">
                                  Trọng điểm
                                </span>
                              )}
                              {p.isKyVong && (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold w-fit whitespace-nowrap">
                                  Kỳ vọng
                                </span>
                              )}
                              {!p.isTrongDiem && !p.isKyVong && <span className="text-slate-300 text-[10px]">—</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-xs text-[#191c1e] font-medium whitespace-nowrap">
                              {LINH_VUC_LABELS[p.linhVuc] || p.linhVuc}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[11px] md:text-xs text-[#44474d] line-clamp-2 max-w-[150px]" title={p.sanPham?.tenChiTiet}>
                              {p.sanPham?.tenChiTiet}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs">{p.am?.name || "—"}</td>
                          <td className="py-2.5 px-3 text-xs">{p.chuyenVien?.name || "—"}</td>
                          <td className="py-2.5 px-2">
                            <span className={cn("px-2 py-1 rounded text-[11px] font-bold tracking-tight whitespace-nowrap", statusStyle.className)}>
                              {statusStyle.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="text-xs font-bold">{Math.round((p.tongDoanhThuDuKien as number) / 1_000_000).toLocaleString()}</span>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="text-xs font-bold text-[#0058bc]">
                              {Math.round(((p.doanhThuTheoThang as number) || 0) / 1_000_000).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            {shortStep ? (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 whitespace-nowrap">
                                {shortStep}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
