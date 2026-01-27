// @ai:cl - Pending approvals API for manager dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/dashboard/manager/pending-approvals - Get all pending items awaiting manager approval
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (!["MANAGER", "HRD", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get subordinate IDs
    const subordinates = await prisma.employee.findMany({
      where: {
        tenantId: context.tenantId,
        managerId: context.employeeId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    const subordinateIds = subordinates.map((s) => s.id);

    // If no subordinates, return empty
    if (subordinateIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: { total: 0, leave: 0, correction: 0, reimburse: 0 },
          items: [],
        },
      });
    }

    // Get pending leave requests
    const pendingLeaves = await prisma.leaveRequest.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: subordinateIds },
        status: "PENDING",
      },
      include: {
        employee: { select: { fullName: true, employeeNumber: true } },
        leaveType: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    // Get pending attendance corrections
    const pendingCorrections = await prisma.attendanceCorrection.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: subordinateIds },
        status: "PENDING",
      },
      include: {
        employee: { select: { fullName: true, employeeNumber: true } },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    // Get pending reimburse requests
    const pendingReimburse = await prisma.reimburseRequest.findMany({
      where: {
        tenantId: context.tenantId,
        employeeId: { in: subordinateIds },
        status: "PENDING",
      },
      include: {
        employee: { select: { fullName: true, employeeNumber: true } },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    // Combine all items
    const allItems = [
      ...pendingLeaves.map((l) => ({
        id: l.id,
        type: "LEAVE" as const,
        employee: l.employee,
        title: `Cuti ${l.leaveType.name}`,
        description: `${l.startDate.toLocaleDateString("id-ID")} - ${l.endDate.toLocaleDateString("id-ID")} (${l.totalDays} hari)`,
        reason: l.reason,
        createdAt: l.createdAt,
        urgency: calculateUrgency(l.startDate),
      })),
      ...pendingCorrections.map((c) => ({
        id: c.id,
        type: "CORRECTION" as const,
        employee: c.employee,
        title: "Koreksi Kehadiran",
        description: c.attendanceDate.toLocaleDateString("id-ID"),
        reason: c.reason,
        createdAt: c.createdAt,
        urgency: "normal" as const,
      })),
      ...pendingReimburse.map((r) => ({
        id: r.id,
        type: "REIMBURSE" as const,
        employee: r.employee,
        title: "Reimbursement",
        description: r.description,
        reason: `Rp ${Number(r.totalAmount).toLocaleString("id-ID")}`,
        createdAt: r.createdAt,
        urgency: "normal" as const,
      })),
    ];

    // Sort by createdAt (oldest first for approval queue)
    const sortedItems = allItems.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Summary counts
    const summary = {
      total: allItems.length,
      leave: pendingLeaves.length,
      correction: pendingCorrections.length,
      reimburse: pendingReimburse.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        items: sortedItems.slice(0, limit),
      },
    });
  } catch (error) {
    console.error("Get pending approvals error:", error);
    return handlePrismaError(error);
  }
}

// Helper to calculate urgency based on date
function calculateUrgency(targetDate: Date): "urgent" | "normal" {
  const today = new Date();
  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 3 ? "urgent" : "normal";
}
