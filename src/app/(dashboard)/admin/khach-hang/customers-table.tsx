"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { PhanLoaiKH } from "@prisma/client";
import { KhachHangFormDialog } from "./khach-hang-form-dialog";
import { toggleKhachHangStatus, deleteKhachHang } from "./actions";
import { toast } from "sonner";
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

export function CustomersTable({ data }: { data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [openForm, setOpenForm] = React.useState(false);
  const [selectedKH, setSelectedKH] = React.useState<any>(null);

  const handleDelete = async (id: number) => {
    const result = await deleteKhachHang(id);
    if (result.success) {
      toast.success("Đã xóa khách hàng thành công!");
    } else {
      toast.error(result.error);
    }
  };

  const handleToggle = async (id: number, current: boolean) => {
    const result = await toggleKhachHangStatus(id, !current);
    if (result.success) {
      toast.success("Đã cập nhật trạng thái!");
    } else {
      toast.error(result.error);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "ten",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Tên Khách hàng
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-bold text-gray-800 ml-4 max-w-[200px] truncate">{row.getValue("ten")}</div>,
    },
    {
      accessorKey: "phanLoai",
      header: "Phân loại",
      cell: ({ row }) => {
        const type = row.getValue("phanLoai") as PhanLoaiKH;
        return (
          <Badge 
            variant="outline" 
            className={
              type === "CHINH_PHU" ? "bg-blue-50 text-blue-700 border-blue-200" :
              type === "CONG_AN" ? "bg-red-50 text-red-700 border-red-200" : 
              "bg-green-50 text-green-700 border-green-200"
            }
          >
            {type === "CHINH_PHU" ? "Chính phủ" : type === "CONG_AN" ? "Công an" : "Doanh nghiệp"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "diaChi",
      header: "Địa chỉ",
      cell: ({ row }) => <div className="text-gray-500 text-xs truncate max-w-[150px]">{row.getValue("diaChi") || "---"}</div>,
    },
    {
      accessorKey: "soDienThoai",
      header: "Liên hệ",
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium">{row.getValue("soDienThoai") || "---"}</span>
          <span className="text-gray-400 font-normal">{row.original.email || ""}</span>
        </div>
      ),
    },
    {
      accessorKey: "_count.duAns",
      header: "Dự án",
      cell: ({ row }) => <Badge variant="secondary" className="font-mono">{row.original._count.duAns}</Badge>,
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch 
            checked={row.getValue("isActive")} 
            onCheckedChange={() => handleToggle(row.original.id, row.original.isActive)} 
          />
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const kh = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
               className="cursor-pointer"
               onClick={() => {
                 setSelectedKH(kh);
                 setOpenForm(true);
               }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger>
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Xóa Client
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                   <AlertDialogHeader>
                      <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Thao tác này không thể hoàn tác. Khách hàng <strong>{kh.ten}</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        Nếu khách hàng còn dự án liên quan, bạn sẽ không thể thực hiện thao tác này.
                      </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 focus:ring-red-600" onClick={() => handleDelete(kh.id)}>
                        Xác nhận xóa
                      </AlertDialogAction>
                   </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-gray-100 w-full max-w-sm shadow-sm">
          <Search className="size-4 text-gray-400 mr-2" />
          <Input
            placeholder="Tìm tên khách hàng..."
            value={(table.getColumn("ten")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("ten")?.setFilterValue(event.target.value)}
            className="border-none bg-transparent h-6 focus-visible:ring-0 text-sm shadow-none p-0"
          />
        </div>
        
        <div className="flex items-center gap-3">
           <Button 
            className="bg-primary hover:bg-primary/90 font-bold shadow-md rounded-xl"
            onClick={() => {
              setSelectedKH(null);
              setOpenForm(true);
            }}
           >
             <Plus className="mr-2 size-4" /> Thêm Khách hàng
           </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50/30 transition-colors border-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-400 italic">
                  Không tìm thấy kết quả phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-gray-500">
          Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} của {data.length} khách hàng
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg h-8 border-gray-200"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg h-8 border-gray-200"
          >
            Sau
          </Button>
        </div>
      </div>

      <KhachHangFormDialog 
        open={openForm} 
        setOpen={setOpenForm} 
        data={selectedKH} 
        key={selectedKH?.id || "create"} 
      />
    </div>
  );
}
