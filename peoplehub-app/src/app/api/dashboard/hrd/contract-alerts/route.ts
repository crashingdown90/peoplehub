// @ai:cl - Contract expiry alerts API for HRD dashboard
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/dashboard/hrd/contract-alerts - Get contract expiry alerts
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
    const daysAhead = parseInt(searchParams.get("days") || "30");
    const limit = parseInt(searchParams.get("limit") || "50");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Get contract employees with endDate expiring soon
    const expiringContracts = await prisma.employee.findMany({
      where: {
        tenantId: context.tenantId,
        status: "ACTIVE",
        employmentType: "CONTRACT",
        endDate: {
          gte: today,
          lte: futureDate,
        },
      },
      select: {
        id: true,
        fullName: true,
        employeeNumber: true,
        employmentType: true,
        startDate: true,
        endDate: true,
        branch: { select: { name: true } },
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
      orderBy: { endDate: "asc" },
      take: limit,
    });

    // Get already expired contracts (still active employees)
    const expiredContracts = await prisma.employee.findMany({
      where: {
        tenantId: context.tenantId,
        status: "ACTIVE",
        employmentType: "CONTRACT",
        endDate: {
          lt: today,
        },
      },
      select: {
        id: true,
        fullName: true,
        employeeNumber: true,
        employmentType: true,
        startDate: true,
        endDate: true,
        branch: { select: { name: true } },
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
      orderBy: { endDate: "asc" },
      take: limit,
    });

    // Categorize by urgency
    type ContractItem = {
      id: string;
      fullName: string;
      employeeNumber: string;
      employmentType: string;
      startDate: Date;
      endDate: Date | null;
      branch: { name: string } | null;
      department: { name: string } | null;
      position: { name: string } | null;
      daysRemaining: number;
      urgency: "expired" | "critical" | "warning" | "upcoming";
    };

    const categorized: {
      expired: ContractItem[];
      critical: ContractItem[];
      warning: ContractItem[];
      upcoming: ContractItem[];
    } = {
      expired: expiredContracts.map((e) => ({
        ...e,
        daysRemaining: e.endDate ? Math.ceil((e.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        urgency: "expired" as const,
      })),
      critical: [],
      warning: [],
      upcoming: [],
    };

    for (const emp of expiringContracts) {
      if (!emp.endDate) continue;
      const daysRemaining = Math.ceil(
        (emp.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const item: ContractItem = { ...emp, daysRemaining, urgency: "upcoming" };

      if (daysRemaining <= 7) {
        item.urgency = "critical";
        categorized.critical.push(item);
      } else if (daysRemaining <= 14) {
        item.urgency = "warning";
        categorized.warning.push(item);
      } else {
        categorized.upcoming.push(item);
      }
    }

    // Summary
    const summary = {
      expired: categorized.expired.length,
      critical: categorized.critical.length,
      warning: categorized.warning.length,
      upcoming: categorized.upcoming.length,
      total: expiredContracts.length + expiringContracts.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        daysAhead,
        summary,
        contracts: {
          expired: categorized.expired,
          critical: categorized.critical,
          warning: categorized.warning,
          upcoming: categorized.upcoming,
        },
      },
    });
  } catch (error) {
    console.error("Get contract alerts error:", error);
    return handlePrismaError(error);
  }
}
