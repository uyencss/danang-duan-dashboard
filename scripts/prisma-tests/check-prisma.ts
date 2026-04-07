import { PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient();
    console.log("Checking DuAn model fields via PrismaClient DMMF...");
    try {
        // @ts-ignore
        const dmmf = prisma._baseClient?._dmmf || prisma._dmmf;
        if (!dmmf) {
           console.log("DMMF is still hidden. Using alternative check...");
           // try to list props on duAn
           console.log("Proxy props on duAn: ", Object.keys(prisma.duAn));
        }
        
        const duAnModel = dmmf?.datamodel?.models?.find((m: any) => m.name === "DuAn");
        if (duAnModel) {
            console.log("Fields in DuAn model:");
            duAnModel.fields.forEach((f: any) => {
                console.log(` - ${f.name} (type: ${f.type}, kind: ${f.kind})`);
            });
        }
    } catch (e) {
        console.log("Could not check DMMF: ", e);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
