import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/admin/departments - Get departments for dropdown
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

        const departments = await prisma.department.findMany({
            where: { tenantId: context.tenantId, isActive: true },
            select: { id: true, code: true, name: true },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ success: true, data: departments });
    } catch (error) {
        console.error("Get departments error:", error);
        return handlePrismaError(error);
    }
}
