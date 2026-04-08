"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import { getMessages, sendMessage, editMessage, deleteMessage, broadcastTyping } from "@/app/(dashboard)/du-an/[id]/chat-actions";
import { toast } from "sonner";

export interface ChatMessage {
  id: number;
  projectId: number;
  userId: string;
  content: string;
  type: "TEXT" | "SYSTEM";
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
  };
}

export function useProjectChat(projectId: number, currentUserId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const oldestCursorRef = useRef<number | undefined>(undefined);

  // Initial load
  useEffect(() => {
    loadInitialMessages();
  }, [projectId]);

  // Ably subscription
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ABLY_KEY;
    if (!key || key === "test_key") return;

    const client = new Ably.Realtime({ key, autoConnect: true });
    ablyRef.current = client;

    client.connection.on("connected", () => setIsConnected(true));
    client.connection.on("disconnected", () => setIsConnected(false));
    client.connection.on("failed", () => setIsConnected(false));

    const channel = client.channels.get(`project-chat-${projectId}`);
    channelRef.current = channel;

    channel.subscribe("new-message", (msg) => {
      const newMsg: ChatMessage = msg.data;
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    channel.subscribe("edit-message", (msg) => {
      const updated: ChatMessage = msg.data;
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
      );
    });

    channel.subscribe("delete-message", (msg) => {
      const { messageId } = msg.data;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true } : m))
      );
    });

    return () => {
      try {
        channel.unsubscribe();
        if (client.connection.state !== "closed") {
          const result = client.close() as any;
          if (result && typeof result.catch === 'function') {
            result.catch(() => {});
          }
        }
      } catch (e) {
        // Silently fail on unmount
      }
    };
  }, [projectId]);

  // Polling fallback when Ably is offline
  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(async () => {
      const res = await getMessages(projectId, undefined, 50);
      if (res.success && res.data) {
        setMessages((prev) => {
          const fetched = res.data as ChatMessage[];
          // Only update state if something actually changed to prevent DOM jumping
          if (fetched.length === 0) return prev;
          if (prev.length === 0 || fetched[fetched.length - 1].id !== prev[prev.length - 1].id) {
             return fetched;
          }
          return prev;
        });
      }
    }, 3000); // 3 seconds polling
    
    return () => clearInterval(interval);
  }, [projectId, isConnected]);

  async function loadInitialMessages() {
    setIsLoading(true);
    const res = await getMessages(projectId, undefined, 50);
    if (res.success && res.data) {
      setMessages(res.data as ChatMessage[]);
      setHasMore(res.hasMore ?? false);
      if (res.data.length > 0) {
        oldestCursorRef.current = res.data[0].id;
      }
    }
    setIsLoading(false);
  }

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !oldestCursorRef.current) return;
    setIsLoadingMore(true);
    const res = await getMessages(projectId, oldestCursorRef.current, 30);
    if (res.success && res.data) {
      setMessages((prev) => [...(res.data as ChatMessage[]), ...prev]);
      setHasMore(res.hasMore ?? false);
      if (res.data.length > 0) {
        oldestCursorRef.current = res.data[0].id;
      }
    }
    setIsLoadingMore(false);
  }, [projectId, isLoadingMore, hasMore]);

  const send = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      setIsSending(true);
      // Optimistic add
      const optimisticId = -Date.now();
      const optimistic: ChatMessage = {
        id: optimisticId,
        projectId,
        userId: currentUserId ?? "",
        content: content.trim(),
        type: "TEXT",
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: { id: currentUserId ?? "", name: "Bạn", role: "USER" },
      };
      setMessages((prev) => [...prev, optimistic]);

      const res = await sendMessage({ projectId, content });
      if (res.success && res.data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? (res.data as ChatMessage) : m
          )
        );
      } else {
        // Rollback optimistic
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        toast.error(res.error ?? "Không thể gửi tin nhắn");
      }
      setIsSending(false);
    },
    [projectId, currentUserId]
  );

  const edit = useCallback(async (messageId: number, content: string) => {
    const res = await editMessage(messageId, content);
    if (!res.success) toast.error(res.error ?? "Không thể sửa tin nhắn");
    return res.success ?? false;
  }, []);

  const remove = useCallback(async (messageId: number) => {
    const res = await deleteMessage(messageId);
    if (!res.success) toast.error(res.error ?? "Không thể xóa tin nhắn");
    return res.success ?? false;
  }, []);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    isConnected,
    isSending,
    send,
    edit,
    remove,
    loadMore,
  };
}
