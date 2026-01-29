// @ai:cl - Employee Bank Change Request API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

// Validation schema for new bank change request
const BankChangeRequestSchema = z.object({
    newBankName: z.string().min(2, "Nama bank harus diisi"),
    newAccountNumber: z.string().min(5, "Nomor rekening minimal 5 karakter"),
    newAccountHolder: z.string().min(2, "Nama pemilik rekening harus diisi"),
    newBankBranch: z.string().optional(),
    reason: z.string().min(10, "Alasan perubahan minimal 10 karakter"),
});

// GET /api/profile/bank-change-request - Get employee's bank change requests
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "NO_EMPLOYEE", message: "Data karyawan tidak ditemukan" } },
                { status: 404 }
            );
        }

        // Get all bank change requests for this employee
        const requests = await prisma.bankChangeRequest.findMany({
            where: {
                tenantId: context.tenantId,
                employeeId: context.employeeId,
            },
            orderBy: { createdAt: "desc" },
        });

        // Get current bank info from employee
        const employee = await prisma.employee.findUnique({
            where: { id: context.employeeId },
            select: {
                bankName: true,
                bankAccountNumber: true,
                bankAccountHolder: true,
                bankBranch: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                requests,
                currentBankInfo: employee,
            },
        });
    } catch (error) {
        console.error("GET /api/profile/bank-change-request error:", error);
        return handlePrismaError(error);
    }
}

// POST /api/profile/bank-change-request - Submit new bank change request
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "NO_EMPLOYEE", message: "Data karyawan tidak ditemukan" } },
                { status: 404 }
            );
        }

        // Check for existing pending request
        const existingPending = await prisma.bankChangeRequest.findFirst({
            where: {
                tenantId: context.tenantId,
                employeeId: context.employeeId,
                status: "PENDING",
            },
        });

        if (existingPending) {
            return NextResponse.json(
                { success: false, error: { code: "PENDING_EXISTS", message: "Anda masih memiliki pengajuan yang belum diproses" } },
                { status: 400 }
            );
        }

        const body = await request.json();
        const validation = BankChangeRequestSchema.safeParse(body);

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

        // Get current bank info
        const employee = await prisma.employee.findUnique({
            where: { id: context.employeeId },
            select: {
                bankName: true,
                bankAccountNumber: true,
                bankAccountHolder: true,
                bankBranch: true,
            },
        });

        // Create bank change request
        const bankChangeRequest = await prisma.bankChangeRequest.create({
            data: {
                tenantId: context.tenantId,
                employeeId: context.employeeId,
                oldBankName: employee?.bankName,
                oldAccountNumber: employee?.bankAccountNumber,
                oldAccountHolder: employee?.bankAccountHolder,
                oldBankBranch: employee?.bankBranch,
                newBankName: validation.data.newBankName,
                newAccountNumber: validation.data.newAccountNumber,
                newAccountHolder: validation.data.newAccountHolder,
                newBankBranch: validation.data.newBankBranch || null,
                reason: validation.data.reason,
                status: "PENDING",
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "BANK_CHANGE_REQUESTED",
                objectType: "BankChangeRequest",
                objectId: bankChangeRequest.id,
                afterData: JSON.parse(JSON.stringify(validation.data)),
            },
        });

        return NextResponse.json({
            success: true,
            data: bankChangeRequest,
            message: "Pengajuan perubahan data bank berhasil dikirim",
        });
    } catch (error) {
        console.error("POST /api/profile/bank-change-request error:", error);
        return handlePrismaError(error);
    }
}
