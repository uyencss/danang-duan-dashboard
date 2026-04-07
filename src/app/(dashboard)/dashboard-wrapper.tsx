"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/auth-utils";

interface DashboardWrapperProps {
  children: React.ReactNode;
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
}

export function DashboardWrapper({ children, user }: DashboardWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Sidebar */}
      <Sidebar
        userRole={user.role as AppRole}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <Header user={user} />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
