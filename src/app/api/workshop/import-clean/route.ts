import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    const validCategories = ["MAN", "METHOD", "MATERIAL", "MACHINE", "MARKET"];
    const cleanIdeas: { category: string; content: string }[] = [];

    for (const row of rows) {
      // Support multiple column name formats
      const category = (
        row["Category"] ||
        row["category"] ||
        row["Phân loại"] ||
        row["Phân loại 5M"] ||
        ""
      )
        .toString()
        .trim()
        .toUpperCase();

      const content = (
        row["Content"] ||
        row["content"] ||
        row["Nội dung"] ||
        row["Nội dung ý tưởng đảo ngược"] ||
        ""
      )
        .toString()
        .trim();

      if (validCategories.includes(category) && content.length > 0) {
        cleanIdeas.push({ category, content });
      }
    }

    if (cleanIdeas.length === 0) {
      return NextResponse.json(
        {
          error:
            "Không tìm thấy dữ liệu hợp lệ. Đảm bảo file có cột Category/Phân loại và Content/Nội dung.",
        },
        { status: 400 }
      );
    }

    // Wipe and re-insert
    await prisma.workshopCleanIdea.deleteMany();
    await prisma.workshopCleanIdea.createMany({
      data: cleanIdeas.map((idea) => ({
        category: idea.category as any,
        content: idea.content,
        voteCount: 0,
      })),
    });

    return NextResponse.json({
      success: true,
      count: cleanIdeas.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý file. Vui lòng kiểm tra lại định dạng." },
      { status: 500 }
    );
  }
}
