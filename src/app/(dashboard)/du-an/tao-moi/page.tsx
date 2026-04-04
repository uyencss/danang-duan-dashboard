import ProjectForm from "./project-form";
import { PlusCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CreateProjectPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-2 duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <PlusCircle className="size-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-[#003466]">Khởi tạo Dự án Mới</h1>
            <p className="text-gray-500 font-medium">Hệ thống sẽ tự động trích xuất các trường thông tin thời gian báo cáo (Tuần/Tháng/Quý/Năm) dựa trên ngày bắt đầu.</p>
          </div>
        </div>

        <Alert className="bg-blue-50/50 border-blue-100 rounded-2xl">
          <Info className="size-4 text-blue-600" />
          <AlertTitle className="text-blue-700 font-bold">Lưu ý quan trọng</AlertTitle>
          <AlertDescription className="text-blue-600/80 text-sm">
            Sau khi khởi tạo, dự án sẽ mặc định ở trạng thái <strong>Mới (MOI)</strong>. Bạn cần cập nhật nhật ký công việc để thay đổi trạng thái dự án theo quy trình.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Form Component */}
      <ProjectForm />
    </div>
  );
}
