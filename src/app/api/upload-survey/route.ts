import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data } = body;

    // data should be an array of arrays that excludes the header row if possible.
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const upsertPromises = data.map(async (row: any[]) => {
      // Ensure row is an array and has expected length. Sometimes empty rows are parsed.
      if (!Array.isArray(row) || row.length < 2) return null;

      const tenDonVi = row[1];
      // Skip if tenDonVi is essentially empty or looks like the header ("Tên đơn vị")
      if (!tenDonVi || String(tenDonVi).trim() === "" || String(tenDonVi).toLowerCase().includes("tên đơn vị")) {
        return null;
      }

      const nguoiKhaoSat = row[2] ? String(row[2]) : "";
      const chucVu = row[3] ? String(row[3]) : "";
      const daCoCamera = row[4] ? String(row[4]) : "";
      const nhuCauCamera = row[5] === "Có";
      const mucDichCamera = row[6] ? String(row[6]) : "";
      const khuVucCamera = row[7] ? String(row[7]) : "";
      
      const daCoKiosk = row[8] ? String(row[8]) : "";
      const nhuCauKiosk = row[9] === "Có";
      const mucDichKiosk = row[10] ? String(row[10]) : "";
      
      const daCoTruyenThanh = row[11] ? String(row[11]) : "";
      const nhuCauTruyenThanh = row[12] === "Có";
      const mucDichTruyenThanh = row[13] ? String(row[13]) : "";
      const khuVucTruyenThanh = row[14] ? String(row[14]) : "";
      
      const deXuatKhac = row[15] ? String(row[15]) : "";

      return prisma.policeSurvey.create({
        data: {
          tenDonVi,
          nguoiKhaoSat,
          chucVu,
          daCoCamera,
          nhuCauCamera,
          mucDichCamera,
          khuVucCamera,
          daCoKiosk,
          nhuCauKiosk,
          mucDichKiosk,
          daCoTruyenThanh,
          nhuCauTruyenThanh,
          mucDichTruyenThanh,
          khuVucTruyenThanh,
          deXuatKhac,
        },
      });
    });

    const results = await Promise.all(upsertPromises);

    return NextResponse.json({
      message: "Data uploaded successfully",
      count: results.filter(Boolean).length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
