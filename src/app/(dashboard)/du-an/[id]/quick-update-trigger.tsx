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
        className="bg-[#000719] hover:bg-[#000719]/90 text-white font-bold h-11 px-5 rounded-xl shadow-md"
        onClick={() => setOpen(true)}
      >
        <History className="size-4 mr-2" /> Cập nhật nhanh
      </Button>
      
      <QuickUpdateModal open={open} setOpen={setOpen} project={project} />
    </>
  );
}
