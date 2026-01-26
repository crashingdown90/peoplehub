import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

// GET /api/admin/audit/export - Export audit logs
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["IT_OPS", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const format = searchParams.get("format") || "json";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const action = searchParams.get("action");
        const limit = parseInt(searchParams.get("limit") || "1000");

        const where = {
            tenantId: context.tenantId,
            ...(startDate && endDate ? {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            } : {}),
            ...(action ? { action: { contains: action } } : {}),
        };

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        if (format === "csv") {
            const headers = ["ID", "Actor ID", "Action", "Object Type", "Object ID", "Created At"];
            const rows = logs.map((log: typeof logs[number]) => [
                log.id,
                log.actorId || "",
                log.action,
                log.objectType,
                log.objectId || "",
                log.createdAt.toISOString(),
            ]);

            const csv = [
                headers.join(","),
                ...rows.map((row: (string | Date)[]) => row.map((cell: string | Date) => `"${cell}"`).join(",")),
            ].join("\n");

            return new Response(csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: logs,
            meta: { count: logs.length, limit },
        });
    } catch (error) {
        console.error("Export audit logs error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
