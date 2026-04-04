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
        className="bg-primary hover:bg-primary/90 font-black h-12 shadow-lg shadow-primary/20 rounded-2xl px-6"
        onClick={() => setOpen(true)}
      >
        <History className="size-4 mr-2" /> Cập nhật nhanh
      </Button>
      
      <QuickUpdateModal open={open} setOpen={setOpen} project={project} />
    </>
  );
}
