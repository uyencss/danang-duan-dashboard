"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Search, LogOut, User, HelpCircle, Settings, Mail, Menu as MenuIcon, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppRole } from "@/lib/rbac";

interface HeaderProps {
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  menuItems: any[];
}

const roleLabels: Record<string, string> = {
  ADMIN: "Quản trị viên (Admin)",
  AM: "AM",
  CV: "Chuyên viên (CV)",
  USER: "Quản trị viên (Chuyên viên)",
};

export function Header({ user, menuItems }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/du-an?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-[#f7f9fb]/80 backdrop-blur-md border-b border-[#c5c6ce]/30 sticky top-0 z-40">
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile Menu Trigger */}
        <div className="lg:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger 
              render={
                <Button variant="ghost" size="icon" className="text-slate-600">
                  <MenuIcon className="size-6" />
                </Button>
              }
            />
            <SheetContent side="left" className="p-0 border-none w-72 bg-gradient-to-b from-[#0a192f] via-[#0d2a52] to-[#0a192f]">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu điều hướng</SheetTitle>
              </SheetHeader>
              <Sidebar 
                userRole={user.role as AppRole} 
                isCollapsed={false} 
                setIsCollapsed={() => {}} 
                dbMenuItems={menuItems}
                isMobile
                onItemClick={() => setIsOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-[200px] sm:max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Tìm kiếm..."
            className="w-full bg-[#f2f4f6] border-none rounded-full pl-10 pr-4 py-2 text-xs md:text-sm focus:ring-2 focus:ring-[#0058bc] outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-3 text-slate-500">
        <div className="hidden sm:flex">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-slate-100/50 text-slate-500"
          >
            <HelpCircle className="size-5" />
          </Button>
        </div>

        <NotificationBell userId={user.id} />

        <div className="h-8 w-px bg-[#c5c6ce]/30 mx-1 hidden xs:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 md:gap-3 pl-2 cursor-pointer group outline-none">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-[#191c1e] leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-0.5">
                  {roleLabels[user.role] || user.role}
                </p>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#0D1F3C] flex items-center justify-center text-white font-black text-xs md:text-sm ring-2 ring-white overflow-hidden group-hover:ring-[#0058bc] transition-all">
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
                  <p className="text-xs leading-none text-slate-500 truncate">{user.email}</p>
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
