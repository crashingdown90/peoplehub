// @ai:cl - Report builder API routes for list and save config
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { ReportBuilderService } from "@/services/report-builder";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const columnSchema = z.object({
  field: z.string(),
  label: z.string(),
  type: z.enum(["string", "number", "date", "boolean", "currency"]),
  format: z.string().optional(),
  width: z.number().optional(),
});

const filterSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "contains", "in", "between"]),
  value: z.unknown(),
});

const saveConfigSchema = z.object({
  type: z.enum(["ATTENDANCE", "LEAVE", "PAYROLL", "EMPLOYEE", "KPI", "TRAVEL", "REIMBURSE", "CUSTOM"]),
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional(),
  columns: z.array(columnSchema).min(1, "Minimal pilih 1 kolom"),
  filters: z.array(filterSchema).optional().default([]),
  groupBy: z.array(z.string()).optional(),
  sortBy: z.array(z.object({
    field: z.string(),
    order: z.enum(["asc", "desc"]),
  })).optional(),
  aggregations: z.array(z.object({
    field: z.string(),
    function: z.enum(["sum", "avg", "count", "min", "max"]),
  })).optional(),
  isPublic: z.boolean().optional().default(false),
});

// GET /api/reports/builder - Get saved report configs
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = {
      type: searchParams.get("type") as "ATTENDANCE" | "LEAVE" | "PAYROLL" | "EMPLOYEE" | "KPI" | undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await ReportBuilderService.getSavedReports(context, filter);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("Get saved reports error:", error);
    return handlePrismaError(error);
  }
}

// POST /api/reports/builder - Save report config
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
    const validation = saveConfigSchema.safeParse(body);

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

    const { isPublic, ...config } = validation.data;
    const result = await ReportBuilderService.saveConfig(context, config, isPublic);

    if (!result.success) {
      const status = result.error?.code === "FORBIDDEN" ? 403 : 422;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Konfigurasi laporan berhasil disimpan",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Save report config error:", error);
    return handlePrismaError(error);
  }
}
