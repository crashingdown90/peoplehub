// @ai:cl - Get eligible shift swap partners
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/shift-swap/partners - Get list of employees that can be swap partners
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { tenantId, employeeId } = context;

        // Get active employees in same tenant (excluding self)
        const employees = await prisma.employee.findMany({
            where: {
                tenantId,
                status: "ACTIVE",
                deletedAt: null,
                id: { not: employeeId },
            },
            select: {
                id: true,
                fullName: true,
                employeeNumber: true,
                department: { select: { name: true } },
            },
            orderBy: { fullName: "asc" },
        });

        const data = employees.map(e => ({
            id: e.id,
            name: e.fullName,
            employeeNumber: e.employeeNumber,
            department: e.department?.name || "-",
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Get shift swap partners error:", error);
        return handlePrismaError(error);
    }
}
