"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DashboardWrapperProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
}

export function DashboardWrapper({ children, user }: DashboardWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Dynamic Sidebar */}
      <Sidebar 
        userRole={user.role as "ADMIN" | "USER"} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />

      {/* Main Container */}
      <div className="flex flex-col flex-1 relative overflow-auto">
        {/* Functional Header */}
        <Header user={user} />

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 p-6 transition-all duration-300",
          "max-w-7xl mx-auto w-full"
        )}>
          {children}
        </main>

        {/* Footer info (optional) */}
        <footer className="py-4 px-6 text-center text-gray-500 text-[10px] uppercase tracking-widest bg-white border-t border-gray-100">
           © 2026 MobiFone Đà Nẵng — Digital Solutions Center
        </footer>
      </div>
    </div>
  );
}
