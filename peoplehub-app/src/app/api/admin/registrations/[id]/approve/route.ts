// @ai:cl - Registration approval API - Auto-creates Employee record
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { EmailService } from "@/services/email";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * Generate unique employee number for tenant
 * Format: TENANT_CODE + YEAR + 5-digit sequential number
 * Example: KRT202500001
 */
async function generateEmployeeNumber(tenantId: string, tenantCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${tenantCode}${year}`;

    // Get the latest employee number for this tenant and year
    const latestEmployee = await prisma.employee.findFirst({
        where: {
            tenantId,
            employeeNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            employeeNumber: "desc",
        },
        select: {
            employeeNumber: true,
        },
    });

    let nextNumber = 1;
    if (latestEmployee?.employeeNumber) {
        const currentNumber = parseInt(latestEmployee.employeeNumber.slice(prefix.length), 10);
        if (!isNaN(currentNumber)) {
            nextNumber = currentNumber + 1;
        }
    }

    return `${prefix}${nextNumber.toString().padStart(5, "0")}`;
}

// POST /api/admin/registrations/[id]/approve - Approve registration and create Employee
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

        // Get user with tenant info
        const user = await prisma.user.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                status: "PENDING",
            },
            include: {
                tenant: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Registrasi tidak ditemukan" } },
                { status: 404 }
            );
        }

        // Get default branch for this tenant (first one)
        const defaultBranch = await prisma.branch.findFirst({
            where: { tenantId: context.tenantId },
            select: { id: true },
        });

        // Get default department (first one for tenant)
        const defaultDepartment = await prisma.department.findFirst({
            where: { tenantId: context.tenantId },
            select: { id: true },
        });

        // Get default position (first one for tenant)
        const defaultPosition = await prisma.position.findFirst({
            where: { tenantId: context.tenantId },
            select: { id: true },
        });

        // Get tenant code for employee number
        const tenantCode = user.tenant?.code || "EMP";

        // Generate employee number
        const employeeNumber = await generateEmployeeNumber(context.tenantId, tenantCode);

        // Transaction: Update user and create employee
        const result = await prisma.$transaction(async (tx) => {
            // Update user status to ACTIVE
            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: { status: "ACTIVE" },
            });

            // Create employee record
            const employee = await tx.employee.create({
                data: {
                    tenantId: context.tenantId,
                    userId: user.id,
                    employeeNumber,
                    fullName: user.fullName || user.email.split("@")[0],
                    phone: user.phone,
                    // Copy data from user registration
                    nik: user.nik,
                    npwp: user.npwp,
                    address: user.address,
                    emergencyContactName: user.emergencyContactName,
                    emergencyContactPhone: user.emergencyContactPhone,
                    bankName: user.bankName,
                    bankAccountNumber: user.bankAccountNumber,
                    bankAccountHolder: user.bankAccountHolder,
                    // Assign defaults (HRD can change later)
                    branchId: defaultBranch?.id || null,
                    departmentId: defaultDepartment?.id || null,
                    positionId: defaultPosition?.id || null,
                    // Default employment settings
                    employmentType: "PERMANENT",
                    workMode: "WFO",
                    startDate: new Date(),
                    status: "ACTIVE",
                },
            });

            // Create notification for the approved user
            await tx.notification.create({
                data: {
                    tenantId: context.tenantId,
                    userId: user.id,
                    title: "Pendaftaran Disetujui",
                    message: `Selamat! Pendaftaran Anda di ${user.tenant?.name || "perusahaan"} telah disetujui. NIK Anda: ${employeeNumber}. Anda dapat login ke sistem.`,
                    type: "SYSTEM",
                    link: "/dashboard",
                },
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    tenantId: context.tenantId,
                    actorId: context.userId,
                    action: "REGISTRATION_APPROVED",
                    objectType: "User",
                    objectId: user.id,
                    afterData: JSON.parse(JSON.stringify({
                        userId: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        employeeId: employee.id,
                        employeeNumber: employee.employeeNumber,
                        approvedBy: context.userId,
                        approvedAt: new Date().toISOString(),
                    })),
                },
            });

            return { user: updatedUser, employee };
        });

        // Send approval email notification
        try {
            await EmailService.sendTemplate(
                "registrationApproved",
                { email: user.email, name: user.fullName || user.email.split("@")[0] },
                {
                    fullName: user.fullName || user.email.split("@")[0],
                    email: user.email,
                    companyName: user.tenant?.name || "Perusahaan",
                    employeeNumber: result.employee.employeeNumber,
                    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
                }
            );
        } catch (emailError) {
            // Log email error to audit log for tracking
            console.error("Failed to send approval email:", emailError);
            await prisma.auditLog.create({
                data: {
                    tenantId: context.tenantId,
                    actorId: context.userId,
                    action: "EMAIL_SEND_FAILED",
                    objectType: "User",
                    objectId: user.id,
                    afterData: JSON.parse(JSON.stringify({
                        template: "registrationApproved",
                        recipient: user.email,
                        error: emailError instanceof Error ? emailError.message : "Unknown error",
                    })),
                },
            }).catch(() => { /* Ignore audit log errors */ });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: result.user.id,
                email: result.user.email,
                fullName: result.user.fullName,
                status: result.user.status,
                employee: {
                    id: result.employee.id,
                    employeeNumber: result.employee.employeeNumber,
                },
            },
            message: `Registrasi berhasil disetujui. NIK: ${result.employee.employeeNumber}`,
        });
    } catch (error) {
        console.error("Approve registration error:", error);
        return handlePrismaError(error);
    }
}
