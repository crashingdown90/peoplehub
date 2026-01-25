// @ai:cl - Onboarding API routes for list and create
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { OnboardingService } from "@/services/onboarding";
import { z } from "zod";

const createOnboardingSchema = z.object({
  employeeId: z.string().cuid("ID karyawan tidak valid"),
  startDate: z.string().optional(),
  customTasks: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.enum(["DOCUMENTS", "IT_SETUP", "TRAINING", "INTRODUCTION", "OTHER"]),
    assignedTo: z.enum(["EMPLOYEE", "HRD", "IT", "MANAGER"]),
    dueDay: z.number().int().min(0),
    isRequired: z.boolean(),
  })).optional(),
});

// GET /api/admin/onboarding - Get all onboarding checklists
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
      employeeId: searchParams.get("employeeId") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await OnboardingService.getAll(context, filter);

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
    console.error("Get onboarding list error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

// POST /api/admin/onboarding - Start onboarding process
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
    const validation = createOnboardingSchema.safeParse(body);

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

    const result = await OnboardingService.create(context, validation.data);

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
        message: "Proses onboarding berhasil dimulai",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create onboarding error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}
