import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ideaIds } = await req.json();

    if (!Array.isArray(ideaIds) || ideaIds.length < 5 || ideaIds.length > 10) {
      return NextResponse.json(
        { error: "Vui lòng chọn từ 5 đến 10 ý tưởng" },
        { status: 400 }
      );
    }

    // Increment voteCount for each selected clean idea
    await Promise.all(
      ideaIds.map((id: string) =>
        prisma.workshopCleanIdea.update({
          where: { id },
          data: { voteCount: { increment: 1 } },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vote submission error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
