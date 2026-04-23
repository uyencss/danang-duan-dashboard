import { prisma } from "../src/lib/prisma";

async function check() {
  const surveyCount = await prisma.policeSurvey.count();
  const kpiCount = await prisma.chiTieuKpi.count();
  const projectCount = await prisma.duAn.count();
  
  console.log(`Current Project Count: ${projectCount}`);
  console.log(`Police Survey Count: ${surveyCount}`);
  console.log(`KPI Assignment Count: ${kpiCount}`);
}

check().finally(() => prisma.$disconnect());
