"use server";

import { prisma } from "@/lib/prisma";

export async function getWorkshopData() {
  try {
    const ideas = await prisma.workshopIdea.findMany({
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      totalIdeas: ideas.length,
      totalParticipants: new Set(ideas.map((i) => i.batchId)).size,
      byCategory: ideas.reduce((acc: any, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
      }, {}),
    };

    return { ideas, stats };
  } catch (error) {
    console.error("[GET_WORKSHOP_DATA_ERROR]", error);
    return { ideas: [], stats: { totalIdeas: 0, totalParticipants: 0, byCategory: {} } };
  }
}
