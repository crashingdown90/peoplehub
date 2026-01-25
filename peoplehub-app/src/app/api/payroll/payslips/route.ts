// @ai:cl - Get payslips using PayrollService
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { PayrollService } from "@/services";
import type { PayslipStatus, Payslip } from "@prisma/client";

// Type for payslip with employee relation
interface PayslipWithEmployee extends Payslip {
  employee?: {
    id: string;
    fullName: string;
    employeeNumber: string;
    department?: { name: string } | null;
  };
}

// GET /api/payroll/payslips - Get payslips (own or all for admin)
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    const isAdmin = hasRole(context, ["HRD", "FINANCE", "SUPER_ADMIN"]);

    // Non-admin users need employeeId
    if (!isAdmin && !context.employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || undefined;
    const status = searchParams.get("status") as PayslipStatus | null;
    const employeeId = searchParams.get("employeeId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await PayrollService.getPayslips(context, {
      period,
      status: status || undefined,
      employeeId: isAdmin ? employeeId : context.employeeId,
      page,
      limit,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Format response based on role
    // Cast to include employee relation which is included by the service
    const payslips = result.data as unknown as PayslipWithEmployee[];
    const data = payslips?.map((p) => ({
      id: p.id,
      period: p.period,
      periodFormatted: formatPeriod(p.period),
      basicSalary: Number(p.basicSalary),
      grossSalary: Number(p.grossSalary),
      totalDeductions: Number(p.totalDeductions),
      netSalary: Number(p.netSalary),
      workDays: p.workDays,
      presentDays: p.presentDays,
      status: p.status,
      publishedAt: p.publishedAt,
      // Include employee data for admin
      ...(isAdmin && p.employee ? {
        employee: {
          id: p.employee.id,
          fullName: p.employee.fullName,
          employeeNumber: p.employee.employeeNumber,
          department: p.employee.department ? { name: p.employee.department.name } : undefined,
        },
      } : {}),
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("Get payslips error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${months[parseInt(month) - 1]} ${year}`;
}
