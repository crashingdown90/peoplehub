// @ai:cl - Reimburse request detail and cancel routes
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/reimburse/requests/[id] - Get reimburse request detail
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
                { status: 401 }
            );
        }

        const reimburseRequest = await prisma.reimburseRequest.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                employeeId: context.employeeId,
            },
            include: { items: true },
        });

        if (!reimburseRequest) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Pengajuan reimburse tidak ditemukan" } },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...reimburseRequest,
                totalAmount: Number(reimburseRequest.totalAmount),
                items: reimburseRequest.items.map(i => ({ ...i, amount: Number(i.amount) })),
            },
        });
    } catch (error) {
        console.error("Get reimburse request detail error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// DELETE /api/reimburse/requests/[id] - Cancel reimburse request
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
                { status: 401 }
            );
        }

        const reimburseRequest = await prisma.reimburseRequest.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                employeeId: context.employeeId,
            },
        });

        if (!reimburseRequest) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Pengajuan reimburse tidak ditemukan" } },
                { status: 404 }
            );
        }

        if (reimburseRequest.status !== "PENDING") {
            return NextResponse.json(
                { success: false, error: { code: "CANNOT_MODIFY", message: "Hanya pengajuan dengan status PENDING yang dapat dibatalkan" } },
                { status: 400 }
            );
        }

        await prisma.reimburseRequest.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "REIMBURSE_CANCELLED",
                objectType: "ReimburseRequest",
                objectId: id,
                afterData: JSON.parse(JSON.stringify({ status: "CANCELLED" })),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Pengajuan reimburse dibatalkan",
        });
    } catch (error) {
        console.error("Cancel reimburse request error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
