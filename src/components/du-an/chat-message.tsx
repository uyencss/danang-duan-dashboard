"use client";

import { format, isToday, isYesterday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/hooks/use-project-chat";

function formatChatTime(date: string | Date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Hôm qua ${format(d, "HH:mm")}`;
  return format(d, "dd/MM HH:mm");
}

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserRole: string;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (messageId: number) => void;
}

export function ChatMessageItem({
  message,
  isOwn,
  showAvatar,
  currentUserRole,
  onEdit,
  onDelete,
}: ChatMessageItemProps) {
  const canModify = isOwn || currentUserRole === "ADMIN";

  // System message
  if (message.type === "SYSTEM") {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2.5 group",
        isOwn ? "flex-row-reverse" : "flex-row",
        showAvatar ? "mt-4" : "mt-1"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8">
        {showAvatar && !isOwn && (
          <Avatar className="size-8 rounded-xl border shadow-sm">
            <AvatarImage src={message.user.avatarUrl ?? ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-black rounded-xl">
              {message.user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Bubble */}
      <div className={cn("max-w-[72%] flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {showAvatar && !isOwn && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-black text-gray-700">{message.user.name}</span>
            {message.user.role === "ADMIN" && (
              <Badge className="bg-blue-50 text-blue-600 border-none px-1 text-[7px] h-3 uppercase font-black">
                Admin
              </Badge>
            )}
          </div>
        )}

        <div className="relative flex items-end gap-1.5">
          {/* Context menu — show on left for own msgs, right for others */}
          {canModify && !message.isDeleted && (
            <div className={cn("opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mb-0.5",
              isOwn ? "order-first" : "order-last"
            )}>
              <DropdownMenu>
                <DropdownMenuTrigger className="h-6 w-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors outline-none">
                  <MoreHorizontal className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-36">
                  {isOwn && (
                    <DropdownMenuItem onClick={() => onEdit?.(message)} className="cursor-pointer text-xs">
                      <Pencil className="size-3 mr-2" /> Chỉnh sửa
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete?.(message.id)}
                    className="cursor-pointer text-xs text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="size-3 mr-2" /> Xóa tin nhắn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              "px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-full break-words",
              isOwn
                ? "bg-primary text-white rounded-br-sm shadow-lg shadow-primary/20"
                : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm",
              message.isDeleted && "opacity-40 italic"
            )}
          >
            {message.isDeleted ? (
              <span className="text-xs">Tin nhắn đã bị xóa</span>
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                {message.isEdited && (
                  <span className={cn("text-[9px] mt-0.5 block", isOwn ? "text-white/60" : "text-gray-400")}>
                    (đã chỉnh sửa)
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <span className="text-[9px] text-gray-400 font-medium px-1">
          {formatChatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
