import { prisma } from "@/lib/prisma";
import { UploadButton } from "./upload-button";
import { DashboardTabs } from "./dashboard-tabs";
import { DataManager } from "./data-manager";

export const dynamic = "force-dynamic"; // force reload

export default async function NhuCauCatpPage() {
  const data = await prisma.policeSurvey.findMany({
    orderBy: {
      tenDonVi: "asc",
    },
  });

  return (
    <div className="flex-1 w-full flex flex-col items-stretch overflow-y-auto bg-slate-50 p-6 md:p-10 text-slate-900 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600">
            Nhu cầu CATP (Khảo sát)
          </h1>
          <p className="text-slate-600 mt-2">
            Dashboard thống kê kết quả khảo sát nhu cầu chuyển đổi số từ các đơn vị Công an.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataManager data={data} />
          <UploadButton />
        </div>
      </div>

      <div className="w-full relative min-h-[500px]">
        <DashboardTabs data={data} />
      </div>
    </div>
  );
}
