"use client";

import { useState, useEffect, useRef } from "react";
import * as Ably from "ably";
import { getAblyBrowserClient } from "@/lib/realtime";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { getNotifications, markNotificationRead } from "@/app/(dashboard)/du-an/actions";
import Link from "next/link";

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type?: string;
  relatedId?: string;
  projectId?: number;
}

interface NotificationBellProps {
  userId?: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const fetchDbNotifications = async () => {
      const { data } = await getNotifications();
      if (data) {
        const mapped: Notification[] = data.map((n: any) => ({
          id: String(n.id),
          message: n.content,
          timestamp: new Date(n.createdAt),
          read: n.isRead,
          type: n.type,
          relatedId: n.relatedId,
          projectId: n.projectId
        }));
        setNotifications((prev) => {
          // Merge Ably (mention/chat) and DB notifications
          const combined = [...prev, ...mapped];
          // Simple unique check by ID (some IDs might be string, some stringified numbers)
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 30);
        });
      }
    };

    fetchDbNotifications();
  }, [userId]);

  useEffect(() => {
    const client = getAblyBrowserClient();
    if (!client) return;

    const channel = client.channels.get(`notifications`);

    const onMention = (msg: any) => {
      const data = msg.data;
      if (data.mentionedUserId !== userId) return; // only for me
      
      const cleanContent = data.content || "";
      const notif: Notification = {
        id: `mention-${Date.now()}`,
        message: `${data.userName} đã nhắc đến bạn: "${cleanContent.substring(0, 60)}${cleanContent.length > 60 ? "..." : ""}"`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
      toast.info(`${data.userName} đã nhắc đến bạn!`, { icon: <Bell className="size-4" /> });
    };

    const onNewMessage = (msg: any) => {
      const data = msg.data;
      if (data.userId === userId) return;
      const notif: Notification = {
        id: `chat-${Date.now()}`,
        message: `${data.user?.name ?? "Ai đó"}: "${data.content?.substring(0, 60)}${(data.content?.length ?? 0) > 60 ? "..." : ""}"`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
    };

    const onMarkRead = (msg: any) => {
      const { relatedId } = msg.data;
      if (!relatedId) return;
      
      setNotifications(prev => prev.map(n => 
        n.relatedId === String(relatedId) ? { ...n, read: true } : n
      ));
    };

    channel.subscribe("mention", onMention);
    channel.subscribe("new-message", onNewMessage);
    channel.subscribe("mark-read-related", onMarkRead);

    return () => {
      try {
        if (channel) {
          channel.unsubscribe("mention", onMention);
          channel.unsubscribe("new-message", onNewMessage);
          channel.unsubscribe("mark-read-related", onMarkRead);
        }
      } catch (e) {
        // Silently fail on unmount
      }
    };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // In a real app we'd call an API to mark all as read.
  };


  const handleClick = async (notif: Notification) => {
     if (!notif.read) {
        await markNotificationRead(Number(notif.id));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
     }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-500 hover:bg-gray-50 relative"
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 ring-2 ring-white flex items-center justify-center text-[8px] font-black text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-200/30 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-black text-[#003466] uppercase tracking-widest">Thông báo</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Bell className="size-8 opacity-20 mb-2" />
                <p className="text-xs font-medium">Không có thông báo mới</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={cn(
                    "px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer",
                    !notif.read && "bg-blue-50/30"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notif.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <div className={cn("w-full", !notif.read ? "" : "pl-3.5")}>
                      <p className="text-xs text-gray-700 leading-snug font-medium">
                        {notif.type === "APPROVAL_REQUEST" ? (
                            <span className="text-amber-600 font-bold uppercase text-[9px] block mb-0.5">Yêu cầu duyệt</span>
                        ) : notif.type === "APPROVAL_RESULT" ? (
                            <span className="text-blue-600 font-bold uppercase text-[9px] block mb-0.5">Kết quả duyệt</span>
                        ) : null}
                        {notif.message}
                      </p>
                      

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] text-gray-400 font-medium">
                          {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
