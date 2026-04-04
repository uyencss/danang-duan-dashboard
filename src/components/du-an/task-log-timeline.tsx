"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, User as UserIcon, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrangThaiDuAn } from "@prisma/client";

export function TaskLogTimeline({ logs }: { logs: any[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
        <MessageSquareQuote className="size-10 mb-2 opacity-20" />
        <p className="font-medium">Chưa có nhật ký công việc nào.</p>
      </div>
    );
  }

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
    return <Badge className={cn("text-[10px] font-black border-none", colorClass)}>{state?.replace(/_/g, ' ') || '...'}</Badge>;
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
      {logs.map((log, index) => (
        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Dot */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow-md shadow-gray-200/50 text-[#003466] absolute left-0 md:left-1/2 md:-ml-5 z-10 transition-transform group-hover:scale-110 duration-300">
             <Clock className="size-4" />
          </div>

          {/* Content Box */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/20 group-hover:border-primary/20">
             <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(log.ngayGio).toLocaleString('vi-VN')}
                    </span>
                    {getStatusBadge(log.trangThaiMoi)}
                </div>

                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                    <p className="text-gray-700 text-sm font-medium leading-relaxed italic">
                        "{log.noiDungChiTiet}"
                    </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-1">
                    <div className="size-6 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                        <UserIcon className="size-3" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-800">{log.user.name}</span>
                </div>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
