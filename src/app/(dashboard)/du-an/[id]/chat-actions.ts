"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ablyServerClient } from "@/lib/realtime";
import { z } from "zod";
import { syncReplica } from "@/lib/utils/sync";

const CHAT_CHANNEL = (projectId: number) => `project-chat-${projectId}`;

// ─── Permission Helper ───────────────────────────────────────────────
async function getSessionUser() {
  const sessionRes = await (auth.api as any).getSession({ headers: await headers() });
  return sessionRes?.user ?? null;
}

async function isProjectMember(projectId: number, userId: string, role: string): Promise<boolean> {
  if (role === "ADMIN") return true;
  const project = await prisma.duAn.findUnique({
    where: { id: projectId },
    select: { amId: true, chuyenVienId: true },
  });
  if (!project) return false;
  return project.amId === userId || project.chuyenVienId === userId;
}

// ─── Get Messages (cursor-based pagination) ──────────────────────────
export async function getMessages(
  projectId: number,
  cursor?: number,
  limit = 50
) {
  try {
    const user = await getSessionUser();
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const canAccess = await isProjectMember(projectId, user.id, user.role);
    if (!canAccess) return { error: "Bạn không có quyền truy cập chat này" };

    const messages = await prisma.tinNhan.findMany({
      where: {
        projectId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const hasMore = messages.length === limit;
    return { success: true, data: messages.reverse(), hasMore };
  } catch (error: any) {
    return { error: `Lỗi: ${error?.message}` };
  }
}

// ─── Send Message ────────────────────────────────────────────────────
const sendMessageSchema = z.object({
  projectId: z.number(),
  content: z.string().min(1, "Nội dung không được để trống").max(2000, "Tin nhắn tối đa 2000 ký tự"),
});

export async function sendMessage(data: { projectId: number; content: string }) {
  try {
    const user = await getSessionUser();
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const parsed = sendMessageSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.errors[0].message };

    const canAccess = await isProjectMember(data.projectId, user.id, user.role);
    if (!canAccess) return { error: "Bạn không có quyền gửi tin nhắn trong dự án này" };

    const message = await prisma.tinNhan.create({
      data: {
        projectId: data.projectId,
        userId: user.id,
        content: data.content.trim(),
        type: "TEXT",
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
      },
    });

    // Broadcast via Ably
    if (ablyServerClient) {
      const channel = ablyServerClient.channels.get(CHAT_CHANNEL(data.projectId));
      await channel.publish("new-message", {
        ...message,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      });
    }
    await syncReplica();
    return { success: true, data: message };
  } catch (error: any) {
    return { error: `Lỗi: ${error?.message}` };
  }
}

// ─── Edit Message ────────────────────────────────────────────────────
export async function editMessage(messageId: number, content: string) {
  try {
    const user = await getSessionUser();
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const existing = await prisma.tinNhan.findUnique({ where: { id: messageId } });
    if (!existing) return { error: "Tin nhắn không tồn tại" };

    if (user.role !== "ADMIN" && existing.userId !== user.id) {
      return { error: "Bạn không có quyền sửa tin nhắn này" };
    }

    // 15-minute edit window (except Admin)
    if (user.role !== "ADMIN") {
      const elapsed = Date.now() - new Date(existing.createdAt).getTime();
      if (elapsed > 15 * 60 * 1000) {
        return { error: "Chỉ có thể sửa tin nhắn trong vòng 15 phút" };
      }
    }

    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 2000) {
      return { error: "Nội dung không hợp lệ" };
    }

    const updated = await prisma.tinNhan.update({
      where: { id: messageId },
      data: { content: trimmed, isEdited: true },
      include: {
        user: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });

    // Broadcast via Ably
    if (ablyServerClient) {
      const channel = ablyServerClient.channels.get(CHAT_CHANNEL(existing.projectId));
      await channel.publish("edit-message", {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    }
    await syncReplica();
    return { success: true, data: updated };
  } catch (error: any) {
    return { error: `Lỗi: ${error?.message}` };
  }
}

// ─── Delete Message (soft delete) ───────────────────────────────────
export async function deleteMessage(messageId: number) {
  try {
    const user = await getSessionUser();
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const existing = await prisma.tinNhan.findUnique({ where: { id: messageId } });
    if (!existing) return { error: "Tin nhắn không tồn tại" };

    if (user.role !== "ADMIN" && existing.userId !== user.id) {
      return { error: "Bạn không có quyền xóa tin nhắn này" };
    }

    const updated = await prisma.tinNhan.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    // Broadcast via Ably
    if (ablyServerClient) {
      const channel = ablyServerClient.channels.get(CHAT_CHANNEL(existing.projectId));
      await channel.publish("delete-message", { messageId });
    }
    await syncReplica();
    return { success: true };
  } catch (error: any) {
    return { error: `Lỗi: ${error?.message}` };
  }
}

// ─── Send Typing Indicator ───────────────────────────────────────────
export async function broadcastTyping(projectId: number, isTyping: boolean) {
  try {
    const user = await getSessionUser();
    if (!user) return;

    if (ablyServerClient) {
      const channel = ablyServerClient.channels.get(CHAT_CHANNEL(projectId));
      await channel.publish(isTyping ? "typing-start" : "typing-stop", {
        userId: user.id,
        userName: user.name,
      });
    }
  } catch {
    // Non-critical, ignore
  }
}
