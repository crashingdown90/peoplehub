// @ai:cl - Leave requests using LeaveService
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { LeaveService } from "@/services";
import { z } from "zod";
import { validateCsrf, getCsrfErrorResponse } from "@/lib/security/csrf";
import { handlePrismaError } from "@/lib/api-utils";

const leaveRequestSchema = z.object({
  leaveTypeId: z.string().cuid("Jenis cuti wajib dipilih"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  reason: z.string().min(10, "Alasan minimal 10 karakter"),
  delegateToId: z.string().cuid().optional(),
});

// GET /api/leave/requests - Get my leave requests
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as
      | "PENDING"
      | "APPROVED_MANAGER"
      | "APPROVED_HRD"
      | "APPROVED"
      | "REJECTED"
      | "CANCELLED"
      | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await LeaveService.getRequests(context, {
      status: status || undefined,
      page,
      limit,
    });

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
    console.error("Get leave requests error:", error);
    return handlePrismaError(error);
  }
}

// POST /api/leave/requests - Create leave request
export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfResult = await validateCsrf(request.headers);
    if (!csrfResult.valid) {
      return NextResponse.json(getCsrfErrorResponse(), { status: 403 });
    }

    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = leaveRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: validationResult.error.issues },
        },
        { status: 400 }
      );
    }

    const { leaveTypeId, startDate, endDate, reason, delegateToId } = validationResult.data;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Tanggal selesai harus setelah tanggal mulai" } },
        { status: 400 }
      );
    }

    // Use LeaveService to create request
    const result = await LeaveService.createRequest(context, {
      leaveTypeId,
      startDate: start,
      endDate: end,
      reason,
      delegateToId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    const leaveRequest = result.data!;

    // Get leave type info for audit log
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
      select: { name: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "LEAVE_REQUESTED",
        objectType: "LeaveRequest",
        objectId: leaveRequest.id,
        afterData: JSON.parse(JSON.stringify({
          leaveType: leaveType?.name,
          startDate,
          endDate,
          totalDays: leaveRequest.totalDays,
          reason,
        })),
      },
    });

    // Get updated balance
    const balance = await prisma.leaveBalance.findFirst({
      where: {
        tenantId: context.tenantId,
        employeeId: context.employeeId,
        leaveTypeId,
        year: start.getFullYear(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: leaveRequest.id,
          leaveTypeId: leaveRequest.leaveTypeId,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          totalDays: leaveRequest.totalDays,
          status: leaveRequest.status,
          balanceAfter: balance?.remainingBalance,
        },
        message: "Pengajuan cuti berhasil. Menunggu persetujuan atasan.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create leave request error:", error);
    return handlePrismaError(error);
  }
}
