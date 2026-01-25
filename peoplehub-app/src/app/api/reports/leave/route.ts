// @ai:cl - Leave report API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ReportService } from "@/services/report";

// GET /api/reports/leave - Generate leave report
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
        const employeeId = searchParams.get("employeeId") || undefined;
        const format = searchParams.get("format") || "json";

        const filter = { startDate, endDate, departmentId, employeeId };
        const result = await ReportService.generateLeaveReport(context, filter);

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
            const filename = `leave-report-${new Date().toISOString().split("T")[0]}.csv`;
            return new NextResponse(csv, {
                headers: ReportService.getCSVHeaders(filename),
            });
        }

        return NextResponse.json({
            success: true,
            ...result.data,
        });
    } catch (error) {
        console.error("Generate leave report error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
