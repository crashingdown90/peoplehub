// @ai:cl - Report generation API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ReportBuilderService } from "@/services/report-builder";
import { z } from "zod";

const generateSchema = z.object({
  configId: z.string().optional(),
  config: z.object({
    type: z.enum(["ATTENDANCE", "LEAVE", "PAYROLL", "EMPLOYEE", "KPI", "TRAVEL", "REIMBURSE", "CUSTOM"]),
    name: z.string(),
    description: z.string().optional(),
    columns: z.array(z.any()),
    filters: z.array(z.any()).optional().default([]),
    groupBy: z.array(z.string()).optional(),
    sortBy: z.array(z.any()).optional(),
    aggregations: z.array(z.any()).optional(),
  }).optional(),
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }).optional(),
  format: z.enum(["JSON", "CSV", "EXCEL", "PDF"]).optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
});

// POST /api/reports/builder/generate - Generate report
export async function POST(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = generateSchema.safeParse(body);

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

    const result = await ReportBuilderService.generate(context, validation.data);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    // For JSON format, return directly
    // For other formats, convert the data (CSV/Excel/PDF generation would be added here)
    const format = validation.data.format || "JSON";

    if (format === "JSON") {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    }

    // For CSV
    if (format === "CSV") {
      const csv = convertToCSV(result.data!);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${result.data!.title}.csv"`,
        },
      });
    }

    // Default to JSON
    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Generate report error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

/**
 * Convert report data to CSV format
 */
function convertToCSV(data: { columns: { field: string; label: string }[]; rows: Record<string, unknown>[] }): string {
  const headers = data.columns.map((c) => c.label).join(",");
  const rows = data.rows.map((row) =>
    data.columns.map((c) => {
      const value = row[c.field];
      if (value === null || value === undefined) return "";
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",")
  ).join("\n");

  return `${headers}\n${rows}`;
}
