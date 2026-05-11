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
      return NextResponse.json({ error: "Invalid selection" }, { status: 400 });
    }

    // Increment voteCount for each idea
    await prisma.workshopIdea.updateMany({
      where: {
        id: { in: ideaIds },
      },
      data: {
        voteCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Voting error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
