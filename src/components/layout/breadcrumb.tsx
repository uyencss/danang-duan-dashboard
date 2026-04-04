"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#8a8d93]",
        className
      )}
    >
      <Link
        href="/"
        className="hover:text-[#0058bc] transition-colors flex items-center gap-1"
      >
        <Home className="size-3" />
        <span>Dashboard</span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="size-3 opacity-50" />
          {item.href ? (
            <Link href={item.href} className="hover:text-[#0058bc] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#0058bc]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
