import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FiveMCategory } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { participantName, ideas, batchId } = await req.json();

    if (!ideas || !Array.isArray(ideas) || ideas.length < 5) {
      return NextResponse.json(
        { error: "At least 5 ideas are required." },
        { status: 400 }
      );
    }

    // Filter out invalid rows just in case
    const validIdeas = ideas.filter(idea => idea.category && idea.content.trim());

    if (validIdeas.length < 5) {
      return NextResponse.json(
        { error: "At least 5 valid ideas are required." },
        { status: 400 }
      );
    }

    const createdIdeas = await prisma.workshopIdea.createMany({
      data: validIdeas.map((idea: any) => ({
        participantName: participantName || null,
        category: idea.category as FiveMCategory,
        content: idea.content,
        batchId: batchId,
      })),
    });

    return NextResponse.json({ success: true, count: createdIdeas.count });
  } catch (error) {
    console.error("[WORKSHOP_SUBMIT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
