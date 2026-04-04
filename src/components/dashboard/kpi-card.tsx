import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  variant?: "default" | "urgent" | "success" | "warning";
}

export function KPICard({ title, value, icon: Icon, description, trend, variant = "default" }: KPICardProps) {
  const variantStyles = {
    default: "bg-white border-gray-100 shadow-sm shadow-gray-200/50",
    urgent: "bg-red-50 border-red-100 shadow-xl shadow-red-100/50 ring-2 ring-red-500/20 animate-in zoom-in-95 duration-500",
    success: "bg-green-50 border-green-100 shadow-xl shadow-green-100/50",
    warning: "bg-yellow-50 border-yellow-100 shadow-xl shadow-yellow-100/50",
  };

  const iconStyles = {
    default: "bg-blue-100 text-blue-600",
    urgent: "bg-red-200 text-red-700 animate-pulse",
    success: "bg-green-200 text-green-700",
    warning: "bg-yellow-200 text-yellow-700",
  };

  return (
    <Card className={cn("rounded-[2.5rem] border-none overflow-hidden transition-all hover:scale-[1.02] duration-300", variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className={cn("text-xs font-black uppercase tracking-[0.2em] opacity-60", variant === "urgent" ? "text-red-900/40" : "text-gray-400")}>
          {title}
        </CardTitle>
        <div className={cn("p-3 rounded-2xl", iconStyles[variant])}>
            <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-black tracking-tighter leading-none", variant === "urgent" ? "text-red-700" : "text-[#003466]")}>
            {value}
        </div>
        
        <div className="flex items-center gap-2 mt-4">
            {trend && (
                <div className="flex items-center text-[10px] font-black text-green-600 bg-green-100 px-1.5 py-0.5 rounded-lg">
                    <TrendingUp className="size-3 mr-1" /> {trend}
                </div>
            )}
            {description && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                    {description}
                </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
