"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, Check, X, Plus } from "lucide-react";

export interface CreatableSelectOption {
  value: string;
  label: string;
  group?: string;
}

interface CreatableSelectProps {
  options: CreatableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Called when user creates a new option by typing a custom value */
  onCreateNew?: (label: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  createText?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  /** If true, allows creating new entries that aren't in the options list */
  allowCreate?: boolean;
  /** Display value override – used when the selected item is a newly-created label rather than an option value */
  displayValue?: string;
}

export function CreatableSelect({
  options,
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Chọn hoặc nhập mới...",
  searchPlaceholder = "Gõ để tìm hoặc tạo mới...",
  emptyText = "Không tìm thấy kết quả",
  createText = "Tạo mới",
  className,
  triggerClassName,
  disabled = false,
  allowCreate = true,
  displayValue,
}: CreatableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [dropUp, setDropUp] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Find selected label
  const selectedOption = options.find((opt) => opt.value === value);
  const shownLabel = displayValue || selectedOption?.label;

  // Filter options
  const filtered = search
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Determine if the search term is "new" (not exactly matching any option)
  const exactMatch = options.some(
    (opt) => opt.label.toLowerCase() === search.toLowerCase()
  );
  const canCreate = allowCreate && search.trim().length >= 1 && !exactMatch;

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search input when opened
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Detect whether to open upward or downward
  const handleToggle = () => {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 320);
    }
    setOpen(!open);
    if (open) setSearch("");
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew(search.trim());
    }
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "w-full bg-[#f8fbfe] border-none rounded-2xl h-[44px] px-4 text-sm font-bold text-[#0D1F3C] text-left flex items-center justify-between gap-2 transition-all outline-none",
          "hover:bg-[#f0f5fa] focus:ring-2 focus:ring-[#0058bc]/30",
          open && "ring-2 ring-[#0058bc]/30 bg-white",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName
        )}
      >
        <span className={cn("truncate", !shownLabel && "text-slate-400")}>
          {shownLabel || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-slate-400 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={cn(
          "absolute z-50 left-0 right-0 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,88,188,0.15)] border border-blue-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150",
          dropUp
            ? "bottom-full mb-1.5 origin-bottom"
            : "top-full mt-1.5 origin-top"
        )}>
          {/* Search Input */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-[36px] pl-9 pr-8 bg-[#f8fbfe] rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#0058bc]/20 placeholder:text-slate-300 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100"
                >
                  <X className="size-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Create New Option */}
          {canCreate && (
            <div className="px-1.5">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-100 mb-1"
              >
                <Plus className="size-4 shrink-0" />
                <span className="truncate">
                  {createText}: <span className="font-black">&quot;{search.trim()}&quot;</span>
                </span>
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-[240px] overflow-y-auto px-1.5 pb-1.5">
            {filtered.length === 0 && !canCreate ? (
              <div className="py-6 text-center text-sm text-slate-400 italic">
                {emptyText}
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all",
                      isSelected
                        ? "bg-gradient-to-r from-[#0058bc] to-[#0070eb] text-white font-bold"
                        : "hover:bg-blue-50/60 text-[#0D1F3C] font-medium"
                    )}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected && <Check className="size-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
