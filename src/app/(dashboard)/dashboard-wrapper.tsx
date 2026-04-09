"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PrefetchRoutes } from "@/components/layout/prefetch-routes";
import { UserProvider } from "@/contexts/user-context";
import { useState } from "react";
import type { AppRole } from "@/lib/rbac";

interface DashboardWrapperProps {
  children: React.ReactNode;
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  menuItems: any[];
}

export function DashboardWrapper({ children, user, menuItems }: DashboardWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <UserProvider user={user}>
      <div className="flex h-screen overflow-hidden bg-transparent">
        <Sidebar
          userRole={user.role as AppRole}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          dbMenuItems={menuItems}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header user={user} />

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-screen-2xl mx-auto">
              {children}
            </div>
          </main>
          <PrefetchRoutes />
        </div>
      </div>
    </UserProvider>
  );
}
