import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";
import crypto from "crypto";
import { handlePrismaError } from "@/lib/api-utils";

const webhookSchema = z.object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    url: z.string().url("URL tidak valid"),
    events: z.array(z.string()).min(1, "Minimal 1 event"),
    headers: z.record(z.string(), z.string()).optional(),
});

// Available webhook events
const WEBHOOK_EVENTS = [
    "attendance.clockin",
    "attendance.clockout",
    "attendance.late",
    "leave.requested",
    "leave.approved",
    "leave.rejected",
    "travel.approved",
    "reimburse.approved",
    "employee.created",
    "employee.terminated",
    "payslip.published",
];

// GET /api/webhooks - List webhooks
export async function GET() {
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

        const webhooks = await prisma.webhook.findMany({
            where: { tenantId: context.tenantId },
            include: {
                logs: {
                    orderBy: { sentAt: "desc" },
                    take: 5,
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            data: webhooks,
            availableEvents: WEBHOOK_EVENTS,
        });
    } catch (error) {
        console.error("Get webhooks error:", error);
        return handlePrismaError(error);
    }
}

// POST /api/webhooks - Create webhook
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const result = webhookSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        // Validate events
        const invalidEvents = result.data.events.filter(e => !WEBHOOK_EVENTS.includes(e));
        if (invalidEvents.length > 0) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: `Invalid events: ${invalidEvents.join(", ")}` } },
                { status: 400 }
            );
        }

        // Generate secret for HMAC signature
        const secret = crypto.randomBytes(32).toString("hex");

        const webhook = await prisma.webhook.create({
            data: {
                tenantId: context.tenantId,
                ...result.data,
                secret,
                createdById: context.userId,
            },
        });

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "WEBHOOK_CREATED",
                objectType: "Webhook",
                objectId: webhook.id,
                afterData: JSON.parse(JSON.stringify({ name: webhook.name, url: webhook.url, events: webhook.events })),
            },
        });

        return NextResponse.json({
            success: true,
            data: webhook,
            message: "Webhook berhasil dibuat. Simpan secret untuk verifikasi signature.",
        }, { status: 201 });
    } catch (error) {
        console.error("Create webhook error:", error);
        return handlePrismaError(error);
    }
}
