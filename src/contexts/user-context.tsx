"use client";

import { createContext, useContext } from "react";
import type { AppRole } from "@/lib/rbac";
import { canRoleAccess, ROLE_METADATA } from "@/lib/rbac";

export interface UserContextValue {
  id?: string;
  name: string;
  email: string;
  role: AppRole;
  avatarUrl?: string | null;
  canAccess: (route: string) => boolean;
  roleLabel: string;
}

const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  children: React.ReactNode;
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
}

export function UserProvider({ children, user }: UserProviderProps) {
  const role = (user.role as AppRole) || "CV";

  const value: UserContextValue = {
    ...user,
    role,
    canAccess: (route: string) => canRoleAccess(role, route),
    roleLabel: ROLE_METADATA[role]?.label || user.role,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
