// @ai:cl - All pending approvals API for HRD dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/dashboard/hrd/all-pending - Get all pending items company-wide
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type"); // LEAVE, CORRECTION, REIMBURSE, REGISTRATION, TRAVEL

    // Get all pending items across the company
    const results: Record<string, unknown> = {};

    // Pending registrations
    if (!type || type === "REGISTRATION") {
      const pendingRegistrations = await prisma.user.findMany({
        where: {
          tenantId: context.tenantId,
          status: "PENDING",
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        take: limit,
      });
      results.registrations = {
        count: pendingRegistrations.length,
        items: pendingRegistrations,
      };
    }

    // Pending leave requests (awaiting HRD approval)
    if (!type || type === "LEAVE") {
      const pendingLeaves = await prisma.leaveRequest.findMany({
        where: {
          tenantId: context.tenantId,
          status: { in: ["PENDING", "APPROVED_MANAGER"] },
        },
        include: {
          employee: { select: { fullName: true, employeeNumber: true, branch: { select: { name: true } } } },
          leaveType: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: "asc" },
        take: limit,
      });
      results.leaves = {
        count: pendingLeaves.length,
        items: pendingLeaves.map((l) => ({
          id: l.id,
          employee: l.employee,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
          totalDays: l.totalDays,
          reason: l.reason,
          status: l.status,
          createdAt: l.createdAt,
        })),
      };
    }

    // Pending attendance corrections
    if (!type || type === "CORRECTION") {
      const pendingCorrections = await prisma.attendanceCorrection.findMany({
        where: {
          tenantId: context.tenantId,
          status: "PENDING",
        },
        include: {
          employee: { select: { fullName: true, employeeNumber: true, branch: { select: { name: true } } } },
        },
        orderBy: { createdAt: "asc" },
        take: limit,
      });
      results.corrections = {
        count: pendingCorrections.length,
        items: pendingCorrections.map((c) => ({
          id: c.id,
          employee: c.employee,
          attendanceDate: c.attendanceDate,
          requestedClockIn: c.requestedClockIn,
          requestedClockOut: c.requestedClockOut,
          reason: c.reason,
          createdAt: c.createdAt,
        })),
      };
    }

    // Pending reimburse requests
    if (!type || type === "REIMBURSE") {
      const pendingReimburse = await prisma.reimburseRequest.findMany({
        where: {
          tenantId: context.tenantId,
          status: "PENDING",
        },
        include: {
          employee: { select: { fullName: true, employeeNumber: true, branch: { select: { name: true } } } },
        },
        orderBy: { createdAt: "asc" },
        take: limit,
      });
      results.reimburse = {
        count: pendingReimburse.length,
        items: pendingReimburse.map((r) => ({
          id: r.id,
          employee: r.employee,
          totalAmount: Number(r.totalAmount),
          description: r.description,
          category: r.category,
          createdAt: r.createdAt,
        })),
      };
    }

    // Pending travel requests
    if (!type || type === "TRAVEL") {
      const pendingTravel = await prisma.travelRequest.findMany({
        where: {
          tenantId: context.tenantId,
          status: "PENDING",
        },
        include: {
          employee: { select: { fullName: true, employeeNumber: true, branch: { select: { name: true } } } },
        },
        orderBy: { createdAt: "asc" },
        take: limit,
      });
      results.travel = {
        count: pendingTravel.length,
        items: pendingTravel.map((t) => ({
          id: t.id,
          employee: t.employee,
          destination: t.destination,
          purpose: t.purpose,
          departureDate: t.departureDate,
          returnDate: t.returnDate,
          estimatedBudget: Number(t.estimatedBudget),
          createdAt: t.createdAt,
        })),
      };
    }

    // Calculate totals
    const summary = {
      total: 0,
      registrations: 0,
      leaves: 0,
      corrections: 0,
      reimburse: 0,
      travel: 0,
    };

    if (results.registrations) {
      summary.registrations = (results.registrations as { count: number }).count;
      summary.total += summary.registrations;
    }
    if (results.leaves) {
      summary.leaves = (results.leaves as { count: number }).count;
      summary.total += summary.leaves;
    }
    if (results.corrections) {
      summary.corrections = (results.corrections as { count: number }).count;
      summary.total += summary.corrections;
    }
    if (results.reimburse) {
      summary.reimburse = (results.reimburse as { count: number }).count;
      summary.total += summary.reimburse;
    }
    if (results.travel) {
      summary.travel = (results.travel as { count: number }).count;
      summary.total += summary.travel;
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        ...results,
      },
    });
  } catch (error) {
    console.error("Get all pending error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}
