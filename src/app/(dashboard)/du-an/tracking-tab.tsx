"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Check, X, Eye, User, Calendar, ClipboardCheck, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { approveStep, rejectStep } from "./actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TrackingTab({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleApprove = async (logId: number) => {
    setLoadingId(logId);
    const res = await approveStep(logId);
    if (res.success) {
      toast.success("Đã duyệt bước quy trình!");
      setData(prev => prev.filter(item => item.id !== logId));
    } else {
      toast.error(res.error);
    }
    setLoadingId(null);
  };

  const handleReject = async (logId: number) => {
    const reason = prompt("Nhập lý do từ chối cập nhật này:");
    if (reason === null) return;

    setLoadingId(logId);
    const res = await rejectStep(logId, reason);
    if (res.success) {
      toast.info("Đã từ chối cập nhật.");
      setData(prev => prev.filter(item => item.id !== logId));
    } else {
      toast.error(res.error);
    }
    setLoadingId(null);
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
        <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <ClipboardCheck className="size-8 text-gray-300" />
        </div>
        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Hiện không có bước nào chờ duyệt</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((log) => (
        <div 
          key={log.id} 
          className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">
              Chờ duyệt
            </div>
            <Link 
              href={`/du-an/${log.projectId}`}
              className="size-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Eye className="size-4" />
            </Link>
          </div>

          <h3 className="text-lg font-black text-[#191c1e] line-clamp-1 mb-1">
            {log.duAn?.tenDuAn}
          </h3>
          
          <div className="mb-4">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md italic">
               {log.buoc}
            </span>
          </div>

          <div className="space-y-2 mb-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 italic text-gray-600 text-sm">
             "{log.noiDungChiTiet}"
          </div>

          {log.files && log.files.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tệp đính kèm ({log.files.length})</p>
              {log.files.map((file: any) => (
                <a 
                  key={file.id}
                  href={`/api/uploads/${(file as any).filePath || (file as any).url?.replace('/uploads/', '')}`}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 px-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group/file"
                >
                  <History className="size-3 text-blue-500" />
                  <span className="text-[11px] font-bold text-gray-600 truncate flex-1 group-hover/file:text-blue-600">
                    {file.name}
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 mb-6 text-[11px] font-medium text-gray-400">
             <div className="flex items-center gap-1">
                <User className="size-3" /> {log.user?.name}
             </div>
             <div className="flex items-center gap-1">
                <Calendar className="size-3" /> {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
             <Button 
               className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl h-10 shadow-lg shadow-green-500/20"
               onClick={() => handleApprove(log.id)}
               disabled={loadingId === log.id}
             >
                <Check className="size-4 mr-2" /> Duyệt
             </Button>
             <Button 
               variant="outline"
               className="border-red-100 text-red-600 hover:bg-red-50 font-bold rounded-xl h-10"
               onClick={() => handleReject(log.id)}
               disabled={loadingId === log.id}
             >
                <X className="size-4 mr-2" /> Từ chối
             </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
