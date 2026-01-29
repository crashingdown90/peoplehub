// @ai:cl - Payroll report API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ReportService } from "@/services/report";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/reports/payroll - Generate payroll report
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
        const period = searchParams.get("period"); // Required: YYYY-MM
        const departmentId = searchParams.get("departmentId") || undefined;
        const employeeId = searchParams.get("employeeId") || undefined;
        const format = searchParams.get("format") || "json";

        if (!period) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Parameter 'period' is required (format: YYYY-MM)" } },
                { status: 400 }
            );
        }

        const filter = { period, departmentId, employeeId };
        const result = await ReportService.generatePayrollReport(context, filter);

        if (!result.success) {
            const status = result.error?.code === "FORBIDDEN" ? 403 : 400;
            return NextResponse.json(
                { success: false, error: result.error },
                { status }
            );
        }

        if (format === "csv" && result.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const csv = ReportService.toCSV(result.data as any);
            const filename = `payroll-report-${period}.csv`;
            return new NextResponse(csv, {
                headers: ReportService.getCSVHeaders(filename),
            });
        }

        return NextResponse.json({
            success: true,
            ...result.data,
        });
    } catch (error) {
        console.error("Generate payroll report error:", error);
        return handlePrismaError(error);
    }
}
