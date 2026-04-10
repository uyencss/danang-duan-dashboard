import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardWrapper } from "./dashboard-wrapper";
import { AppRole } from "@/lib/rbac";
import { getMenuItemsForRole } from "@/lib/rbac-server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/login");
    }

    const role = ((session.user as any).role as AppRole) || "USER";
    const menuItems = await getMenuItemsForRole(role);

    return (
      <DashboardWrapper user={session.user as any} menuItems={menuItems}>
        {children}
      </DashboardWrapper>
    );
  } catch (error: any) {
    // If it's a redirect error, let it bubble up
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error("DashboardLayout Error:", error);
    
    // In production, we don't want to show the full stack, but we can return a friendly error UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Lỗi khởi tạo hệ thống</h2>
          <p className="text-slate-600 text-sm mb-6">
            Không thể kết nối với máy chủ dữ liệu hoặc phiên làm việc của bạn đã hết hạn.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}
