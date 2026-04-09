import { requireRole } from "@/lib/auth-utils";
import { getDuAnList } from "@/app/(dashboard)/du-an/actions";
import { DeletedProjectsTable } from "./deleted-projects-table";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { headers } from "next/headers";

export const metadata = {
  title: "Dự án đã xoá",
};

export default async function DeletedProjectsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await requireRole("ADMIN", "USER");


  const result = await getDuAnList({ isDeleted: true });
  const data = result?.data ?? [];
  const error = result?.error;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={[
        { label: "Admin", href: "#" },
        { label: "Dự án đã xoá" }
      ]} />

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#191c1e]">
            Dự án đã xoá
          </h2>
          <p className="text-[#44474d] mt-1">
            Quản lý các dự án đang chờ duyệt xóa vĩnh viễn
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-16 text-center bg-red-50 text-[#ba1a1a] rounded-xl border border-red-200">
          <p className="font-black text-xl">Rất tiếc, đã có lỗi xảy ra</p>
          <p className="text-sm font-medium opacity-80 mt-2">{error}</p>
        </div>
      ) : (
        <DeletedProjectsTable data={data} />
      )}
    </div>
  );
}
