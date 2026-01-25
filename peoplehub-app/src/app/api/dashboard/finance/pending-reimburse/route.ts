// @ai:cl - Pending reimbursement API for Finance dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/dashboard/finance/pending-reimburse - Get pending reimbursement requests
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (!["FINANCE", "HRD", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    if (status) {
      where.status = status;
    } else {
      // Default to pending and approved (awaiting payment)
      where.status = { in: ["PENDING", "APPROVED"] };
    }

    // Get reimbursement requests
    const requests = await prisma.reimburseRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            fullName: true,
            employeeNumber: true,
            branch: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
        items: true,
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    // Get summary by status
    const statusSummary = await prisma.reimburseRequest.groupBy({
      by: ["status"],
      where: { tenantId: context.tenantId },
      _count: { status: true },
      _sum: { totalAmount: true },
    });

    const summary = {
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 },
    };

    for (const s of statusSummary) {
      const key = s.status.toLowerCase() as keyof typeof summary;
      if (summary[key]) {
        summary[key].count = s._count.status;
        summary[key].amount = Number(s._sum.totalAmount || 0);
      }
    }

    // Get by category
    const byCategory = await prisma.reimburseRequest.groupBy({
      by: ["category"],
      where: {
        tenantId: context.tenantId,
        status: { in: ["PENDING", "APPROVED"] },
      },
      _count: true,
      _sum: { totalAmount: true },
    });

    // Get monthly trend (last 6 months)
    const today = new Date();
    const monthlyTrend = [];

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const monthStats = await prisma.reimburseRequest.aggregate({
        where: {
          tenantId: context.tenantId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _count: true,
        _sum: { totalAmount: true },
      });

      const paidStats = await prisma.reimburseRequest.aggregate({
        where: {
          tenantId: context.tenantId,
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalAmount: true },
      });

      monthlyTrend.unshift({
        month: monthStart.toLocaleDateString("id-ID", { month: "short" }),
        requested: monthStats._count,
        requestedAmount: Number(monthStats._sum.totalAmount || 0),
        paidAmount: Number(paidStats._sum.totalAmount || 0),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        totalPending: summary.pending.count + summary.approved.count,
        totalPendingAmount: summary.pending.amount + summary.approved.amount,
        requests: requests.map((r) => ({
          id: r.id,
          employee: r.employee,
          category: r.category,
          description: r.description,
          totalAmount: Number(r.totalAmount),
          status: r.status,
          receipts: r.receipts,
          items: r.items,
          createdAt: r.createdAt,
          managerApprovedAt: r.managerApprovedAt,
          financeApprovedAt: r.financeApprovedAt,
          paidAt: r.paidAt,
        })),
        byCategory: byCategory.map((c) => ({
          category: c.category,
          count: c._count,
          amount: Number(c._sum.totalAmount || 0),
        })),
        monthlyTrend,
      },
    });
  } catch (error) {
    console.error("Get pending reimburse error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}
