import { getDuAnList } from "./actions";
import { ProjectsTable } from "./projects-table";
import { PlusCircle, Filter, Package2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function DuAnPage({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  // Await search params for Next.js 16
  const params = await searchParams;

  const filters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    phanLoaiKH: typeof params.phanLoaiKH === 'string' ? params.phanLoaiKH : undefined,
    productId: typeof params.productId === 'string' ? params.productId : undefined,
    trangThai: typeof params.trangThai === 'string' ? params.trangThai : undefined,
    linhVuc: typeof params.linhVuc === 'string' ? params.linhVuc : undefined,
    amId: typeof params.amId === 'string' ? params.amId : undefined,
  };

  const { data = [], error } = await getDuAnList(filters);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 border-b border-gray-100 pb-8">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="size-10 bg-gradient-to-br from-primary to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Package2 className="size-6" />
               </div>
               <h1 className="text-4xl font-black tracking-tighter text-[#003466]">Kho Dự án MobiFone</h1>
            </div>
            <p className="text-gray-500 font-medium pl-14">
                Hệ thống Quản trị Báo cáo Dự án Tập trung - MobiFone Đà Nẵng
            </p>
        </div>

        <div className="flex items-center gap-3 pl-14 md:pl-0">
             <Link 
                href="/du-an/tao-moi" 
                className={cn(buttonVariants({ variant: "default" }), "bg-primary shadow-lg shadow-primary/20 rounded-2xl font-bold h-12")}
             >
                <PlusCircle className="mr-2 size-5" /> Khởi tạo Dự án
             </Link>
        </div>
      </div>

      {/* Main Table Interface */}
      {error ? (
        <div className="p-16 text-center bg-red-50 text-red-500 rounded-[2rem] border border-red-200 shadow-xl shadow-red-100/50">
           <AlertCircle className="size-12 mx-auto mb-4 opacity-50" />
           <p className="font-black text-xl">Rất tiếc, đã có lỗi xảy ra</p>
           <p className="text-sm font-medium opacity-80">{error}</p>
        </div>
      ) : (
        <ProjectsTable data={data} />
      )}
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
