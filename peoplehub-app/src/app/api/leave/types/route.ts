import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/leave/types - Get available leave types
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const leaveTypes = await prisma.leaveType.findMany({
            where: { tenantId: context.tenantId, isActive: true },
            select: {
                id: true,
                code: true,
                name: true,
                defaultBalance: true,
                isPaid: true,
                requiresAttachment: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ success: true, data: leaveTypes });
    } catch (error) {
        console.error("Get leave types error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
