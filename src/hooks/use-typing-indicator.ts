"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { broadcastTyping } from "@/app/(dashboard)/du-an/[id]/chat-actions";
import * as Ably from "ably";

export function useTypingIndicator(projectId: number, currentUserId?: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const ablyRef = useRef<Ably.Realtime | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ABLY_KEY;
    if (!key || key === "test_key") return;

    const client = new Ably.Realtime({ key });
    ablyRef.current = client;

    const channel = client.channels.get(`project-chat-${projectId}`);

    channel.subscribe("typing-start", (msg) => {
      const { userId, userName } = msg.data;
      if (userId === currentUserId) return;
      setTypingUsers((prev) => {
        if (prev.includes(userName)) return prev;
        return [...prev, userName];
      });
    });

    channel.subscribe("typing-stop", (msg) => {
      const { userName } = msg.data;
      setTypingUsers((prev) => prev.filter((u) => u !== userName));
    });

    return () => {
      try {
        if (channel) channel.unsubscribe();
        if (client) {
          const state = client.connection.state;
          if (state !== "closed" && state !== "closing") {
             const result = client.close() as any;
             if (result && typeof result.catch === 'function') {
                result.catch(() => {});
             }
          }
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
