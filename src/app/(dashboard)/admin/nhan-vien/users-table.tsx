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
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Lock,
  Unlock,
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
import { UserRole } from "@prisma/client";
import { UserFormDialog } from "./user-form-dialog";
import { toggleUserStatus } from "./actions";
import { toast } from "sonner";

export function UsersTable({ data }: { data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [openForm, setOpenForm] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);

  const handleToggle = async (id: string, current: boolean) => {
    const result = await toggleUserStatus(id, current);
    if (result.success) toast.success("Đã cập nhật trạng thái!");
    else toast.error(result.error);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Họ tên
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col ml-4">
            <span className="font-bold text-gray-800">{row.getValue("name")}</span>
            <span className="text-xs text-gray-400">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Quyền hạn",
      cell: ({ row }) => {
        const role = row.getValue("role") as UserRole;
        return (
          <Badge 
            variant="outline" 
            className={role === "ADMIN" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}
          >
            {role === "ADMIN" ? (
                <><ShieldCheck className="size-3 mr-1" /> Quản trị</>
            ) : (
                <><ShieldAlert className="size-3 mr-1" /> Nhân viên</>
            )}
          </Badge>
        );
      },
    },
    {
      accessorKey: "diaBan",
      header: "Địa bàn",
      cell: ({ row }) => (
        <div className="flex items-center text-xs text-gray-500">
            <MapPin className="size-3 mr-1 text-gray-300" />
            {row.getValue("diaBan") || "Chưa phân công"}
        </div>
      ),
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
            {row.getValue("isActive") ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px] uppercase font-black">Active</Badge>
            ) : (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none text-[10px] uppercase font-black">Locked</Badge>
            )}
        </div>
      ),
    },
    {
        accessorKey: "lastLoginAt",
        header: "Sử dụng cuối",
        cell: ({ row }) => {
            const date = row.getValue("lastLoginAt") as Date;
            return <div className="text-[10px] text-gray-400 font-mono">{date ? new Date(date).toLocaleString('vi-VN') : "Chưa đăng nhập"}</div>;
        }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
               onClick={() => {
                 setSelectedUser(user);
                 setOpenForm(true);
               }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Lock className="mr-2 h-4 w-4" /> Reset mật khẩu
              </DropdownMenuItem>
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
    state: { sorting, columnFilters },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-gray-100 w-full max-sm mb: max-w-sm shadow-sm font-medium">
          <Search className="size-4 text-gray-400 mr-2" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="border-none bg-transparent h-6 focus-visible:ring-0 text-sm shadow-none p-0"
          />
        </div>
        
        <Button 
          className="bg-primary hover:bg-primary/90 font-bold"
          onClick={() => {
            setSelectedUser(null);
            setOpenForm(true);
          }}
        >
          <UserPlus className="mr-2 size-4" /> Tạo tài khoản mới
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-black uppercase text-gray-400">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                  Không tìm thấy tài khoản.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <UserFormDialog 
        open={openForm} 
        setOpen={setOpenForm} 
        data={selectedUser} 
        key={selectedUser?.id || "user-create"}
      />
    </div>
  );
}
