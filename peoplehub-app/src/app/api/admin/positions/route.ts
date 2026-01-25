import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

// GET /api/admin/positions - Get positions for dropdown
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const positions = await prisma.position.findMany({
            where: { tenantId: context.tenantId, isActive: true },
            select: { id: true, code: true, name: true, level: true },
            orderBy: { level: "asc" },
        });

        return NextResponse.json({ success: true, data: positions });
    } catch (error) {
        console.error("Get positions error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
