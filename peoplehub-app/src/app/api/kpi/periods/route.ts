import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const periodSchema = z.object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
});

// GET /api/kpi/periods - Get KPI periods
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const periods = await prisma.kpiPeriod.findMany({
            where: { tenantId: context.tenantId },
            orderBy: { startDate: "desc" },
        });

        return NextResponse.json({ success: true, data: periods });
    } catch (error) {
        console.error("Get KPI periods error:", error);
        return handlePrismaError(error);
    }
}

// POST /api/kpi/periods - Create KPI period (HRD only)
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const result = periodSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const period = await prisma.kpiPeriod.create({
            data: {
                tenantId: context.tenantId,
                name: result.data.name,
                startDate: new Date(result.data.startDate),
                endDate: new Date(result.data.endDate),
            },
        });

        return NextResponse.json({ success: true, data: period }, { status: 201 });
    } catch (error) {
        console.error("Create KPI period error:", error);
        return handlePrismaError(error);
    }
}
