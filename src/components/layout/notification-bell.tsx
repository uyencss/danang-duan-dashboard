"use client";

import { useState, useEffect, useRef } from "react";
import * as Ably from "ably";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationBellProps {
  userId?: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ABLY_KEY;
    if (!key || key === "test_key") return;

    const client = new Ably.Realtime({ key });
    // Subscribe to all project channels for comment notifications
    // We use a wildcard-style by listening to namespace
    // For simplicity, we listen for the notification channel per user
    const channel = client.channels.get(`notifications`);

    channel.subscribe("new_comment", (msg) => {
      const data = msg.data;
      if (data.userId === userId) return; // skip own comments
      const notif: Notification = {
        id: `${Date.now()}`,
        message: `${data.userName} vừa bình luận: "${data.content?.substring(0, 60)}${(data.content?.length ?? 0) > 60 ? "..." : ""}"`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
    });

    channel.subscribe("new-message", (msg) => {
      const data = msg.data;
      if (data.userId === userId) return;
      const notif: Notification = {
        id: `chat-${Date.now()}`,
        message: `${data.user?.name ?? "Ai đó"}: "${data.content?.substring(0, 60)}${(data.content?.length ?? 0) > 60 ? "..." : ""}"`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
    });

    return () => {
      channel.unsubscribe();
      client.close();
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
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-500 hover:bg-gray-50 relative"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) markAllRead();
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
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-primary font-bold hover:underline"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
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
                  className={cn(
                    "px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer",
                    !notif.read && "bg-blue-50/30"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notif.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <div className={cn(!notif.read ? "" : "pl-3.5")}>
                      <p className="text-xs text-gray-700 leading-snug">{notif.message}</p>
                      <p className="text-[9px] text-gray-400 mt-1 font-medium">
                        {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: vi })}
                      </p>
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
