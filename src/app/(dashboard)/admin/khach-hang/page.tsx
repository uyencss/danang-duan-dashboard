import { requireAuth } from "@/lib/auth-utils";
import { getCSKHData, getLeaderOptions, syncPhanLoaiFromDuAn } from "./cskh/cskh-actions";
import { CSKHClient } from "./cskh/cskh-client";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { HeartHandshake } from "lucide-react";

export const metadata = {
  title: "CSKH — Chăm sóc Khách hàng",
};

export const dynamic = "force-dynamic";

export default async function KhachHangPage() {
  await requireAuth();

  // Auto-sync phanLoai from DuAn.linhVuc (fixes any drift)
  await syncPhanLoaiFromDuAn().catch(() => {});

  const [cskhResult, leaderResult] = await Promise.all([
    getCSKHData(),
    getLeaderOptions(),
  ]);

  const data = cskhResult?.data ?? [];
  const leaders = leaderResult?.data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <Breadcrumb
        items={[
          { label: "Danh mục" },
          { label: "Khách hàng" },
        ]}
      />

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-rose-500/10 to-orange-500/10 text-rose-600 rounded-xl">
          <HeartHandshake className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#191c1e]">
            CSKH — Chăm sóc Khách hàng
          </h1>
          <p className="text-[#44474d] text-sm mt-0.5">
            Quản lý, theo dõi chăm sóc và phân công lãnh đạo theo dõi khách hàng
          </p>
        </div>
      </div>

      {cskhResult.error ? (
        <div className="p-12 text-center bg-red-50 text-red-500 rounded-2xl border border-red-200 font-bold">
          ⚠️ {cskhResult.error}
        </div>
      ) : (
        <CSKHClient data={data} leaders={leaders} />
      )}
    </div>
  );
}
