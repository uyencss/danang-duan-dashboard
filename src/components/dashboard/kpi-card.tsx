import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  variant?: "default" | "urgent" | "success" | "warning";
}

export function KPICard({ title, value, icon: Icon, description, trend, variant = "default" }: KPICardProps) {
  const iconContainerStyles = {
    default: "bg-[#0058bc]/10 text-[#0058bc]",
    success: "bg-green-500/10 text-green-600",
    warning: "bg-blue-500/10 text-blue-600",
    urgent: "bg-[#ffdad6]/60 text-[#ba1a1a]",
  };

  const badgeStyles = {
    default: "bg-[#0058bc]/5 text-[#0058bc]",
    success: "text-green-600",
    warning: "bg-green-100 text-green-700",
    urgent: "bg-[#ffdad6] text-[#ba1a1a]",
  };

  return (
    <div className={cn(
      "bg-white p-6 rounded-xl shadow-sm border border-[#c5c6ce]/10 hover:shadow-md transition-shadow",
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl", iconContainerStyles[variant])}>
          <Icon className="size-5" />
        </div>
        {trend && (
          <span className={cn("text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1", badgeStyles[variant])}>
            {trend}
          </span>
        )}
        {variant === "warning" && !trend && (
          <span className="text-[10px] font-black uppercase bg-green-100 text-green-700 px-2 py-1 rounded-md">
            Đã ký kết
          </span>
        )}
        {variant === "urgent" && !trend && (
          <span className="text-[10px] font-black uppercase bg-[#ffdad6] text-[#ba1a1a] px-2 py-1 rounded-md">
            Urgent
          </span>
        )}
      </div>
      <p className="text-[#44474d] text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className={cn(
        "text-3xl font-black text-[#191c1e]",
        variant === "urgent" && "text-[#ba1a1a]"
      )}>
        {value}
        {description && <span className="text-lg font-bold text-[#44474d] ml-1">{description.includes("Tr") ? "" : ""}</span>}
      </h3>
      {description && (
        <p className="text-[#44474d] text-xs font-medium mt-1 uppercase tracking-wide">{description}</p>
      )}
    </div>
  );
}
