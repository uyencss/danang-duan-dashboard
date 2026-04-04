"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { ProjectFormDialog } from "@/components/du-an/project-form-dialog";

export function EditProjectTrigger({ project }: { project: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        className="rounded-xl border-[#c5c6ce] h-11 font-bold px-5 hover:bg-[#f2f4f6] transition-all"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-4 mr-2" /> Chỉnh sửa
      </Button>

      <ProjectFormDialog 
        open={open} 
        onOpenChange={setOpen} 
        project={project} 
      />
    </>
  );
}
