"use server";

import prisma from "@/lib/prisma";

export async function getKpiTargets(year: number) {
    try {
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
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
