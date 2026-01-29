// @ai:cl - Attendance report API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ReportService } from "@/services/report";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/reports/attendance - Generate attendance report
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
        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;
        const departmentId = searchParams.get("departmentId") || undefined;
        const branchId = searchParams.get("branchId") || undefined;
        const employeeId = searchParams.get("employeeId") || undefined;
        const format = searchParams.get("format") || "json"; // json or csv

        const filter = { startDate, endDate, departmentId, branchId, employeeId };
        const result = await ReportService.generateAttendanceReport(context, filter);

        if (!result.success) {
            const status = result.error?.code === "FORBIDDEN" ? 403 : 400;
            return NextResponse.json(
                { success: false, error: result.error },
                { status }
            );
        }

        // Return CSV if requested
        if (format === "csv" && result.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const csv = ReportService.toCSV(result.data as any);
            const filename = `attendance-report-${new Date().toISOString().split("T")[0]}.csv`;
            return new NextResponse(csv, {
                headers: ReportService.getCSVHeaders(filename),
            });
        }

        return NextResponse.json({
            success: true,
            ...result.data,
        });
    } catch (error) {
        console.error("Generate attendance report error:", error);
        return handlePrismaError(error);
    }
}
