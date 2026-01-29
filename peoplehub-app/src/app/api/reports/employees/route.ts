// @ai:cl - Employee summary report API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ReportService } from "@/services/report";
import { successResponse, ApiResponses } from "@/lib/api-response";
import { logger } from "@/lib/monitoring/logger";

// GET /api/reports/employees - Generate employee summary report
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return ApiResponses.unauthorized();
        }

        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get("departmentId") || undefined;
        const branchId = searchParams.get("branchId") || undefined;
        const format = searchParams.get("format") || "json";

        const filter = { departmentId, branchId };
        const result = await ReportService.generateEmployeeSummary(context, filter);

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
            const filename = `employees-report-${new Date().toISOString().split("T")[0]}.csv`;
            return new NextResponse(csv, {
                headers: ReportService.getCSVHeaders(filename),
            });
        }

        return successResponse(result.data);
// ...
    } catch (error) {
        logger.error("Generate employee report error", { error: error instanceof Error ? error.message : "Unknown error" });
        return ApiResponses.internalError();
    }
}
