import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const isResolved = searchParams.get("resolved") === "true";

        const tasks = await prisma.nhatKyCongViec.findMany({
            where: {
                urgentFlag: true,
                isResolved: isResolved
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
        return NextResponse.json(tasks);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { id } = await req.json();
        const updated = await prisma.nhatKyCongViec.update({
            where: { id },
            data: { isResolved: true }
        });
        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
