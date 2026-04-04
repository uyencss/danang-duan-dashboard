"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Search,
  Eye,
  AlertCircle,
  Clock,
  History,
  Building2,
  Package,
  CirclePlay,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import * as React from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrangThaiDuAn, LinhVuc } from "@prisma/client";

import { QuickUpdateModal } from "@/components/du-an/quick-update-modal";

export function ProjectsTable({ data }: { data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [selectedProject, setSelectedProject] = React.useState<any>(null);
  const [openUpdateModal, setOpenUpdateModal] = React.useState(false);

  const columns: ColumnDef<any>[] = [
    // ... existing columns (but I need to use the one-click update button)
    // Wait, I'll update the whole file to make it cleaner.
    {
      accessorKey: "tenDuAn",
      header: "Tên dự án",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 max-w-[280px]">
          <Link 
            href={`/du-an/${row.original.id}`} 
            className="font-bold text-[#003466] hover:text-primary transition-colors truncate"
          >
            {row.getValue("tenDuAn")}
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] py-1 border-gray-100 font-normal">
              {row.original.khachHang.ten}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "sanPham.tenChiTiet",
      header: "Sản phẩm",
      cell: ({ row }) => <div className="text-xs text-gray-500 font-medium">{row.original.sanPham.tenChiTiet}</div>,
    },
    {
      accessorKey: "linhVuc",
      header: "Lĩnh vực",
      cell: ({ row }) => {
        const val = row.getValue("linhVuc") as LinhVuc;
        return (
          <Badge className={cn("text-[10px]", val === "B2B_B2G" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>
            {val === "B2B_B2G" ? "B2B/B2G" : "B2A"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "tongDoanhThuDuKien",
      header: "Doanh thu",
      cell: ({ row }) => <div className="font-mono font-bold text-gray-700">{row.getValue("tongDoanhThuDuKien")} Tr.đ</div>,
    },
    {
      accessorKey: "trangThaiHienTai",
      header: "Trạng thái",
      cell: ({ row }) => {
        const state = row.getValue("trangThaiHienTai") as TrangThaiDuAn;
        const colors: any = {
            MOI: "bg-gray-100 text-gray-600",
            DANG_LAM_VIEC: "bg-blue-100 text-blue-600",
            DA_DEMO: "bg-purple-100 text-purple-600",
            DA_GUI_BAO_GIA: "bg-yellow-100 text-yellow-700",
            DA_KY_HOP_DONG: "bg-green-100 text-green-700",
            THAT_BAI: "bg-red-100 text-red-600",
        };
        const colorClass = colors[state] || "bg-gray-100";
        return <Badge className={cn("text-[10px] font-black border-none px-2", colorClass)}>{state?.replace(/_/g, ' ') || '...'}</Badge>;
      },
    },
    {
      accessorKey: "ngayChamsocCuoiCung",
      header: "CSKH Cuối",
      cell: ({ row }) => {
        const lastDate = row.getValue("ngayChamsocCuoiCung") as Date;
        if (!lastDate) return <Badge variant="destructive" className="animate-pulse">Chưa CSKH</Badge>;
        
        const diff = Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
        const isUrgent = diff > 15;

        return (
          <div className="flex flex-col gap-1">
             <div className="text-[10px] text-gray-400 font-mono">{new Date(lastDate).toLocaleDateString('vi-VN')}</div>
             {isUrgent ? (
                 <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-red-100 text-[9px] px-1 animate-bounce">
                    Cần CS gấp ({diff} ngày)
                 </Badge>
             ) : (
                <div className="text-[9px] text-green-600 font-medium flex items-center">
                    <Clock className="size-2 mr-1" /> {diff} ngày trước
                </div>
             )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="xs" 
                className="text-primary font-bold border-primary/20 hover:bg-primary/5 h-7 rounded-lg"
                onClick={() => {
                    setSelectedProject(row.original);
                    setOpenUpdateModal(true);
                }}
            >
                <History className="size-3 mr-1" /> Update
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon-xs" className="text-gray-400">
                    <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    <Link href={`/du-an/${row.original.id}`} className="flex items-center w-full">
                        <Eye className="size-4 mr-2" /> Chi tiết
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                   className="text-primary focus:text-primary font-bold"
                   onClick={() => {
                        setSelectedProject(row.original);
                        setOpenUpdateModal(true);
                   }}
                >
                    <History className="size-4 mr-2" /> Quick Update
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Filter Section Placeholder */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center bg-white px-4 py-2 rounded-2xl border border-gray-100 w-full max-w-md shadow-sm ring-4 ring-gray-50/50">
          <Search className="size-4 text-gray-400 mr-2" />
          <Input
            placeholder="Tìm theo tên dự án..."
            value={(table.getColumn("tenDuAn")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("tenDuAn")?.setFilterValue(event.target.value)}
            className="border-none bg-transparent h-6 focus-visible:ring-0 text-sm shadow-none p-0"
          />
        </div>

        <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white border-gray-100 text-gray-400 font-normal">
                Hiển thị {data.length} dự án
            </Badge>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-gray-100">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[10px] px-6 py-5 uppercase text-gray-400 font-black tracking-[0.1em]">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-[#F8FAFC] transition-all border-gray-50/50 group">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-gray-400 font-medium italic">
                   🚀 Chưa có dự án nào được khởi tạo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <QuickUpdateModal 
        open={openUpdateModal} 
        setOpen={setOpenUpdateModal} 
        project={selectedProject} 
        key={selectedProject?.id || "quick-update"}
      />
    </div>
  );
}
