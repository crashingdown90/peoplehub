import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";

const indicatorSchema = z.object({
    code: z.string().min(2, "Kode minimal 2 karakter"),
    name: z.string().min(3, "Nama minimal 3 karakter"),
    description: z.string().optional(),
    unit: z.string().min(1, "Unit wajib diisi"),
    targetType: z.enum(["HIGHER_BETTER", "LOWER_BETTER", "EXACT"]).default("HIGHER_BETTER"),
    weight: z.number().min(0).max(100).default(1),
});

// GET /api/kpi/indicators - Get KPI indicators
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const indicators = await prisma.kpiIndicator.findMany({
            where: { tenantId: context.tenantId, isActive: true },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: indicators.map(i => ({ ...i, weight: Number(i.weight) })),
        });
    } catch (error) {
        console.error("Get KPI indicators error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// POST /api/kpi/indicators - Create KPI indicator (HRD only)
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
        const result = indicatorSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const indicator = await prisma.kpiIndicator.create({
            data: {
                tenantId: context.tenantId,
                ...result.data,
            },
        });

        return NextResponse.json({
            success: true,
            data: { ...indicator, weight: Number(indicator.weight) },
        }, { status: 201 });
    } catch (error) {
        console.error("Create KPI indicator error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
