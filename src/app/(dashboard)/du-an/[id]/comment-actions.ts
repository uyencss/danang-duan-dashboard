"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ablyServerClient } from "@/lib/realtime";

/**
 * Tạo bình luận mới
 */
export async function createComment(data: { projectId: number, content: string, parentId?: number | null }) {
    try {
        const sessionRes = await (auth.api as any).getSession({
            headers: await headers()
        });
        const user = sessionRes?.user;
        if (!user) return { error: "Yêu cầu đăng nhập để bình luận" };

        if (!data.content || data.content.trim().length < 2) {
            return { error: "Bình luận tối thiểu 2 ký tự" };
        }

        const comment = await prisma.binhLuan.create({
            data: {
                projectId: data.projectId,
                userId: user.id,
                content: data.content,
                parentId: data.parentId || null,
            },
            include: { user: true }
        });

        // Phát sự kiện real-time qua Ably
        if (ablyServerClient) {
             const channel = ablyServerClient.channels.get(`project-${data.projectId}`);
             await channel.publish('new_comment', {
                 commentId: comment.id,
                 userName: user.name,
                 userId: user.id,
                 content: data.content,
                 createdAt: comment.createdAt,
                 parentId: data.parentId
             });

             const globalChannel = ablyServerClient.channels.get(`notifications`);
             
             // Extract @mentions from content using regex — only look up matched names
             const mentionMatches = data.content.match(/@([\w\sÀ-ỹ]+?)(?=\s|$|[,.!?])/g) || [];
             const mentionedNames = mentionMatches.map((m: string) => m.slice(1).trim()).filter(Boolean);

             let mentions: string[] = [];
             if (mentionedNames.length > 0) {
                 const mentionedUsers = await prisma.user.findMany({
                     where: { name: { in: mentionedNames } },
                     select: { id: true, name: true }
                 });
                 mentions = mentionedUsers.map((u: any) => u.id);
             }

             // Phát mention
             const uniqueMentions = Array.from(new Set(mentions));
             for (const mentionedId of uniqueMentions) {
                 if (mentionedId !== user.id) {
                     await globalChannel.publish('mention', {
                         mentionedUserId: mentionedId,
                         userName: user.name,
                         content: data.content,
                         projectId: data.projectId,
                     });
                 }
             }

             // Tuỳ chọn có thể publish new_comment chung để ai đăng ký channel notifications biết
             // nhưng theo code NotificationBell hiện tại nó sẽ hiện notif cho tất cả.
             // Nếu để trống thì chỉ ai có Tag mới nhận được unless channel subscribe specific user.
        }

        revalidatePath(`/du-an/${data.projectId}`);
        return { success: true, data: comment };
    } catch (error: any) {
        console.error("Create Comment Error:", error);
        return { error: `Lỗi hệ thống: ${error?.message || "Unknown error"}` };
    }
}

/**
 * Xóa bình luận
 */
export async function deleteComment(commentId: number, projectId: number) {
    try {
        const sessionRes = await (auth.api as any).getSession({
            headers: await headers()
        });
        const user = sessionRes?.user;
        if (!user) return { error: "Yêu cầu đăng nhập" };

        const existing = await prisma.binhLuan.findUnique({
            where: { id: commentId }
        });

        if (!existing) return { error: "Bình luận không tồn tại" };

        // Chỉ Admin hoặc chính chủ được xóa
        if (user.role !== "ADMIN" && existing.userId !== user.id) {
            return { error: "Bạn không có quyền xóa bình luận này" };
        }

        // Nếu là comment cha, có nên xóa cả con? Trong schema này parentId là optional.
        // Thông lệ: delete CASCADE nếu là comment cha (nhưng ở đây SQLite có thể ko tự cascade nếu ko config)
        // Ta xóa comment này, các comment con sẽ mồ côi hoặc ta xóa hết.
        await prisma.binhLuan.deleteMany({
            where: {
                OR: [
                    { id: commentId },
                    { parentId: commentId }
                ]
            }
        });

        revalidatePath(`/du-an/${projectId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Delete Comment Error:", error);
        return { error: "Lỗi hệ thống khi xóa bình luận" };
    }
}
