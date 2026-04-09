import { NextResponse } from "next/server";
import { resolveFilePath } from "@/lib/upload/storage";
import fs from "fs/promises";
import path from "path";

// Support downloading and viewing uploaded files
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const segments = (await params).path;
    if (!segments || segments.length === 0) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const relativePath = segments.join("/");
    // Directory traversal protection check
    if (relativePath.includes("..") || relativePath.startsWith("/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const absolutePath = await resolveFilePath(relativePath);
    if (!absolutePath) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Đọc file
    const fileBuffer = await fs.readFile(absolutePath);
    
    const ext = path.extname(absolutePath).toLowerCase();
    
    // Cài đặt Content-Type
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
      ".csv": "text/csv",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    const headers = new Headers();
    headers.set("Content-Type", contentType);

    // Không bắt buộc download nếu là ảnh/pdf, để trình duyệt hiển thị
    if (!contentType.startsWith("image/") && contentType !== "application/pdf") {
      const fileName = path.basename(absolutePath);
      headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    } else {
      headers.set("Content-Disposition", `inline`);
    }

    // Cache control
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Serve file error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
