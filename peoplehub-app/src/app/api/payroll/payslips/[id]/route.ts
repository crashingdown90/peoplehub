// @ai:cl - Get payslip detail using PayrollService
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { PayrollService } from "@/services";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/payroll/payslips/[id] - Get payslip detail
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

    const result = await PayrollService.getPayslipById(context, id);

    if (!result.success) {
      const status = result.error?.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    const payslip = result.data!;

    // Format for display
    const formatDecimal = (val: unknown) => Number(val || 0);

    return NextResponse.json({
      success: true,
      data: {
        id: payslip.id,
        period: payslip.period,
        periodLabel: formatPeriod(payslip.period),
        employee: (payslip as Record<string, unknown>).employee,

        earnings: {
          basicSalary: formatDecimal(payslip.basicSalary),
          allowances: (payslip.allowances as Record<string, number>) || {},
          overtimeAmount: formatDecimal(payslip.overtimeAmount),
          bonus: formatDecimal(payslip.bonus),
        },

        deductions: {
          lateDeduction: formatDecimal(payslip.lateDeduction),
          absentDeduction: formatDecimal(payslip.absentDeduction),
          taxDeduction: formatDecimal(payslip.taxDeduction),
          bpjsKesehatan: formatDecimal(payslip.bpjsKesehatan),
          bpjsKetenagakerjaan: formatDecimal(payslip.bpjsKetenagakerjaan),
          otherDeductions: (payslip.otherDeductions as Record<string, number>) || {},
        },

        summary: {
          grossSalary: formatDecimal(payslip.grossSalary),
          totalDeductions: formatDecimal(payslip.totalDeductions),
          netSalary: formatDecimal(payslip.netSalary),
        },

        attendance: {
          workDays: payslip.workDays,
          presentDays: payslip.presentDays,
          lateDays: payslip.lateDays,
          absentDays: payslip.absentDays,
          leaveDays: payslip.leaveDays,
          overtimeHours: formatDecimal(payslip.overtimeHours),
        },

        publishedAt: payslip.publishedAt,
        notes: payslip.notes,
      },
    });
  } catch (error) {
    console.error("Get payslip detail error:", error);
    return handlePrismaError(error);
  }
}

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}
