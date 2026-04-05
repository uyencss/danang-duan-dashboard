import ProjectForm from "./project-form";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb } from "@/components/layout/breadcrumb";

export const metadata = {
  title: "Tạo dự án mới | MobiFone Tracker",
};

export default function CreateProjectPage() {
  return (
    <div className="w-full mx-auto space-y-4 lg:space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "CRM & DS Dự án", href: "/du-an" },
          { label: "Tạo mới" },
        ]}
      />

      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-black text-[#000719] tracking-tight">
          Tạo dự án mới
        </h2>
      </div>

      {/* Info Alert */}
      <Alert className="bg-[#EBF3FF] border-[#0058bc]/20 rounded-xl py-4">
        <Info className="size-4 text-[#0058bc]" />
        <AlertTitle className="text-[#0058bc] font-bold text-sm">
          Lưu ý quan trọng
        </AlertTitle>
        <AlertDescription className="text-[#0058bc]/80 text-sm mt-0.5">
          Sau khi khởi tạo, dự án sẽ mặc định ở trạng thái <strong>đã chọn</strong>. Bạn cần cập nhật nhật ký công việc tại <strong>"CRM & DS dự án"</strong> để thay đổi trạng thái dự án theo quy trình.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <ProjectForm />
    </div>
  );
}
