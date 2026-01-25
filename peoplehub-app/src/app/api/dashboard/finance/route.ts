// @ai:cl - Finance dashboard data API
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

// GET /api/dashboard/finance - Get finance-specific dashboard data
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
                { status: 401 }
            );
        }

        // Check if user is Finance or Super Admin
        if (!hasRole(context, ["FINANCE", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak. Hanya untuk Finance." } },
                { status: 403 }
            );
        }

        const { tenantId } = context;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

        // Current payroll period stats
        const payslipStats = await prisma.payslip.groupBy({
            by: ["status"],
            where: { tenantId, period: currentPeriod },
            _count: true,
            _sum: { netSalary: true, grossSalary: true },
        });

        const draftPayslips = payslipStats.find((p) => p.status === "DRAFT");
        const publishedPayslips = payslipStats.find((p) => p.status === "PUBLISHED");

        // Total payroll amount this period
        const totalPayroll = await prisma.payslip.aggregate({
            where: { tenantId, period: currentPeriod },
            _sum: { netSalary: true, grossSalary: true, totalDeductions: true },
        });

        // Pending reimbursements (waiting finance approval)
        const pendingReimbursements = await prisma.reimburseRequest.findMany({
            where: {
                tenantId,
                status: { in: ["PENDING", "APPROVED_MANAGER"] },
            },
            include: {
                employee: {
                    select: {
                        fullName: true,
                        employeeNumber: true,
                        department: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const pendingReimburseTotal = pendingReimbursements.reduce(
            (acc, r) => acc + Number(r.totalAmount),
            0
        );

        // Reimbursements by category this month
        const monthStart = new Date(currentYear, currentMonth, 1);
        const reimbursementsByCategory = await prisma.reimburseRequest.groupBy({
            by: ["category"],
            where: {
                tenantId,
                status: "APPROVED",
                financeApprovedAt: { gte: monthStart },
            },
            _count: true,
            _sum: { totalAmount: true },
        });

        // Pending travel requests
        const pendingTravel = await prisma.travelRequest.findMany({
            where: {
                tenantId,
                status: { in: ["PENDING", "APPROVED_MANAGER"] },
            },
            include: {
                employee: {
                    select: {
                        fullName: true,
                        employeeNumber: true,
                        department: { select: { name: true } },
                    },
                },
            },
            orderBy: { departureDate: "asc" },
            take: 10,
        });

        const pendingTravelBudget = pendingTravel.reduce(
            (acc, t) => acc + Number(t.estimatedBudget),
            0
        );

        // Monthly expense summary (from paid reimbursements)
        const paidReimbursements = await prisma.reimburseRequest.aggregate({
            where: {
                tenantId,
                status: "APPROVED",
                paidAt: { gte: monthStart },
            },
            _sum: { totalAmount: true },
            _count: true,
        });

        // Previous month comparison
        const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const prevMonthEnd = new Date(currentYear, currentMonth, 0);
        const prevMonthPayroll = await prisma.payslip.aggregate({
            where: {
                tenantId,
                period: `${prevMonthStart.getFullYear()}-${String(prevMonthStart.getMonth() + 1).padStart(2, "0")}`,
                status: "PUBLISHED",
            },
            _sum: { netSalary: true },
        });

        // Recent paid reimbursements
        const recentPaidReimbursements = await prisma.reimburseRequest.findMany({
            where: {
                tenantId,
                status: "APPROVED",
                paidAt: { not: null },
            },
            include: {
                employee: { select: { fullName: true, employeeNumber: true } },
            },
            orderBy: { paidAt: "desc" },
            take: 10,
        });

        return NextResponse.json({
            success: true,
            data: {
                payrollPeriod: {
                    period: currentPeriod,
                    periodLabel: today.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
                    totalEmployees: (draftPayslips?._count || 0) + (publishedPayslips?._count || 0),
                    draftCount: draftPayslips?._count || 0,
                    publishedCount: publishedPayslips?._count || 0,
                    totalGrossSalary: Number(totalPayroll._sum.grossSalary || 0),
                    totalNetSalary: Number(totalPayroll._sum.netSalary || 0),
                    totalDeductions: Number(totalPayroll._sum.totalDeductions || 0),
                },
                pendingReimbursements: {
                    count: pendingReimbursements.length,
                    totalAmount: pendingReimburseTotal,
                    list: pendingReimbursements.map((r) => ({
                        id: r.id,
                        employee: r.employee.fullName,
                        employeeNumber: r.employee.employeeNumber,
                        department: r.employee.department?.name,
                        category: r.category,
                        amount: Number(r.totalAmount),
                        description: r.description,
                        status: r.status,
                        createdAt: r.createdAt,
                    })),
                },
                pendingTravel: {
                    count: pendingTravel.length,
                    totalBudget: pendingTravelBudget,
                    list: pendingTravel.map((t) => ({
                        id: t.id,
                        employee: t.employee.fullName,
                        employeeNumber: t.employee.employeeNumber,
                        department: t.employee.department?.name,
                        destination: t.destination,
                        purpose: t.purpose,
                        departureDate: t.departureDate,
                        returnDate: t.returnDate,
                        estimatedBudget: Number(t.estimatedBudget),
                        status: t.status,
                    })),
                },
                monthlyExpenses: {
                    monthName: today.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
                    paidReimbursements: {
                        count: paidReimbursements._count || 0,
                        total: Number(paidReimbursements._sum.totalAmount || 0),
                    },
                    byCategory: reimbursementsByCategory.map((c) => ({
                        category: c.category,
                        count: c._count,
                        total: Number(c._sum.totalAmount || 0),
                    })),
                },
                comparison: {
                    prevMonthPayroll: Number(prevMonthPayroll._sum.netSalary || 0),
                    currentMonthPayroll: Number(totalPayroll._sum.netSalary || 0),
                    payrollChange:
                        prevMonthPayroll._sum.netSalary && totalPayroll._sum.netSalary
                            ? Math.round(
                                  ((Number(totalPayroll._sum.netSalary) - Number(prevMonthPayroll._sum.netSalary)) /
                                      Number(prevMonthPayroll._sum.netSalary)) *
                                      100
                              )
                            : 0,
                },
                recentPaidReimbursements: recentPaidReimbursements.map((r) => ({
                    id: r.id,
                    employee: r.employee.fullName,
                    category: r.category,
                    amount: Number(r.totalAmount),
                    paidAt: r.paidAt,
                })),
            },
        });
    } catch (error) {
        console.error("Get finance dashboard error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
