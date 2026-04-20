import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function main() {
  const roles = ["ADMIN", "AM", "CV", "USER"] as const;

  // Since sequence might be out of sync, we generate a high random ID
  const newId = 999;

  // Insert the Nhu cầu CATP menu item
  const menuItem = await prisma.menuItem.upsert({
    where: { key: "nhu-cau-catp" },
    update: {
      label: "KHẢO SÁT CATP",
      href: "/nhu-cau-catp",
      icon: "Shield", // or ClipboardList
      section: "main",
      sortOrder: 80,
    },
    create: {
      id: newId,
      key: "nhu-cau-catp",
      label: "KHẢO SÁT CATP",
      href: "/nhu-cau-catp",
      icon: "Shield",
      section: "main",
      sortOrder: 80,
      isActive: true,
    },
  });

  console.log("Upserted menu item:", menuItem);

  // Assign permissions
  for (const role of roles) {
    await prisma.menuPermission.upsert({
      where: {
        menuKey_role: {
          menuKey: "nhu-cau-catp",
          role,
        },
      },
      update: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
      create: {
        menuKey: "nhu-cau-catp",
        role,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
    });
  }

  console.log("Menu permissions granted to all roles!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
