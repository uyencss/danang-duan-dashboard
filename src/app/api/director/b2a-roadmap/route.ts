import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { LinhVuc } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const projects = await prisma.duAn.findMany({
            where: {
                linhVuc: LinhVuc.CONG_AN,
                isPendingDelete: { not: true },
                trangThaiHienTai: { not: 'THAT_BAI' }
            },
            include: {
                khachHang: true,
                am: true,
                chuyenVien: true,
                sanPham: true
            }
        });

        return NextResponse.json(projects);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
