// @ai:cl - Admin Single Bank Change Request API (approve/reject)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/bank-change-requests/[id] - Get single request
export async function GET(request: NextRequest, { params }: RouteParams) {
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

        const bankChangeRequest = await prisma.bankChangeRequest.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeNumber: true,
                        department: { select: { name: true } },
                        branch: { select: { name: true } },
                    },
                },
            },
        });

        if (!bankChangeRequest) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Pengajuan tidak ditemukan" } },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: bankChangeRequest,
        });
    } catch (error) {
        console.error("GET /api/admin/bank-change-requests/[id] error:", error);
        return handlePrismaError(error);
    }
}

// Validation schemas
const ApproveSchema = z.object({
    action: z.literal("approve"),
});

const RejectSchema = z.object({
    action: z.literal("reject"),
    rejectionReason: z.string().min(10, "Alasan penolakan minimal 10 karakter"),
});

const ActionSchema = z.discriminatedUnion("action", [ApproveSchema, RejectSchema]);

// POST /api/admin/bank-change-requests/[id] - Approve or reject
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        // Get the request
        const bankChangeRequest = await prisma.bankChangeRequest.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
            },
        });

        if (!bankChangeRequest) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Pengajuan tidak ditemukan" } },
                { status: 404 }
            );
        }

        if (bankChangeRequest.status !== "PENDING") {
            return NextResponse.json(
                { success: false, error: { code: "ALREADY_PROCESSED", message: "Pengajuan sudah diproses" } },
                { status: 400 }
            );
        }

        const body = await request.json();
        const validation = ActionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Data tidak valid",
                        details: validation.error.flatten(),
                    },
                },
                { status: 400 }
            );
        }

        if (validation.data.action === "approve") {
            // Update the request status
            await prisma.bankChangeRequest.update({
                where: { id },
                data: {
                    status: "APPROVED",
                    approvedById: context.userId,
                    approvedAt: new Date(),
                },
            });

            // Update employee bank info
            await prisma.employee.update({
                where: { id: bankChangeRequest.employeeId },
                data: {
                    bankName: bankChangeRequest.newBankName,
                    bankAccountNumber: bankChangeRequest.newAccountNumber,
                    bankAccountHolder: bankChangeRequest.newAccountHolder,
                    bankBranch: bankChangeRequest.newBankBranch,
                },
            });

            // Create audit log
            await prisma.auditLog.create({
                data: {
                    tenantId: context.tenantId,
                    actorId: context.userId,
                    action: "BANK_CHANGE_APPROVED",
                    objectType: "BankChangeRequest",
                    objectId: id,
                    afterData: JSON.parse(JSON.stringify({
                        employeeId: bankChangeRequest.employeeId,
                        newBankName: bankChangeRequest.newBankName,
                        newAccountNumber: bankChangeRequest.newAccountNumber,
                    })),
                },
            });

            // Create notification for employee
            const employee = await prisma.employee.findUnique({
                where: { id: bankChangeRequest.employeeId },
                select: { userId: true },
            });

            if (employee?.userId) {
                await prisma.notification.create({
                    data: {
                        tenantId: context.tenantId,
                        userId: employee.userId,
                        type: "APPROVAL",
                        title: "Pengajuan Perubahan Bank Disetujui",
                        message: "Pengajuan perubahan data bank Anda telah disetujui. Data bank Anda sudah diperbarui.",
                    },
                });
            }

            return NextResponse.json({
                success: true,
                message: "Pengajuan perubahan data bank berhasil disetujui",
            });
        } else {
            // Reject the request
            await prisma.bankChangeRequest.update({
                where: { id },
                data: {
                    status: "REJECTED",
                    approvedById: context.userId,
                    approvedAt: new Date(),
                    rejectionReason: validation.data.rejectionReason,
                },
            });

            // Create audit log
            await prisma.auditLog.create({
                data: {
                    tenantId: context.tenantId,
                    actorId: context.userId,
                    action: "BANK_CHANGE_REJECTED",
                    objectType: "BankChangeRequest",
                    objectId: id,
                    afterData: JSON.parse(JSON.stringify({
                        rejectionReason: validation.data.rejectionReason,
                    })),
                },
            });

            // Create notification for employee
            const employee = await prisma.employee.findUnique({
                where: { id: bankChangeRequest.employeeId },
                select: { userId: true },
            });

            if (employee?.userId) {
                await prisma.notification.create({
                    data: {
                        tenantId: context.tenantId,
                        userId: employee.userId,
                        type: "APPROVAL",
                        title: "Pengajuan Perubahan Bank Ditolak",
                        message: `Pengajuan perubahan data bank Anda ditolak. Alasan: ${validation.data.rejectionReason}`,
                    },
                });
            }

            return NextResponse.json({
                success: true,
                message: "Pengajuan perubahan data bank ditolak",
            });
        }
    } catch (error) {
        console.error("POST /api/admin/bank-change-requests/[id] error:", error);
        return handlePrismaError(error);
    }
}
