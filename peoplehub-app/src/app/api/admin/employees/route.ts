// @ai:cl - Get and Create employees using EmployeeService
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { EmployeeService } from "@/services";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const createEmployeeSchema = z.object({
    userId: z.string().min(1, "User ID wajib diisi"),
    fullName: z.string().min(2, "Nama minimal 2 karakter"),
    employeeNumber: z.string().min(1, "NIK karyawan wajib diisi"),
    nik: z.string().optional(),
    npwp: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    branchId: z.string().optional(),
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
    managerId: z.string().optional(),
    employmentType: z.enum(["PERMANENT", "CONTRACT", "FREELANCE", "INTERN"]).default("PERMANENT"),
    workMode: z.enum(["WFO", "WFH", "HYBRID"]).default("WFO"),
    startDate: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankAccountHolder: z.string().optional(),
});

// GET /api/admin/employees - List all employees (HRD)
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || undefined;
        const status = searchParams.get("status");
        const departmentId = searchParams.get("departmentId") || undefined;
        const branchId = searchParams.get("branchId") || undefined;
        const tenantId = searchParams.get("tenantId") || undefined;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const result = await EmployeeService.getEmployees(context, {
            search,
            status: status as "ACTIVE" | "INACTIVE" | "TERMINATED" | undefined,
            departmentId,
            branchId,
            tenantId, // For Super Admin cross-tenant access
            page,
            limit,
        });

        if (!result.success) {
            const status = result.error?.code === "FORBIDDEN" ? 403 : 400;
            return NextResponse.json(
                { success: false, error: result.error },
                { status }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        console.error("Get employees error:", error);
        return handlePrismaError(error);
    }
}

// POST /api/admin/employees - Create new employee
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

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
        const validation = createEmployeeSchema.safeParse(body);

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
        const result = await EmployeeService.createEmployee(context, {
            userId: data.userId,
            fullName: data.fullName,
            employeeNumber: data.employeeNumber,
            nik: data.nik,
            npwp: data.npwp,
            phone: data.phone,
            address: data.address,
            branchId: data.branchId,
            departmentId: data.departmentId,
            positionId: data.positionId,
            managerId: data.managerId,
            employmentType: data.employmentType,
            workMode: data.workMode,
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            bankName: data.bankName,
            bankAccountNumber: data.bankAccountNumber,
            bankAccountHolder: data.bankAccountHolder,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 422 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                data: result.data,
                message: "Karyawan berhasil ditambahkan",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create employee error:", error);
        return handlePrismaError(error);
    }
}
