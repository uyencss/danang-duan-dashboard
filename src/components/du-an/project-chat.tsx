"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { MessageSquare, ChevronDown, Loader2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProjectChat, ChatMessage } from "@/hooks/use-project-chat";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { ChatMessageItem } from "./chat-message";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";

interface CurrentUser {
  id: string;
  name: string;
  role: string;
}

interface ProjectChatProps {
  projectId: number;
  currentUser: CurrentUser | null | undefined;
}

function getDateLabel(date: string | Date) {
  const d = new Date(date);
  if (isToday(d)) return "Hôm nay";
  if (isYesterday(d)) return "Hôm qua";
  return format(d, "EEEE, dd/MM/yyyy", { locale: vi });
}

export function ProjectChat({ projectId, currentUser }: ProjectChatProps) {
  const { messages, isLoading, isLoadingMore, hasMore, isConnected, isSending, send, edit, remove, loadMore } =
    useProjectChat(projectId, currentUser?.id);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(projectId, currentUser?.id);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  // Auto-scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Scroll to bottom on first load
  useEffect(() => {
    if (!isLoading && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isLoading]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsAtBottom(atBottom);

    // Load more when scrolled near top
    if (el.scrollTop < 100 && hasMore && !isLoadingMore) {
      const prevScrollHeight = el.scrollHeight;
      loadMore().then(() => {
        // Preserve scroll position after prepending messages
        requestAnimationFrame(() => {
          if (el) el.scrollTop = el.scrollHeight - prevScrollHeight;
        });
      });
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const handleSend = async (content: string) => {
    if (editingMessage) {
      const ok = await edit(editingMessage.id, content);
      if (ok) setEditingMessage(null);
    } else {
      await send(content);
    }
  };

  const handleEdit = (message: ChatMessage) => {
    setEditingMessage(message);
  };

  const handleDelete = async (messageId: number) => {
    if (!confirm("Bạn có chắc muốn xóa tin nhắn này?")) return;
    await remove(messageId);
  };

  // Group messages for avatar display
  const shouldShowAvatar = (index: number) => {
    if (index === 0) return true;
    const curr = messages[index];
    const prev = messages[index - 1];
    return curr.userId !== prev.userId || curr.type === "SYSTEM" || prev.type === "SYSTEM";
  };

  // Date separators
  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    const curr = new Date(messages[index].createdAt);
    const prev = new Date(messages[index - 1].createdAt);
    return !isSameDay(curr, prev);
  };

  return (
    <div className="flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/20 overflow-hidden h-[600px]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <MessageSquare className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#003466] uppercase tracking-widest">Chat Dự án</h3>
            <p className="text-[10px] text-gray-400 font-medium">Trao đổi thời gian thực</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-2 py-1 rounded-full">
              <Wifi className="size-3" />
              <span className="text-[9px] font-black uppercase">Live</span>
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-gray-100 text-gray-400 px-2 py-1 rounded-full">
              <WifiOff className="size-3" />
              <span className="text-[9px] font-black uppercase">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Message List ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0 relative"
        style={{ overflowAnchor: "none" }}
      >
        {/* Load more spinner at top */}
        {isLoadingMore && (
          <div className="flex justify-center py-3">
            <Loader2 className="size-4 animate-spin text-gray-400" />
          </div>
        )}
        {hasMore && !isLoadingMore && (
          <div className="flex justify-center pb-2">
            <button
              onClick={() => loadMore()}
              className="text-[10px] text-primary font-bold hover:underline"
            >
              Tải thêm tin nhắn cũ hơn
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-xs font-medium">Đang tải tin nhắn...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
            <div className="p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <MessageSquare className="size-12 opacity-20 mx-auto" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm text-gray-500">Chưa có tin nhắn nào.</p>
              <p className="text-[10px] uppercase font-black opacity-40 mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id}>
              {/* Date separator */}
              {shouldShowDate(index) && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                    {getDateLabel(message.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}
              <ChatMessageItem
                message={message}
                isOwn={message.userId === currentUser?.id}
                showAvatar={shouldShowAvatar(index)}
                currentUserRole={currentUser?.role ?? "USER"}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))
        )}

        {/* Typing indicator */}
        <TypingIndicator users={typingUsers} />
      </div>

      {/* Scroll to bottom FAB */}
      {!isAtBottom && (
        <div className="absolute bottom-28 right-6 z-10">
          <Button
            size="icon"
            onClick={() => {
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
              setIsAtBottom(true);
            }}
            className="rounded-full shadow-xl h-9 w-9 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
      )}

      {/* ── Chat Input ── */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
        <ChatInput
          onSend={handleSend}
          onTyping={startTyping}
          onStopTyping={stopTyping}
          isSending={isSending}
          editingContent={editingMessage?.content}
          onCancelEdit={() => setEditingMessage(null)}
          placeholder={currentUser ? "Nhập tin nhắn..." : "Đăng nhập để chat..."}
        />
      </div>
    </div>
  );
}
