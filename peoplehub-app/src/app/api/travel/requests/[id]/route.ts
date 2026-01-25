// @ai:cl - Travel request detail and cancel routes
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/travel/requests/[id] - Get travel request detail
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

        const travelRequest = await prisma.travelRequest.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                employeeId: context.employeeId,
            },
        });

        if (!travelRequest) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Pengajuan perjalanan tidak ditemukan" } },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...travelRequest,
                estimatedBudget: Number(travelRequest.estimatedBudget),
            },
        });
    } catch (error) {
        console.error("Get travel request detail error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// DELETE /api/travel/requests/[id] - Cancel travel request
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

        const travelRequest = await prisma.travelRequest.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                employeeId: context.employeeId,
            },
        });

        if (!travelRequest) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Pengajuan perjalanan tidak ditemukan" } },
                { status: 404 }
            );
        }

        if (travelRequest.status !== "PENDING") {
            return NextResponse.json(
                { success: false, error: { code: "CANNOT_MODIFY", message: "Hanya pengajuan dengan status PENDING yang dapat dibatalkan" } },
                { status: 400 }
            );
        }

        await prisma.travelRequest.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "TRAVEL_CANCELLED",
                objectType: "TravelRequest",
                objectId: id,
                afterData: JSON.parse(JSON.stringify({ status: "CANCELLED" })),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Pengajuan perjalanan dibatalkan",
        });
    } catch (error) {
        console.error("Cancel travel request error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
