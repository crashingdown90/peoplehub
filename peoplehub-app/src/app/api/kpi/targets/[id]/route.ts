import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";

const updateSchema = z.object({
    actualValue: z.number(),
    notes: z.string().optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/kpi/targets/[id] - Update actual value (employee or admin)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const result = updateSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const isAdmin = hasRole(context, ["HRD", "SUPER_ADMIN", "MANAGER"]);

        // Find target - admin can access any, employee only their own
        const target = await prisma.kpiTarget.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                ...(isAdmin ? {} : { employeeId: context.employeeId }),
            },
            include: { indicator: true },
        });

        if (!target) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "KPI target not found" } },
                { status: 404 }
            );
        }

        // Calculate score based on targetType
        const { actualValue } = result.data;
        const targetValue = Number(target.targetValue);
        let score = 0;

        switch (target.indicator.targetType) {
            case "HIGHER_BETTER":
                score = Math.min(100, (actualValue / targetValue) * 100);
                break;
            case "LOWER_BETTER":
                score = Math.min(100, (targetValue / actualValue) * 100);
                break;
            case "EXACT":
                const diff = Math.abs(actualValue - targetValue);
                const tolerance = targetValue * 0.1; // 10% tolerance
                score = diff <= tolerance ? 100 : Math.max(0, 100 - ((diff / targetValue) * 100));
                break;
        }

        const updated = await prisma.kpiTarget.update({
            where: { id },
            data: {
                actualValue,
                score,
                notes: result.data.notes,
            },
            include: { indicator: true, period: true },
        });

        return NextResponse.json({
            success: true,
            data: {
                ...updated,
                targetValue: Number(updated.targetValue),
                actualValue: Number(updated.actualValue),
                score: Number(updated.score),
            },
            message: `Score: ${score.toFixed(1)}%`,
        });
    } catch (error) {
        console.error("Update KPI target error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// DELETE /api/kpi/targets/[id] - Delete KPI target (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

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

        const target = await prisma.kpiTarget.findFirst({
            where: { id, tenantId: context.tenantId },
        });

        if (!target) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "KPI target not found" } },
                { status: 404 }
            );
        }

        await prisma.kpiTarget.delete({ where: { id } });

        return NextResponse.json({
            success: true,
            message: "Target KPI berhasil dihapus",
        });
    } catch (error) {
        console.error("Delete KPI target error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
