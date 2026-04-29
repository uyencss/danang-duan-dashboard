import { Breadcrumb } from "@/components/layout/breadcrumb";
import GiamDocClient from "./giam-doc-client";

export const metadata = {
  title: "Giám đốc theo dõi",
};

export const dynamic = "force-dynamic";

export default function GiamDocPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <Breadcrumb items={[{ label: "Giám đốc theo dõi" }]} />

      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#191c1e]">
          Giám đốc theo dõi
        </h2>
        <p className="text-[#44474d] mt-1">
          Bảng điều khiển trung tâm dành cho Giám đốc
        </p>
      </div>

      <GiamDocClient />
    </div>
  );
}
