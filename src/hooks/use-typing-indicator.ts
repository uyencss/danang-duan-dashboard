"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { broadcastTyping } from "@/app/(dashboard)/du-an/[id]/chat-actions";
import { getAblyBrowserClient } from "@/lib/realtime";

export function useTypingIndicator(projectId: number, currentUserId?: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const client = getAblyBrowserClient();
    if (!client) return;

    const channel = client.channels.get(`project-chat-${projectId}`);

    const onTypingStart = (msg: any) => {
      const { userId, userName } = msg.data;
      if (userId === currentUserId) return;
      setTypingUsers((prev) => {
        if (prev.includes(userName)) return prev;
        return [...prev, userName];
      });
    };

    const onTypingStop = (msg: any) => {
      const { userName } = msg.data;
      setTypingUsers((prev) => prev.filter((u) => u !== userName));
    };

    channel.subscribe("typing-start", onTypingStart);
    channel.subscribe("typing-stop", onTypingStop);

    return () => {
      try {
        if (channel) {
          channel.unsubscribe("typing-start", onTypingStart);
          channel.unsubscribe("typing-stop", onTypingStop);
        }
      } catch (e) {
        // Silently fail on unmount
      }
    };
  }, [projectId, currentUserId]);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      broadcastTyping(projectId, true).catch(() => {});
    }

    // Reset debounce timer
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [projectId]);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      broadcastTyping(projectId, false).catch(() => {});
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, [projectId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        broadcastTyping(projectId, false).catch(() => {});
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [projectId]);

  return { typingUsers, startTyping, stopTyping };
}
