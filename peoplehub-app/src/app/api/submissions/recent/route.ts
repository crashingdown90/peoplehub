// @ai:cl - Recent submissions API for employee dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/submissions/recent - Get my recent submissions
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get recent leave requests
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: context.employeeId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        leaveType: { select: { name: true, code: true } },
      },
    });

    // Get recent attendance corrections
    const corrections = await prisma.attendanceCorrection.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: context.employeeId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get recent reimburse requests
    const reimburseRequests = await prisma.reimburseRequest.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: context.employeeId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Combine and sort all submissions
    const allSubmissions = [
      ...leaveRequests.map((lr) => ({
        id: lr.id,
        type: "LEAVE" as const,
        title: `Pengajuan Cuti ${lr.leaveType.name}`,
        description: `${lr.startDate.toLocaleDateString("id-ID")} - ${lr.endDate.toLocaleDateString("id-ID")}`,
        status: lr.status,
        createdAt: lr.createdAt,
        metadata: {
          leaveType: lr.leaveType.code,
          totalDays: lr.totalDays,
        },
      })),
      ...corrections.map((c) => ({
        id: c.id,
        type: "CORRECTION" as const,
        title: "Koreksi Kehadiran",
        description: c.attendanceDate.toLocaleDateString("id-ID"),
        status: c.status,
        createdAt: c.createdAt,
        metadata: {
          requestedClockIn: c.requestedClockIn,
          requestedClockOut: c.requestedClockOut,
        },
      })),
      ...reimburseRequests.map((r) => ({
        id: r.id,
        type: "REIMBURSE" as const,
        title: "Pengajuan Reimbursement",
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        metadata: {
          amount: Number(r.totalAmount),
        },
      })),
    ];

    // Sort by createdAt desc and limit
    const sortedSubmissions = allSubmissions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    // Count by status
    const summary = {
      total: allSubmissions.length,
      pending: allSubmissions.filter((s) => s.status === "PENDING").length,
      approved: allSubmissions.filter((s) =>
        ["APPROVED", "APPROVED_MANAGER"].includes(s.status)
      ).length,
      rejected: allSubmissions.filter((s) => s.status === "REJECTED").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        submissions: sortedSubmissions,
        summary,
      },
    });
  } catch (error) {
    console.error("Get recent submissions error:", error);
    return handlePrismaError(error);
  }
}
