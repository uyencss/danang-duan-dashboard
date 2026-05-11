"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Send, CheckCircle2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "MAN", label: "Man (Con người)" },
  { value: "METHOD", label: "Method (Quy trình)" },
  { value: "MATERIAL", label: "Material (Sản phẩm)" },
  { value: "MACHINE", label: "Machine (Công cụ hệ thống)" },
  { value: "MARKET", label: "Market (Thị trường)" },
];

export default function WorkshopInputPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [participantName, setParticipantName] = useState("");
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?callbackUrl=/workshop/input");
    }
    if (session?.user) {
      setParticipantName(session.user.name || "");
    }
  }, [session, isPending, router]);

  const [ideas, setIdeas] = useState(
    Array(5).fill(null).map(() => ({ category: "", content: "" }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validIdeasCount = useMemo(() => {
    return ideas.filter((idea) => idea.category && idea.content.trim()).length;
  }, [ideas]);

  const canSubmit = validIdeasCount >= 5;

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-blue-600 font-bold uppercase tracking-widest">Đang xác thực...</div>
      </div>
    );
  }

  const handleAddRow = () => {
    if (ideas.length < 10) {
      setIdeas([...ideas, { category: "", content: "" }]);
    }
  };

  const handleDeleteRow = (index: number) => {
    if (ideas.length > 5) {
      const newIdeas = [...ideas];
      newIdeas.splice(index, 1);
      setIdeas(newIdeas);
    }
  };

  const updateIdea = (index: number, field: string, value: string) => {
    const newIdeas = [...ideas];
    newIdeas[index] = { ...newIdeas[index], [field]: value };
    setIdeas(newIdeas);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const batchId = crypto.randomUUID();
      const response = await fetch("/api/workshop/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName,
          ideas: ideas.filter((i) => i.category && i.content.trim()),
          batchId,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Đã gửi ý tưởng thành công!");
        window.scrollTo(0, 0);
      } else {
        toast.error("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-8">
          <CardContent className="space-y-4">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase">
              GỬI THÀNH CÔNG!
            </h1>
            <p className="text-slate-600 px-4">
              Cảm ơn bạn đã đóng góp ý tưởng cho workshop. <br />
              Hãy theo dõi màn hình chính để thấy ý tưởng của bạn xuất hiện!
            </p>
            <div className="pt-6">
              <Button 
                  variant="outline" 
                  onClick={() => {
                      setIsSuccess(false);
                      setIdeas(Array(5).fill(null).map(() => ({ category: "", content: "" })));
                      setParticipantName("");
                  }}
                  className="w-full py-6 border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Tiếp tục gửi ý tưởng mới
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-blue-600 text-white p-6 sticky top-0 z-20 shadow-md">
        <h1 className="text-xl font-extrabold text-center leading-tight tracking-tight uppercase">
          PHIẾU GHI Ý TƯỞNG <br />
          <span className="text-blue-200 text-xs font-medium normal-case">Hội thảo Tư duy đảo ngược - TT KD GPS</span>
        </h1>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <Card className="shadow-sm border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <h2 className="text-sm font-bold text-amber-800 mb-2 uppercase flex items-center">
              <span className="bg-amber-200 p-1 rounded mr-2">💡</span> Chủ đề: Chắc chắn không đạt KPI
            </h2>
            <p className="text-xs text-amber-700 italic">
              Hãy liệt kê các nguyên nhân/yếu tố khiến chúng ta THẤT BẠI trong việc đạt mục tiêu kinh doanh.
            </p>
          </CardContent>
        </Card>

        <section className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Họ và tên (Ẩn danh nếu để trống)</label>
          <Input
            placeholder="Ví dụ: Nguyễn Văn A..."
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            className="bg-white border-slate-200 h-12"
          />
        </section>

        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h2 className="font-bold text-slate-900 text-lg">Danh sách ý tưởng</h2>
            <div className="text-right">
              <div className={`text-sm font-bold ${canSubmit ? 'text-green-600' : 'text-slate-400'}`}>
                {validIdeasCount}/5 Ý tưởng
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Tối thiểu 5 - Tối đa 10</div>
            </div>
          </div>

          {ideas.map((idea, index) => (
            <Card key={index} className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm transition-all duration-200">
              <CardHeader className="p-3 bg-slate-50/80 flex flex-row items-center justify-between space-y-0 border-b">
                <CardTitle className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  THẺ Ý TƯỞNG #{index + 1}
                </CardTitle>
                {ideas.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRow(index)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phân loại 5M</label>
                  <Select
                    value={idea.category}
                    onValueChange={(val) => updateIdea(index, "category", val || "")}
                  >
                    <SelectTrigger className="w-full bg-white h-11 border-slate-200">
                      <SelectValue placeholder="Chọn 1 trong 5M..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nội dung chi tiết</label>
                  <Textarea
                    placeholder="Tại sao chúng ta sẽ thất bại?..."
                    value={idea.content}
                    onChange={(e) => updateIdea(index, "content", e.target.value)}
                    className="min-h-[100px] bg-white border-slate-200 resize-none text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {ideas.length < 10 && (
            <Button
              variant="outline"
              className="w-full border-dashed border-2 py-8 text-slate-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all"
              onClick={handleAddRow}
            >
              <Plus className="mr-2 h-5 w-5" /> Thêm thẻ ý tưởng mới
            </Button>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30">
        <div className="max-w-md mx-auto">
          {!canSubmit && (
            <p className="text-[10px] text-center text-slate-500 mb-2 uppercase font-bold tracking-tight">
              Bạn cần điền ít nhất {5 - validIdeasCount} ý tưởng nữa để gửi
            </p>
          )}
          <Button
            className={`w-full py-7 text-lg font-black uppercase tracking-tight shadow-xl transition-all duration-300 ${
              canSubmit 
                ? "bg-blue-600 hover:bg-blue-700 text-white scale-100" 
                : "bg-slate-200 text-slate-400 scale-95 opacity-50 cursor-not-allowed"
            }`}
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ĐANG XỬ LÝ...
              </span>
            ) : (
              <>
                <Send className="mr-2 h-6 w-6" /> GỬI LÊN MÀN HÌNH CHÍNH
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
