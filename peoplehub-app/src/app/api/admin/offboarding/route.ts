// @ai:cl - Offboarding API routes for list and create
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { OffboardingService } from "@/services/offboarding";
import { z } from "zod";

const createOffboardingSchema = z.object({
  employeeId: z.string().cuid("ID karyawan tidak valid"),
  terminationType: z.enum(["RESIGNATION", "TERMINATION", "END_OF_CONTRACT", "RETIREMENT", "LAYOFF"]),
  lastWorkingDate: z.string().min(1, "Tanggal terakhir bekerja wajib diisi"),
  reason: z.string().min(10, "Alasan minimal 10 karakter"),
  customTasks: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.enum(["HANDOVER", "IT_ASSETS", "FINANCE", "DOCUMENTS", "EXIT_INTERVIEW", "OTHER"]),
    assignedTo: z.enum(["EMPLOYEE", "HRD", "IT", "FINANCE", "MANAGER"]),
    isRequired: z.boolean(),
  })).optional(),
});

// GET /api/admin/offboarding - Get all offboarding checklists
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
      status: searchParams.get("status") as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined,
      terminationType: searchParams.get("terminationType") as "RESIGNATION" | "TERMINATION" | "END_OF_CONTRACT" | "RETIREMENT" | "LAYOFF" | undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await OffboardingService.getAll(context, filter);

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
    });
  } catch (error) {
    console.error("Get offboarding list error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

// POST /api/admin/offboarding - Start offboarding process
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
    const validation = createOffboardingSchema.safeParse(body);

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

    const result = await OffboardingService.create(context, validation.data);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 :
        result.error?.code === "CONFLICT" ? 409 : 422;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Proses offboarding berhasil dimulai",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create offboarding error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}
