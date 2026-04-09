import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UPLOAD_CONFIG } from "@/lib/upload/config";
import { resizeImageIfNeeded } from "@/lib/upload/image-resize";
import { saveFile } from "@/lib/upload/storage";

export async function POST(request: Request) {
  try {
    const sessionRes = await (auth.api as any).getSession({
      headers: await headers(),
    });
    
    if (!sessionRes?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const mimeType = file.type;
      if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) {
          return NextResponse.json({ error: `File type ${mimeType} not supported` }, { status: 400 });
      }
      
      if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
          return NextResponse.json({ error: `File size exceeds ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit` }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { buffer: processedBuffer, mimeType: processedMime } = await resizeImageIfNeeded(buffer, mimeType);
      
      const { filePath, size } = await saveFile(processedBuffer, file.name, processedMime);
      
      uploadedFiles.push({
        fileName: file.name,
        filePath,
        type: processedMime,
        size
      });
    }

    return NextResponse.json({ success: true, files: uploadedFiles });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file(s)" }, { status: 500 });
  }
}
