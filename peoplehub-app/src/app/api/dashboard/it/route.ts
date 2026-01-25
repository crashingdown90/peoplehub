// @ai:cl - IT/Ops dashboard data API
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

// GET /api/dashboard/it - Get IT/Operations-specific dashboard data
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
                { status: 401 }
            );
        }

        // Check if user is IT_OPS or Super Admin
        if (!hasRole(context, ["IT_OPS", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak. Hanya untuk IT/Ops." } },
                { status: 403 }
            );
        }

        const { tenantId } = context;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Login stats from audit logs
        const loginLogs = await prisma.auditLog.groupBy({
            by: ["action"],
            where: {
                tenantId,
                action: { in: ["USER_LOGIN", "USER_LOGIN_FAILED"] },
                createdAt: { gte: today },
            },
            _count: true,
        });

        const todayLogins = {
            success: loginLogs.find((l) => l.action === "USER_LOGIN")?._count || 0,
            failed: loginLogs.find((l) => l.action === "USER_LOGIN_FAILED")?._count || 0,
        };

        // Login trend last 7 days
        const loginTrend = await prisma.auditLog.groupBy({
            by: ["action"],
            where: {
                tenantId,
                action: { in: ["USER_LOGIN", "USER_LOGIN_FAILED"] },
                createdAt: { gte: sevenDaysAgo },
            },
            _count: true,
        });

        // Active users (logged in within last 24 hours)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const activeUsers = await prisma.user.count({
            where: {
                tenantId,
                status: "ACTIVE",
                lastLoginAt: { gte: yesterday },
            },
        });

        // Total active users
        const totalActiveUsers = await prisma.user.count({
            where: { tenantId, status: "ACTIVE" },
        });

        // Webhook status
        const webhooks = await prisma.webhook.findMany({
            where: { tenantId },
            select: { id: true, name: true, url: true, isActive: true, events: true },
        });

        // Recent webhook failures (last 7 days)
        const webhookFailures = await prisma.webhookLog.count({
            where: {
                webhook: { tenantId },
                status: { gte: 400 },
                sentAt: { gte: sevenDaysAgo },
            },
        });

        const recentWebhookLogs = await prisma.webhookLog.findMany({
            where: {
                webhook: { tenantId },
            },
            include: { webhook: { select: { name: true } } },
            orderBy: { sentAt: "desc" },
            take: 20,
        });

        // Support tickets (IT category)
        const openTickets = await prisma.ticket.count({
            where: {
                tenantId,
                category: "IT",
                status: { in: ["OPEN", "IN_PROGRESS"] },
            },
        });

        const recentTickets = await prisma.ticket.findMany({
            where: {
                tenantId,
                category: "IT",
            },
            select: {
                id: true,
                ticketNumber: true,
                subject: true,
                priority: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        // Security alerts (suspicious activities from audit log)
        const suspiciousActivities = await prisma.auditLog.findMany({
            where: {
                tenantId,
                action: { in: ["USER_LOGIN_FAILED", "PASSWORD_RESET_REQUEST", "UNAUTHORIZED_ACCESS"] },
                createdAt: { gte: sevenDaysAgo },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        // Failed logins by user (potential brute force)
        const failedLoginsByUser = await prisma.auditLog.groupBy({
            by: ["actorId"],
            where: {
                tenantId,
                action: "USER_LOGIN_FAILED",
                createdAt: { gte: today },
            },
            _count: true,
            having: { actorId: { _count: { gte: 3 } } },
        });

        // System activity overview
        const recentAuditLogs = await prisma.auditLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 30,
        });

        const auditByAction = await prisma.auditLog.groupBy({
            by: ["action"],
            where: {
                tenantId,
                createdAt: { gte: today },
            },
            _count: true,
        });

        return NextResponse.json({
            success: true,
            data: {
                loginStats: {
                    today: todayLogins,
                    weekTotal: {
                        success: loginTrend.find((l) => l.action === "USER_LOGIN")?._count || 0,
                        failed: loginTrend.find((l) => l.action === "USER_LOGIN_FAILED")?._count || 0,
                    },
                    successRate:
                        todayLogins.success + todayLogins.failed > 0
                            ? Math.round((todayLogins.success / (todayLogins.success + todayLogins.failed)) * 100)
                            : 100,
                },
                activeSessions: {
                    last24Hours: activeUsers,
                    totalActiveUsers,
                    sessionRate: totalActiveUsers > 0 ? Math.round((activeUsers / totalActiveUsers) * 100) : 0,
                },
                webhookStatus: {
                    total: webhooks.length,
                    active: webhooks.filter((w) => w.isActive).length,
                    inactive: webhooks.filter((w) => !w.isActive).length,
                    failuresLast7Days: webhookFailures,
                    webhooks: webhooks.map((w) => ({
                        id: w.id,
                        name: w.name,
                        url: w.url,
                        isActive: w.isActive,
                        eventsCount: w.events.length,
                    })),
                },
                recentWebhookLogs: recentWebhookLogs.map((l) => ({
                    id: l.id,
                    webhookName: l.webhook.name,
                    event: l.event,
                    status: l.status,
                    attempts: l.attempts,
                    sentAt: l.sentAt,
                    isSuccess: l.status >= 200 && l.status < 300,
                })),
                supportTickets: {
                    openCount: openTickets,
                    recent: recentTickets.map((t) => ({
                        id: t.id,
                        ticketNumber: t.ticketNumber,
                        subject: t.subject,
                        priority: t.priority,
                        status: t.status,
                        createdAt: t.createdAt,
                    })),
                },
                securityAlerts: {
                    suspiciousCount: suspiciousActivities.length,
                    potentialBruteForce: failedLoginsByUser.length,
                    recentAlerts: suspiciousActivities.slice(0, 10).map((a) => ({
                        id: a.id,
                        action: a.action,
                        actorId: a.actorId,
                        ipAddress: a.ipAddress,
                        userAgent: a.userAgent,
                        createdAt: a.createdAt,
                    })),
                },
                systemActivity: {
                    todayByAction: auditByAction.map((a) => ({
                        action: a.action,
                        count: a._count,
                    })),
                    recentLogs: recentAuditLogs.slice(0, 15).map((l) => ({
                        id: l.id,
                        action: l.action,
                        objectType: l.objectType,
                        objectId: l.objectId,
                        actorId: l.actorId,
                        createdAt: l.createdAt,
                    })),
                },
            },
        });
    } catch (error) {
        console.error("Get IT dashboard error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
