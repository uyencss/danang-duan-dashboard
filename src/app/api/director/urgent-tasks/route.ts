import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const isResolved = searchParams.get("resolved") === "true";

        const allTasks = await prisma.nhatKyCongViec.findMany({
            where: {
                urgentFlag: true,
                isResolved: isResolved,
            },
            orderBy: {
                createdAt: isResolved ? 'desc' : 'asc'
            },
            include: {
                duAn: {
                    include: {
                        khachHang: true,
                        chuyenVien: true,
                        am: true,
                        sanPham: true,
                    }
                }
            }
        });

        // Fetch archived IDs using raw SQL because Prisma Client might not recognize the field yet
        const archivedLogs: any[] = await prisma.$queryRaw`SELECT id FROM "NhatKyCongViec" WHERE "directorArchived" = true`;
        const archivedIds = new Set(archivedLogs.map(l => l.id));

        // Filter out archived tasks
        const tasks = allTasks.filter((t: any) => !archivedIds.has(t.id));

        return NextResponse.json(tasks);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { id, archive } = await req.json();
        let updated;
        if (archive) {
            // Use raw query to bypass Prisma Client runtime validation issues with new fields
            await prisma.$executeRaw`UPDATE "NhatKyCongViec" SET "directorArchived" = true WHERE id = ${id}`;
            updated = { id, directorArchived: true };
        } else {
            updated = await prisma.nhatKyCongViec.update({
                where: { id },
                data: { isResolved: true }
            });
        }
        
        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
