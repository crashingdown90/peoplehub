import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

// GET /api/admin/branches - Get branches for dropdown
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

        const branches = await prisma.branch.findMany({
            where: { tenantId: context.tenantId, isActive: true },
            select: { id: true, code: true, name: true },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ success: true, data: branches });
    } catch (error) {
        console.error("Get branches error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
