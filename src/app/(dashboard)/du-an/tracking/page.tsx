import { getPendingStepLogs } from "../actions";
import { TrackingTab } from "../tracking-tab";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";

export const metadata = {
  title: "Theo dõi các bước quy trình",
};

export default async function TrackingPage() {
  const sessionRes = await (auth.api as any).getSession({
    headers: await headers()
  });
  const user = sessionRes?.user;

  // Only Admin and Quản trị viên (Chuyên viên) [USER role] can access
  if (!user || !["ADMIN", "USER"].includes(user.role)) {
    redirect("/du-an");
  }

  const { data: pendingLogs } = await getPendingStepLogs();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Quản trị" }, { label: "Theo dõi các bước" }]} />
      
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
          <ClipboardList className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#191c1e] tracking-tight">Theo dõi các bước</h1>
          <p className="text-slate-500 mt-1">Duyệt hoặc từ chối các bước cập nhật quy trình từ nhân viên.</p>
        </div>
      </div>

      <TrackingTab initialData={pendingLogs || []} />
    </div>
  );
}
