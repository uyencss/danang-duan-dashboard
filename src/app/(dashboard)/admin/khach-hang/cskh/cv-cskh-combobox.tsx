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
import { updateCvCskh } from "./cskh-actions";
import { toast } from "sonner";

interface LeaderOption {
  id: string;
  name: string;
  role: string;
  diaBan: string | null;
}

interface CvCskhComboboxProps {
  khachHangId: number;
  currentUserId: string | null;
  currentUserName: string | null;
  users: LeaderOption[];
}

export function CvCskhCombobox({
  khachHangId,
  currentUserId,
  currentUserName,
  users,
}: CvCskhComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(currentUserId);
  const [selectedName, setSelectedName] = React.useState(currentUserName);
  const [saving, setSaving] = React.useState(false);

  const filtered = users.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.diaBan?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const handleSelect = async (user: LeaderOption | null) => {
    setSaving(true);
    const result = await updateCvCskh(
      khachHangId,
      user?.id ?? null
    );

    if (result.success) {
      setSelectedId(user?.id ?? null);
      setSelectedName(user?.name ?? null);
      toast.success(
        user
          ? `Đã giao ${user.name} CSKH`
          : "Đã bỏ phân công CV CSKH"
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
            placeholder="Tìm CV CSKH..."
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
            filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
                  selectedId === user.id
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700"
                )}
              >
                {selectedId === user.id ? (
                  <Check className="size-3 text-blue-600 shrink-0" />
                ) : (
                  <div className="size-3 shrink-0" />
                )}
                <span className="font-semibold truncate">{user.name}</span>
                <span className="text-[10px] text-gray-400 ml-auto shrink-0">
                  {roleLabel(user.role)}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
