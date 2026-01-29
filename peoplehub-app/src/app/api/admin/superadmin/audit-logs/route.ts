// @ai:cl - SuperAdmin Audit Logs API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/tenant";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/admin/superadmin/audit-logs - List all audit logs across tenants
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (context.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const actorId = searchParams.get("actorId");
    const action = searchParams.get("action");
    const objectType = searchParams.get("objectType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (actorId) {
      where.actorId = actorId;
    }

    if (action) {
      where.action = action;
    }

    if (objectType) {
      where.objectType = objectType;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Search in objectId or ipAddress
    if (search) {
      where.OR = [
        { objectId: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get audit logs with relations
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get tenant and actor info for each log
    const tenantIds = [...new Set(auditLogs.map(log => log.tenantId))];
    const actorIds = [...new Set(auditLogs.map(log => log.actorId).filter(Boolean))] as string[];

    const [tenants, actors] = await Promise.all([
      prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true, code: true },
      }),
      actorIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, fullName: true, email: true, role: true },
          })
        : Promise.resolve([] as Array<{ id: string; fullName: string; email: string; role: string }>),
    ]);

    const tenantMap = new Map(tenants.map(t => [t.id, t]));
    const actorMap = new Map(actors.map((a: { id: string; fullName: string; email: string; role: string }) => [a.id, a]));

    // Enrich audit logs with tenant and actor info
    const enrichedLogs = auditLogs.map(log => ({
      id: log.id,
      tenantId: log.tenantId,
      tenant: tenantMap.get(log.tenantId) || null,
      actorId: log.actorId,
      actor: log.actorId ? actorMap.get(log.actorId) || null : null,
      action: log.action,
      objectType: log.objectType,
      objectId: log.objectId,
      beforeData: log.beforeData,
      afterData: log.afterData,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));

    // Get summary statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      todayCount,
      weekCount,
      actionDistribution,
      objectTypeDistribution,
    ] = await Promise.all([
      prisma.auditLog.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.auditLog.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: { action: true },
        orderBy: { _count: { action: "desc" } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ["objectType"],
        _count: { objectType: true },
        orderBy: { _count: { objectType: "desc" } },
        take: 10,
      }),
    ]);

    // Get distinct values for filters
    const [distinctActions, distinctObjectTypes] = await Promise.all([
      prisma.auditLog.findMany({
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
      }),
      prisma.auditLog.findMany({
        select: { objectType: true },
        distinct: ["objectType"],
        orderBy: { objectType: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs: enrichedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          todayCount,
          weekCount,
          totalCount: total,
          actionDistribution: actionDistribution.map(item => ({
            action: item.action,
            count: item._count.action,
          })),
          objectTypeDistribution: objectTypeDistribution.map(item => ({
            objectType: item.objectType,
            count: item._count.objectType,
          })),
        },
        filters: {
          actions: distinctActions.map(d => d.action),
          objectTypes: distinctObjectTypes.map(d => d.objectType),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/superadmin/audit-logs error:", error);
    return handlePrismaError(error);
  }
}
