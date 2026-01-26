import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";

const updateIndicatorSchema = z.object({
    code: z.string().min(2, "Kode minimal 2 karakter").optional(),
    name: z.string().min(3, "Nama minimal 3 karakter").optional(),
    description: z.string().optional(),
    unit: z.string().min(1).optional(),
    targetType: z.enum(["HIGHER_BETTER", "LOWER_BETTER", "EXACT"]).optional(),
    weight: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
});

// PUT /api/kpi/indicators/[id] - Update KPI indicator
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
        const result = updateIndicatorSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const existing = await prisma.kpiIndicator.findFirst({
            where: { id, tenantId: context.tenantId },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Indikator tidak ditemukan" } },
                { status: 404 }
            );
        }

        const indicator = await prisma.kpiIndicator.update({
            where: { id },
            data: result.data,
        });

        return NextResponse.json({
            success: true,
            data: { ...indicator, weight: Number(indicator.weight) },
        });
    } catch (error) {
        console.error("Update KPI indicator error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// DELETE /api/kpi/indicators/[id] - Delete KPI indicator
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const existing = await prisma.kpiIndicator.findFirst({
            where: { id, tenantId: context.tenantId },
            include: { _count: { select: { kpiTargets: true } } },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Indikator tidak ditemukan" } },
                { status: 404 }
            );
        }

        if (existing._count.kpiTargets > 0) {
            return NextResponse.json(
                { success: false, error: { code: "HAS_TARGETS", message: "Indikator memiliki target KPI, tidak bisa dihapus" } },
                { status: 400 }
            );
        }

        await prisma.kpiIndicator.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Indikator berhasil dihapus" });
    } catch (error) {
        console.error("Delete KPI indicator error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
