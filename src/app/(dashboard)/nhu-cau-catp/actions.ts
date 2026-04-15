"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updatePoliceSurvey(id: number, data: any) {
  try {
    await prisma.policeSurvey.update({
      where: { id },
      data,
    });
    revalidatePath("/nhu-cau-catp");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Không thể cập nhật dòng dữ liệu này." };
  }
}

export async function createPoliceSurvey(data: any) {
  try {
    await prisma.policeSurvey.create({
      data,
    });
    revalidatePath("/nhu-cau-catp");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Không thể tạo bản ghi mới." };
  }
}

export async function deletePoliceSurvey(id: number) {
  try {
    await prisma.policeSurvey.delete({
      where: { id },
    });
    revalidatePath("/nhu-cau-catp");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Không thể xóa bản ghi." };
  }
}

export async function deleteAllPoliceSurveys() {
  try {
    await prisma.policeSurvey.deleteMany({});
    revalidatePath("/nhu-cau-catp");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Không thể xóa toàn bộ dữ liệu." };
  }
}
