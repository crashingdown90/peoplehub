import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

// GET /api/analytics/employees - Employee analytics (turnover, demographics)
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

        // Total employees by status
        const employeesByStatus = await prisma.employee.groupBy({
            by: ["status"],
            where: { tenantId: context.tenantId },
            _count: true,
        });

        // By department
        const byDepartment = await prisma.employee.groupBy({
            by: ["departmentId"],
            where: { tenantId: context.tenantId, status: "ACTIVE" },
            _count: true,
        });

        const departments = await prisma.department.findMany({
            where: { tenantId: context.tenantId },
            select: { id: true, name: true },
        });

        // By branch
        const byBranch = await prisma.employee.groupBy({
            by: ["branchId"],
            where: { tenantId: context.tenantId, status: "ACTIVE" },
            _count: true,
        });

        const branches = await prisma.branch.findMany({
            where: { tenantId: context.tenantId },
            select: { id: true, name: true },
        });

        // By employment type
        const byEmploymentType = await prisma.employee.groupBy({
            by: ["employmentType"],
            where: { tenantId: context.tenantId, status: "ACTIVE" },
            _count: true,
        });

        // By work mode
        const byWorkMode = await prisma.employee.groupBy({
            by: ["workMode"],
            where: { tenantId: context.tenantId, status: "ACTIVE" },
            _count: true,
        });

        // New hires this year
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);

        const newHires = await prisma.employee.count({
            where: {
                tenantId: context.tenantId,
                startDate: { gte: yearStart, lte: yearEnd },
            },
        });

        // Terminations this year
        const terminations = await prisma.employee.count({
            where: {
                tenantId: context.tenantId,
                status: "TERMINATED",
                updatedAt: { gte: yearStart, lte: yearEnd },
            },
        });

        // Monthly hiring trend
        const monthlyHires = await prisma.employee.groupBy({
            by: ["startDate"],
            where: {
                tenantId: context.tenantId,
                startDate: { gte: yearStart, lte: yearEnd },
            },
            _count: true,
        });

        // Group by month
        const hiringTrend: Record<string, number> = {};
        monthlyHires.forEach(h => {
            const monthKey = h.startDate.toISOString().slice(0, 7);
            hiringTrend[monthKey] = (hiringTrend[monthKey] || 0) + h._count;
        });

        const activeCount = employeesByStatus.find(e => e.status === "ACTIVE")?._count || 0;
        const turnoverRate = activeCount > 0 ? Math.round((terminations / activeCount) * 100) : 0;

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    total: employeesByStatus.reduce((sum, e) => sum + e._count, 0),
                    active: activeCount,
                    inactive: employeesByStatus.find(e => e.status === "INACTIVE")?._count || 0,
                    terminated: employeesByStatus.find(e => e.status === "TERMINATED")?._count || 0,
                    newHiresThisYear: newHires,
                    terminationsThisYear: terminations,
                    turnoverRate,
                },
                byDepartment: byDepartment.map(d => ({
                    department: departments.find(dept => dept.id === d.departmentId)?.name || "Unknown",
                    count: d._count,
                })),
                byBranch: byBranch.map(b => ({
                    branch: branches.find(br => br.id === b.branchId)?.name || "Unknown",
                    count: b._count,
                })),
                byEmploymentType: byEmploymentType.map(e => ({
                    type: e.employmentType,
                    count: e._count,
                })),
                byWorkMode: byWorkMode.map(w => ({
                    mode: w.workMode,
                    count: w._count,
                })),
                hiringTrend: Object.entries(hiringTrend).map(([month, count]) => ({
                    month,
                    monthName: new Date(month + "-01").toLocaleDateString("id-ID", { month: "short" }),
                    count,
                })).sort((a, b) => a.month.localeCompare(b.month)),
            },
        });
    } catch (error) {
        console.error("Get employee analytics error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
