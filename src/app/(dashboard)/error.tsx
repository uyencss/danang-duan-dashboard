'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6 max-w-lg mx-auto">
      <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
        <AlertCircle className="size-10" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">
          Đã có lỗi xảy ra!
        </h2>
        <p className="text-gray-500 text-sm">
          Hệ thống gặp sự cố khi tải dữ liệu cho trang này. Vui lòng thử lại hoặc liên hệ quản trị viên nếu vẫn không được.
        </p>
        <div className="bg-red-50 p-3 rounded-lg text-xs font-mono text-red-500 text-left overflow-auto max-h-32 border border-red-100 mt-4">
           {error.message || "Unknown error"}
        </div>
      </div>
      
      <div className="flex items-center gap-4 w-full">
        <Button 
          onClick={() => reset()} 
          className="flex-1"
          variant="outline"
        >
          <RotateCcw className="mr-2 size-4" />
          Thử lại
        </Button>
        <Link href="/" className={buttonVariants({ className: "flex-1" })}>
          <Home className="mr-2 size-4" />
          Trang chủ
        </Link>
      </div>
    </div>
  );
}
