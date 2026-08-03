"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { updateLanhDaoTheoDoi } from "./cskh-actions";
import { toast } from "sonner";

interface LeaderOption {
  id: string;
  name: string;
  role: string;
  diaBan: string | null;
}

interface LeaderComboboxProps {
  khachHangId: number;
  currentLeaderId: string | null;
  currentLeaderName: string | null;
  leaders: LeaderOption[];
}

export function LeaderCombobox({
  khachHangId,
  currentLeaderId,
  currentLeaderName,
  leaders,
}: LeaderComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(currentLeaderId);
  const [selectedName, setSelectedName] = React.useState(currentLeaderName);
  const [saving, setSaving] = React.useState(false);

  const filtered = leaders.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.diaBan?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const handleSelect = async (leader: LeaderOption | null) => {
    setSaving(true);
    const result = await updateLanhDaoTheoDoi(
      khachHangId,
      leader?.id ?? null
    );

    if (result.success) {
      setSelectedId(leader?.id ?? null);
      setSelectedName(leader?.name ?? null);
      toast.success(
        leader
          ? `Đã giao ${leader.name} theo dõi`
          : "Đã bỏ phân công lãnh đạo"
      );
    } else {
      toast.error(result.error);
    }
    setSaving(false);
    setOpen(false);
    setSearch("");
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "USER":
        return "QTV";
      case "LEADER":
        return "LĐ";
      default:
        return role;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
          className={cn(
            "flex items-center gap-1.5 text-left max-w-[180px] group transition-colors rounded-lg px-1.5 py-1 -mx-1.5 -my-1",
            "hover:bg-gray-100",
            saving && "opacity-50 pointer-events-none"
          )}
        >
          {selectedName ? (
            <span className="text-xs font-semibold text-gray-700 truncate">
              {selectedName}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">Chưa giao</span>
          )}
          <Pencil className="size-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Tìm lãnh đạo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
            autoFocus
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {/* Remove assignment option */}
          {selectedId && (
            <button
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-red-50 text-red-500 transition-colors"
            >
              <X className="size-3" />
              <span className="font-medium">Bỏ phân công</span>
            </button>
          )}

          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">
              Không tìm thấy
            </p>
          ) : (
            filtered.map((leader) => (
              <button
                key={leader.id}
                onClick={() => handleSelect(leader)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
                  selectedId === leader.id
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700"
                )}
              >
                {selectedId === leader.id ? (
                  <Check className="size-3 text-blue-600 shrink-0" />
                ) : (
                  <div className="size-3 shrink-0" />
                )}
                <span className="font-semibold truncate">{leader.name}</span>
                <span className="text-[10px] text-gray-400 ml-auto shrink-0">
                  {roleLabel(leader.role)}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
