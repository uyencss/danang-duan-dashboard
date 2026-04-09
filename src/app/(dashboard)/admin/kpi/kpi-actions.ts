"use server";

import prisma from "@/lib/prisma";
import { syncReplica } from "@/lib/utils/sync";
import { requireAuth, requireRole } from "@/lib/auth-utils";
import { cacheInvalidate } from "@/lib/cache";

export async function getKpiTargets(year: number) {
    try {
        await requireRole("ADMIN", "USER", "AM", "CV");
        const data = await prisma.chiTieuKpi.findMany({
            where: { nam: year },
            orderBy: { thang: 'asc' }
        });
        return { data };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateKpiTarget(year: number, month: number, data: { anNinhMang: number, giaiPhapCntt: number, duAnCds: number, cnsAnNinh: number }) {
    try {
        await requireRole("ADMIN", "USER", "AM", "CV");
        await prisma.chiTieuKpi.upsert({
            where: {
                nam_thang: { nam: year, thang: month }
            },
            create: {
                nam: year,
                thang: month,
                ...data
            },
            update: {
                ...data
            }
        });
        await cacheInvalidate("dashboard:overview");
        await syncReplica();
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
