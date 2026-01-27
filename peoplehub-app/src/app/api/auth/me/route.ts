import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

/**
 * Mask sensitive string: show only last 4 characters
 * e.g., "1234567890123456" → "************3456"
 */
function maskSensitive(value: string | null | undefined): string | null {
    if (!value) return null;
    if (value.length <= 4) return "****";
    return "*".repeat(value.length - 4) + value.slice(-4);
}

// GET /api/auth/me - Get current user profile
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const currentYear = new Date().getFullYear();

        const user = await prisma.user.findUnique({
            where: { id: context.userId },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                photoUrl: true,
                createdAt: true,
                employee: {
                    select: {
                        id: true,
                        employeeNumber: true,
                        fullName: true,
                        nik: true,
                        npwp: true,
                        phone: true,
                        address: true,
                        employmentType: true,
                        workMode: true,
                        startDate: true,
                        status: true,
                        // Additional fields for complete profile
                        bpjsKesehatan: true,
                        bpjsKetenagakerjaan: true,
                        emergencyContactName: true,
                        emergencyContactPhone: true,
                        bankName: true,
                        bankAccountNumber: true,
                        bankAccountHolder: true,
                        bankBranch: true,
                        branch: { select: { id: true, name: true } },
                        department: { select: { id: true, name: true } },
                        position: { select: { id: true, name: true } },
                        manager: { select: { id: true, fullName: true } },
                        // Leave balances for current year
                        leaveBalances: {
                            where: { year: currentYear },
                            select: {
                                id: true,
                                initialBalance: true,
                                usedBalance: true,
                                remainingBalance: true,
                                leaveType: {
                                    select: {
                                        id: true,
                                        name: true,
                                        code: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
                { status: 404 }
            );
        }

        // Mask sensitive PII data before returning
        const maskedUser = {
            ...user,
            employee: user.employee ? {
                ...user.employee,
                nik: maskSensitive(user.employee.nik),
                npwp: maskSensitive(user.employee.npwp),
                bankAccountNumber: maskSensitive(user.employee.bankAccountNumber),
                bpjsKesehatan: maskSensitive(user.employee.bpjsKesehatan),
                bpjsKetenagakerjaan: maskSensitive(user.employee.bpjsKetenagakerjaan),
            } : null,
        };

        return NextResponse.json({ success: true, data: maskedUser });
    } catch (error) {
        console.error("Get me error:", error);
        return handlePrismaError(error);
    }
}
