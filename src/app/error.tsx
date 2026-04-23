"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our logger or console
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  const isChunkError = error.message.includes('loading chunk') || error.message.includes('ChunkLoadError');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb] p-6">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 p-10 text-center border border-blue-100/50">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-50 rounded-2xl text-red-600 animate-pulse">
            <AlertTriangle className="size-12" />
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-[#191c1e] mb-2">Hệ thống gặp sự cố</h1>
        <p className="text-[#44474d] text-sm mb-8 leading-relaxed">
          Đã có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn. 
          {isChunkError ? " Có vẻ như ứng dụng đã có phiên bản mới, hãy làm mới lại trang." : " Vui lòng thử lại sau hoặc liên hệ quản trị viên."}
        </p>

        {error.digest && (
          <div className="mb-8 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Mã lỗi (Internal ID)</p>
            <p className="text-xs font-mono text-slate-600 truncate">{error.digest}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()}
            className="w-full bg-[#0058bc] hover:bg-blue-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-500/20"
          >
            <RefreshCcw className="mr-2 size-4" />
            Thử lại ngay
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => window.location.reload()}
            className="w-full text-slate-500 hover:text-slate-900 font-medium"
          >
            Tải lại toàn bộ trang
          </Button>
        </div>
        
        <div className="mt-10 pt-6 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            MobiFone DNA  GPS &bull; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
