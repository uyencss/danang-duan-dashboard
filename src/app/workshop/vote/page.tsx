"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getCleanIdeasForVoting } from "../workshop-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; ring: string }> = {
  MAN: { label: "Man\n(Con người)", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", ring: "ring-blue-500" },
  METHOD: { label: "Method\n(Quy trình)", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", ring: "ring-red-500" },
  MATERIAL: { label: "Material\n(Sản phẩm)", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", ring: "ring-emerald-500" },
  MACHINE: { label: "Machine\n(Công cụ HT)", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", ring: "ring-amber-500" },
  MARKET: { label: "Market\n(Thị trường)", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", ring: "ring-purple-500" },
};

const CATEGORIES_ORDER = ["MAN", "METHOD", "MATERIAL", "MACHINE", "MARKET"];

export default function WorkshopVotePage() {
  const router = useRouter();
  const { data: session, isPending: authPending } = authClient.useSession();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authPending && !session) {
      router.push("/login?callbackUrl=/workshop/vote");
    }
  }, [session, authPending, router]);

  useEffect(() => {
    async function load() {
      const result = await getCleanIdeasForVoting();
      setIdeas(result.ideas);
      setLoading(false);
    }
    load();
  }, []);

  const ideasByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    CATEGORIES_ORDER.forEach((cat) => (grouped[cat] = []));
    ideas.forEach((idea) => {
      if (grouped[idea.category]) {
        grouped[idea.category].push(idea);
      }
    });
    return grouped;
  }, [ideas]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const count = selectedIds.size;
    if (count < 5) {
      toast.error("Vui lòng chọn ít nhất 5 ý tưởng để đảm bảo tính khách quan.");
      return;
    }
    if (count > 10) {
      toast.error("Vui lòng chọn tối đa 10 ý tưởng quan trọng nhất.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/workshop/submit-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaIds: Array.from(selectedIds) }),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Bình chọn thành công!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Có lỗi xảy ra.");
      }
    } catch {
      toast.error("Lỗi kết nối server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authPending || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-10">
          <CardContent className="space-y-5">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase">Cám ơn bạn đã bình chọn!</h1>
            <p className="text-slate-500 text-sm px-4">
              Kết quả bình chọn sẽ được tổng hợp và hiển thị trên màn hình chính của hội thảo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-10">
          <CardContent className="space-y-4">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
              Chưa có dữ liệu bình chọn. Vui lòng chờ Ban tổ chức nhập dữ liệu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedCount = selectedIds.size;
  const isValid = selectedCount >= 5 && selectedCount <= 10;

  const renderIdeaCard = (idea: any) => {
    const selected = selectedIds.has(idea.id);
    const config = CATEGORY_CONFIG[idea.category];
    return (
      <button
        key={idea.id}
        type="button"
        onClick={() => toggleSelect(idea.id)}
        className={`w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
          selected
            ? `${config.border} ${config.bg} ring-2 ${config.ring} shadow-md scale-[1.01]`
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
              selected
                ? `${config.border} ${config.bg}`
                : "border-slate-300"
            }`}
          >
            {selected && (
              <CheckCircle2 className={`w-4 h-4 ${config.color}`} />
            )}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium flex-1">
            {idea.content}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <div className="bg-blue-600 text-white p-5 sticky top-0 z-20 shadow-md">
        <h1 className="text-lg font-extrabold text-center leading-tight tracking-tight uppercase">
          BÌNH CHỌN NGUY CƠ QUAN TRỌNG
          <br />
          <span className="text-blue-200 text-xs font-medium normal-case">
            Hội thảo Tư duy đảo ngược - TT KD GPS
          </span>
        </h1>
      </div>

      {/* Info banner */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-800 font-bold uppercase tracking-tight">
            ⚡ Chọn từ 5 đến 10 nguy cơ quan trọng nhất mà bạn cho rằng ảnh hưởng lớn đến KPI
          </p>
        </div>
      </div>

      {/* Desktop: 5-column grid */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-5 gap-4">
          {CATEGORIES_ORDER.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const catIdeas = ideasByCategory[cat] || [];
            return (
              <div key={cat} className="space-y-3">
                <div className={`rounded-xl p-3 ${config.bg} border ${config.border} text-center`}>
                  <h3 className={`text-sm font-black uppercase whitespace-pre-line leading-tight ${config.color}`}>
                    {config.label}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold">{catIdeas.length} mục</span>
                </div>
                <div className="space-y-2">
                  {catIdeas.map(renderIdeaCard)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Tabs layout */}
      <div className="lg:hidden max-w-md mx-auto px-4 pt-4">
        <Tabs defaultValue="MAN">
          <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-slate-100 rounded-xl">
            {CATEGORIES_ORDER.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const catIdeas = ideasByCategory[cat] || [];
              const hasSelected = catIdeas.some((i: any) => selectedIds.has(i.id));
              return (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className={`text-[9px] font-black uppercase px-1 py-2 leading-tight rounded-lg data-[state=active]:shadow-md ${
                    hasSelected ? "ring-2 ring-blue-400" : ""
                  }`}
                >
                  {cat.substring(0, 3)}
                  <br />
                  <span className="text-[8px] font-normal text-slate-400">({catIdeas.length})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          {CATEGORIES_ORDER.map((cat) => {
            const catIdeas = ideasByCategory[cat] || [];
            return (
              <TabsContent key={cat} value={cat} className="mt-3 space-y-2">
                {catIdeas.map(renderIdeaCard)}
                {catIdeas.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8 italic">
                    Không có mục nào trong danh mục này.
                  </p>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className={`text-sm font-black uppercase tracking-tight ${isValid ? "text-green-600" : "text-slate-400"}`}>
              Đã chọn: {selectedCount} ý tưởng
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-tight">
              Yêu cầu: 5 - 10 ý tưởng
            </div>
          </div>
          <Button
            className={`py-6 px-8 text-base font-black uppercase tracking-tight shadow-xl transition-all duration-300 ${
              isValid
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
            }`}
            disabled={!isValid || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <RefreshCw className="animate-spin mr-2 h-5 w-5" />
                ĐANG GỬI...
              </span>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" /> HOÀN THÀNH BÌNH CHỌN
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
