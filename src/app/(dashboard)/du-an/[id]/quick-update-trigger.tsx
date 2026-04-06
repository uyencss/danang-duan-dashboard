"use client";

import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { useState } from "react";
import { QuickUpdateModal } from "@/components/du-an/quick-update-modal";

export function QuickUpdateModalTrigger({ project }: { project: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        className="bg-gradient-to-r from-[#0058bc] to-[#0070eb] hover:from-blue-700 hover:to-cyan-600 border border-blue-400/20 text-white font-bold h-11 px-5 rounded-xl shadow-[0_8px_16px_rgba(0,180,216,0.15)] transition-all hover:shadow-[0_8px_20px_rgba(0,180,216,0.25)] hover:-translate-y-0.5"
        onClick={() => setOpen(true)}
      >
        <History className="size-4 mr-2" /> Cập nhật nhanh
      </Button>
      
      <QuickUpdateModal open={open} setOpen={setOpen} project={project} />
    </>
  );
}
