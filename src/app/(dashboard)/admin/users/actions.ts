"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const UserSchema = z.object({
  name: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").optional().or(z.literal("")),
  role: z.any(),
  diaBan: z.string().optional().or(z.literal("")),
});

export async function getUserList(params?: { search?: string, role?: string }) {
  try {
    const whereClause: any = {};
    if (params?.search) {
      whereClause.OR = [
        { name: { contains: params.search } },
        { email: { contains: params.search } },
      ];
    }
    if (params?.role && params.role !== "ALL") {
      whereClause.role = params.role as UserRole;
    }

    const data = await prisma.user.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    });
    return { data };
  } catch (error) {
    return { error: "Lỗi hệ thống khi tải danh sách nhân viên" };
  }
}

export async function createUser(data: any) {
  try {
    const validated = UserSchema.parse(data);
    if (!validated.password) return { error: "Mật khẩu là bắt buộc khi tạo mới" };

    // Use Better Auth API to create user with hashed password
    const res = await (auth.api as any).signUpEmail({
        body: {
            email: validated.email,
            password: validated.password,
            name: validated.name,
        }
    });

    if (res.error) {
        return { error: res.error.message || "Lỗi khi tạo tài khoản" };
    }

    // Update metadata fields if signUpEmail didn't handle them
    await prisma.user.update({
        where: { email: validated.email },
        data: {
            role: validated.role,
            diaBan: validated.diaBan || null,
            emailVerified: true
        }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.errors[0].message };
    return { error: "Lỗi hệ thống khi tạo nhân viên" };
  }
}

export async function updateUser(id: string, data: any) {
  try {
    const validated = UserSchema.parse(data);
    
    await prisma.user.update({
      where: { id },
      data: {
        name: validated.name,
        email: validated.email,
        role: validated.role,
        diaBan: validated.diaBan || null,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.errors[0].message };
    return { error: "Lỗi hệ thống khi cập nhật nhân viên" };
  }
}

export async function toggleUserStatus(id: string, currentActive: boolean) {
  try {
    const sessionRes = await (auth.api as any).getSession({ headers: await headers() });
    if (sessionRes?.user?.id === id) {
        return { error: "Bạn không thể tự khóa chính mình!" };
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: !currentActive },
    });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Toggle error:", error);
    return { error: "Lỗi khi cập nhật trạng thái" };
  }
}

export async function deleteUser(id: string) {
    try {
        const sessionRes = await (auth.api as any).getSession({ headers: await headers() });
        if (sessionRes?.user?.id === id) {
            return { error: "Bạn không thể tự xóa chính mình!" };
        }

        await prisma.user.delete({
            where: { id }
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error: any) {
        console.error("Delete error:", error);
        if (error.code === 'P2003') {
            return { error: "Không thể xóa nhân viên này vì đang có dữ liệu liên quan (Dự án, Nhật ký...)" };
        }
        return { error: "Lỗi hệ thống khi xóa nhân viên" };
    }
}
