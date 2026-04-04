"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Search, LogOut, User, HelpCircle, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useState } from "react";

interface HeaderProps {
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
}

const roleLabels: Record<string, string> = {
  ADMIN: "Ban Công Nghệ",
  AM: "Account Manager",
  CV: "Chuyên viên giải pháp",
  USER: "Nhân viên",
};

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          }
        }
      });
      toast.success("Đã đăng xuất thành công!");
    } catch (err) {
      toast.error("Lỗi khi đăng xuất. Vui lòng thử lại.");
    }
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-[#f7f9fb]/80 backdrop-blur-md border-b border-[#c5c6ce]/30 sticky top-0 z-40">
      {/* Search */}
      <div className="flex items-center gap-8 flex-1 max-w-xl">
        <div className="relative w-full max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm dự án, khách hàng..."
            className="w-full bg-[#f2f4f6] border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#0058bc] outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 text-slate-500">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-slate-100/50 text-slate-500"
        >
          <HelpCircle className="size-5" />
        </Button>

        <NotificationBell userId={user.id} />

        <div className="h-8 w-px bg-[#c5c6ce]/30 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 pl-2 cursor-pointer group outline-none">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#191c1e] leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-0.5">
                  {roleLabels[user.role] || user.role}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#0D1F3C] flex items-center justify-center text-white font-black text-sm ring-2 ring-white overflow-hidden group-hover:ring-[#0058bc] transition-all">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-xl border border-[#c5c6ce]/30">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-slate-500">{user.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Tài khoản cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-[#ba1a1a] focus:text-[#ba1a1a] focus:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
