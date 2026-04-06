"use client";

import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  isSending?: boolean;
  placeholder?: string;
  editingContent?: string;
  onCancelEdit?: () => void;
}

export function ChatInput({
  onSend,
  onTyping,
  onStopTyping,
  isSending,
  placeholder = "Nhập tin nhắn...",
  editingContent,
  onCancelEdit,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When editing, populate value
  useEffect(() => {
    if (editingContent !== undefined) {
      setValue(editingContent);
      textareaRef.current?.focus();
    }
  }, [editingContent]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px"; // max ~5 lines
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setValue("");
    onStopTyping?.();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent interfering with Vietnamese IME composition
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (e.target.value.trim()) {
      onTyping?.();
    } else {
      onStopTyping?.();
    }
  };

  const remaining = 2000 - value.length;
  const isOverLimit = remaining < 0;
  const showCounter = value.length > 1500;

  return (
    <div className="space-y-2">
      {editingContent !== undefined && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs">
          <span className="font-bold text-amber-700">Đang chỉnh sửa tin nhắn...</span>
          <button
            onClick={() => {
              onCancelEdit?.();
              setValue("");
            }}
            className="text-amber-500 hover:text-amber-700 font-black text-xs"
          >
            Hủy
          </button>
        </div>
      )}
      <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed min-h-[24px] max-h-[120px]"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          {showCounter && (
            <span className={cn("text-[10px] font-bold", isOverLimit ? "text-red-500" : "text-gray-400")}>
              {remaining}
            </span>
          )}
          <Button
            onClick={handleSend}
            disabled={!value.trim() || isSending || isOverLimit}
            size="icon"
            className="h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="text-[9px] text-gray-400 text-right px-1">
        Enter để gửi • Shift+Enter xuống dòng
      </p>
    </div>
  );
}
