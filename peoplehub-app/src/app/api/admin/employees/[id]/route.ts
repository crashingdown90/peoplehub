// @ai:cl - Employee CRUD operations using EmployeeService
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { EmployeeService } from "@/services";
import { z } from "zod";

const updateEmployeeSchema = z.object({
    fullName: z.string().min(2).optional(),
    nik: z.string().optional(),
    npwp: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    branchId: z.string().optional(),
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
    managerId: z.string().nullable().optional(),
    employmentType: z.enum(["PERMANENT", "CONTRACT", "FREELANCE", "INTERN"]).optional(),
    workMode: z.enum(["WFO", "WFH", "HYBRID"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]).optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankAccountHolder: z.string().optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/employees/[id] - Get employee detail with related data
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        // Only HRD and Super Admin can access admin employee detail
        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        // Use service to get employee with basic access validation
        const employeeResult = await EmployeeService.getEmployeeById(context, id);

        if (!employeeResult.success) {
            const status = employeeResult.error?.code === "NOT_FOUND" ? 404 : 403;
            return NextResponse.json(
                { success: false, error: employeeResult.error },
                { status }
            );
        }

        // Get additional admin-specific data in parallel
        const [recentAttendances, leaveBalances, recentLeaveRequests, recentPayslips] = await Promise.all([
            prisma.attendance.findMany({
                where: { employeeId: id, tenantId: context.tenantId },
                orderBy: { attendanceDate: "desc" },
                take: 10,
            }),
            prisma.leaveBalance.findMany({
                where: { employeeId: id, tenantId: context.tenantId },
                include: { leaveType: true },
            }),
            prisma.leaveRequest.findMany({
                where: { employeeId: id, tenantId: context.tenantId },
                orderBy: { createdAt: "desc" },
                take: 5,
                include: { leaveType: true },
            }),
            prisma.payslip.findMany({
                where: { employeeId: id, tenantId: context.tenantId },
                orderBy: { period: "desc" },
                take: 3,
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                ...employeeResult.data,
                attendances: recentAttendances,
                leaveBalances,
                leaveRequests: recentLeaveRequests,
                payslips: recentPayslips,
            },
        });
    } catch (error) {
        console.error("Get employee detail error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// PUT /api/admin/employees/[id] - Update employee
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validation = updateEmployeeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Data tidak valid",
                        details: validation.error.issues,
                    },
                },
                { status: 400 }
            );
        }

        const data = validation.data;
        const result = await EmployeeService.updateEmployee(context, id, {
            fullName: data.fullName,
            nik: data.nik,
            npwp: data.npwp,
            phone: data.phone,
            address: data.address,
            branchId: data.branchId,
            departmentId: data.departmentId,
            positionId: data.positionId,
            managerId: data.managerId ?? undefined,
            employmentType: data.employmentType,
            workMode: data.workMode,
            status: data.status,
            bankName: data.bankName,
            bankAccountNumber: data.bankAccountNumber,
            bankAccountHolder: data.bankAccountHolder,
        });

        if (!result.success) {
            const status = result.error?.code === "NOT_FOUND" ? 404 : 422;
            return NextResponse.json(
                { success: false, error: result.error },
                { status }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            message: "Data karyawan berhasil diperbarui",
        });
    } catch (error) {
        console.error("Update employee error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/employees/[id] - Terminate employee
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const endDateStr = searchParams.get("endDate");
        const endDate = endDateStr ? new Date(endDateStr) : new Date();

        const result = await EmployeeService.terminateEmployee(context, id, endDate);

        if (!result.success) {
            const status = result.error?.code === "NOT_FOUND" ? 404 : 422;
            return NextResponse.json(
                { success: false, error: result.error },
                { status }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            message: "Karyawan berhasil di-terminate",
        });
    } catch (error) {
        console.error("Terminate employee error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
            { status: 500 }
        );
    }
}
