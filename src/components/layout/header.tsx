"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  LogOut,
  User,
  HelpCircle,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/layout/notification-bell";

interface HeaderProps {
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Đã đăng xuất thành công!");
      router.push("/login");
    } catch (err) {
      toast.error("Lỗi khi đăng xuất. Vui lòng thử lại.");
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200">
      {/* Search / Context Section */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">
          Hệ thống Quản trị Dự án
        </h2>
        <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64 text-gray-400">
          <Search className="size-4 mr-2" />
          <input 
            type="text" 
            placeholder="Tìm kiếm dự án..." 
            className="bg-transparent border-none outline-none text-xs text-gray-700 w-full"
          />
        </div>
      </div>

      {/* Action / User Section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-50">
          <HelpCircle className="size-5" />
        </Button>
        <NotificationBell userId={user.id} />
        
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100 cursor-pointer group">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-gray-700 group-hover:text-primary transition-colors">
                  {user.name}
                </span>
                <Badge 
                  variant={user.role === "ADMIN" ? "destructive" : "secondary"}
                  className="text-[9px] py-0 px-1 border-none bg-opacity-80"
                >
                  {user.role}
                </Badge>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold ring-2 ring-primary/20 group-hover:ring-primary transition-all overflow-hidden bg-gradient-to-tr from-primary to-primary-foreground/30">
                {user.avatarUrl ? (
                   <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Tài khoản cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
