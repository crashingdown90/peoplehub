import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";

const updatePeriodSchema = z.object({
    name: z.string().min(3, "Nama minimal 3 karakter").optional(),
    startDate: z.string().min(1).optional(),
    endDate: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
});

// PUT /api/kpi/periods/[id] - Update KPI period
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
        const result = updatePeriodSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const existing = await prisma.kpiPeriod.findFirst({
            where: { id, tenantId: context.tenantId },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Periode tidak ditemukan" } },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (result.data.name !== undefined) updateData.name = result.data.name;
        if (result.data.startDate !== undefined) updateData.startDate = new Date(result.data.startDate);
        if (result.data.endDate !== undefined) updateData.endDate = new Date(result.data.endDate);
        if (result.data.isActive !== undefined) updateData.isActive = result.data.isActive;

        const period = await prisma.kpiPeriod.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, data: period });
    } catch (error) {
        console.error("Update KPI period error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// DELETE /api/kpi/periods/[id] - Delete KPI period
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

        const existing = await prisma.kpiPeriod.findFirst({
            where: { id, tenantId: context.tenantId },
            include: { _count: { select: { kpiTargets: true } } },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Periode tidak ditemukan" } },
                { status: 404 }
            );
        }

        if (existing._count.kpiTargets > 0) {
            return NextResponse.json(
                { success: false, error: { code: "HAS_TARGETS", message: "Periode memiliki target KPI, tidak bisa dihapus" } },
                { status: 400 }
            );
        }

        await prisma.kpiPeriod.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Periode berhasil dihapus" });
    } catch (error) {
        console.error("Delete KPI period error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
