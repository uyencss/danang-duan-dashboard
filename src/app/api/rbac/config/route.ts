import { NextResponse } from "next/server";
import { getMenuPermissionsFromDB, getRoleConfigsFromDB } from "@/lib/rbac-server";

// API Route for Edge Middleware and Client side to fetch latest RBAC configuration seamlessly
export async function GET() {
  try {
    const [permissions, roleConfigs] = await Promise.all([
      getMenuPermissionsFromDB(),
      getRoleConfigsFromDB(),
    ]);

    return NextResponse.json({
      permissions,
      roleConfigs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load RBAC configs" },
      { status: 500 }
    );
  }
}
