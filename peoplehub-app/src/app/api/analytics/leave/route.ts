import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

// GET /api/analytics/leave - Leave analytics
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);

        // Leave requests by status
        const byStatus = await prisma.leaveRequest.groupBy({
            by: ["status"],
            where: {
                tenantId: context.tenantId,
                createdAt: { gte: yearStart, lte: yearEnd },
            },
            _count: true,
            _sum: { totalDays: true },
        });

        // By leave type
        const byType = await prisma.leaveRequest.groupBy({
            by: ["leaveTypeId"],
            where: {
                tenantId: context.tenantId,
                createdAt: { gte: yearStart, lte: yearEnd },
                status: "APPROVED",
            },
            _count: true,
            _sum: { totalDays: true },
        });

        const leaveTypes = await prisma.leaveType.findMany({
            where: { tenantId: context.tenantId },
            select: { id: true, name: true },
        });

        // Monthly trend
        const monthlyLeaves = await prisma.leaveRequest.findMany({
            where: {
                tenantId: context.tenantId,
                createdAt: { gte: yearStart, lte: yearEnd },
                status: "APPROVED",
            },
            select: { startDate: true, totalDays: true },
        });

        const monthlyTrend: Record<string, { count: number; days: number }> = {};
        monthlyLeaves.forEach(l => {
            const monthKey = l.startDate.toISOString().slice(0, 7);
            if (!monthlyTrend[monthKey]) {
                monthlyTrend[monthKey] = { count: 0, days: 0 };
            }
            monthlyTrend[monthKey].count++;
            monthlyTrend[monthKey].days += l.totalDays;
        });

        // Top employees by leave days
        const topLeaveTakers = await prisma.leaveRequest.groupBy({
            by: ["employeeId"],
            where: {
                tenantId: context.tenantId,
                createdAt: { gte: yearStart, lte: yearEnd },
                status: "APPROVED",
            },
            _sum: { totalDays: true },
            orderBy: { _sum: { totalDays: "desc" } },
            take: 10,
        });

        const employees = await prisma.employee.findMany({
            where: { id: { in: topLeaveTakers.map(t => t.employeeId) } },
            select: { id: true, fullName: true, employeeNumber: true },
        });

        const totalApproved = byStatus.find(s => s.status === "APPROVED");
        const totalDays = totalApproved?._sum?.totalDays || 0;

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalRequests: byStatus.reduce((sum, s) => sum + s._count, 0),
                    approved: byStatus.find(s => s.status === "APPROVED")?._count || 0,
                    pending: byStatus.find(s => s.status === "PENDING")?._count || 0,
                    rejected: byStatus.find(s => s.status === "REJECTED")?._count || 0,
                    totalDaysUsed: totalDays,
                },
                byType: byType.map(t => ({
                    type: leaveTypes.find(lt => lt.id === t.leaveTypeId)?.name || "Unknown",
                    count: t._count,
                    totalDays: t._sum?.totalDays || 0,
                })),
                monthlyTrend: Object.entries(monthlyTrend).map(([month, data]) => ({
                    month,
                    monthName: new Date(month + "-01").toLocaleDateString("id-ID", { month: "short" }),
                    ...data,
                })).sort((a, b) => a.month.localeCompare(b.month)),
                topLeaveTakers: topLeaveTakers.map(t => ({
                    employee: employees.find(e => e.id === t.employeeId),
                    totalDays: t._sum?.totalDays || 0,
                })),
            },
        });
    } catch (error) {
        console.error("Get leave analytics error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
