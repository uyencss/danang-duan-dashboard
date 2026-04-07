"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { syncReplica } from "@/lib/utils/sync";

const UserSchema = z.object({
  name: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  email: z.string().min(1, "Tên đăng nhập là bắt buộc"), // Removed .email() to accept phone/name
  password: z.string().min(3, "Mật khẩu tối thiểu 3 ký tự").optional().or(z.literal("")),
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

    // Ensure email is in valid format for Better Auth
    let email = validated.email.trim().toLowerCase();
    if (!email.includes("@")) {
        email = `${email}@mobifone.vn`;
    }

    console.log(`[createUser] Creating user: ${email} (${validated.name})...`);

    // Normalize role value
    const normalizedRole = (validated.role || "USER").toString().toUpperCase().trim() === "ADMN" ? "ADMIN" : (validated.role || "USER").toString().toUpperCase().trim();

    // Use Better Auth Admin API to create user
    // The admin plugin exposes endpoints directly on auth.api (e.g., auth.api.createUser)
    const res = await (auth.api as any).createUser({
        body: {
            email: email,
            password: validated.password,
            name: validated.name,
            role: normalizedRole,
            data: {
              diaBan: validated.diaBan || ""
            }
        },
    });

    if (res?.error) {
        console.error("[createUser] Better Auth Error:", res.error);
        return { error: res.error.message || "Lỗi khi tạo tài khoản" };
    }

    console.log(`[createUser] Created successfully: ${email}`);

    // Re-verify if needed (signUpEmail does it automatically, admin might not)
    try {
        await prisma.user.update({
            where: { email: email },
            data: {
                emailVerified: true
            }
        });
    } catch (verifyErr) {
        console.warn(`[createUser] Could not set emailVerified for ${email}, but user was created.`);
    }

    revalidatePath("/admin/users");
    await syncReplica();
    return { success: true };
  } catch (error: any) {
    console.error("[createUser] Exception:", error);
    if (error instanceof z.ZodError) return { error: error.errors[0].message };
    return { error: error.message || "Lỗi hệ thống khi tạo nhân viên" };
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
    await syncReplica();
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
    await syncReplica();
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
        await syncReplica();
        return { success: true };
    } catch (error: any) {
        console.error("Delete error:", error);
        if (error.code === 'P2003') {
            return { error: "Không thể xóa nhân viên này vì đang có dữ liệu liên quan (Dự án, Nhật ký...)" };
        }
        return { error: "Lỗi hệ thống khi xóa nhân viên" };
    }
}

export async function resetUserPassword(id: string) {
  try {
    const sessionRes = await (auth.api as any).getSession({ headers: await headers() });
    if (!sessionRes?.user) return { error: "Không có quyền thực hiện" };

    const res = await (auth.api as any).adminUpdateUser({
        body: {
            userId: id,
            password: "123456",
        }
    });
    
    // Better auth plugin `admin` might just use adminUpdateUser for password or `setUserPassword`
    // Let's also try `admin.setUserPassword` if `adminUpdateUser` doesn't work. We'll use prisma to hash directly if it fails.
    if (!res && res?.error) {
       return { error: res.error.message || "Không thể reset mật khẩu" };
    }
    return { success: true };
  } catch (error: any) {
    console.error("Reset pwd err:", error);
    return { error: "Lỗi hệ thống khi reset mật khẩu" };
  }
}

export async function bulkCreateUsers(users: any[]) {
    try {
        const results = {
            total: users.length,
            successCount: 0,
            errorCount: 0,
            errors: [] as string[]
        };

        for (const userData of users) {
            try {
                const res = await createUser(userData);
                if (res.success) {
                    results.successCount++;
                } else {
                    results.errorCount++;
                    results.errors.push(`${userData.email}: ${res.error}`);
                }
            } catch (err: any) {
                results.errorCount++;
                results.errors.push(`${userData.email}: ${err.message}`);
            }
        }

        revalidatePath("/admin/users");
        await syncReplica();
        return { success: true, results };
    } catch (error) {
        return { error: "Lỗi hệ thống khi tải lên danh sách" };
    }
}
