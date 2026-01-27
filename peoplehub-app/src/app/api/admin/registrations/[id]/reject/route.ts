// @ai:cl - Registration rejection API with email notification
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { EmailService } from "@/services/email";
import { formatDate } from "@/constants/locale";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const rejectSchema = z.object({
    reason: z.string().min(10, "Alasan penolakan minimal 10 karakter"),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/admin/registrations/[id]/reject - Reject registration
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

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

        const body = await request.json();
        const result = rejectSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: result.error.issues } },
                { status: 400 }
            );
        }

        // Get user
        const user = await prisma.user.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                status: "PENDING",
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Registrasi tidak ditemukan" } },
                { status: 404 }
            );
        }

        // Update user status
        await prisma.user.update({
            where: { id: user.id },
            data: { status: "REJECTED" },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "REGISTRATION_REJECTED",
                objectType: "User",
                objectId: user.id,
                afterData: JSON.parse(JSON.stringify({
                    email: user.email,
                    reason: result.data.reason,
                })),
            },
        });

        // Send rejection email notification
        const userName = user.fullName || user.email.split("@")[0];
        try {
            await EmailService.sendTemplate(
                "registrationRejected",
                { email: user.email, name: userName },
                {
                    fullName: userName,
                    email: user.email,
                    registrationDate: formatDate(user.createdAt, "FULL"),
                    reason: result.data.reason,
                }
            );
        } catch (emailError) {
            // Log email error to audit log for tracking
            console.error("Failed to send rejection email:", emailError);
            await prisma.auditLog.create({
                data: {
                    tenantId: context.tenantId,
                    actorId: context.userId,
                    action: "EMAIL_SEND_FAILED",
                    objectType: "User",
                    objectId: user.id,
                    afterData: JSON.parse(JSON.stringify({
                        template: "registrationRejected",
                        recipient: user.email,
                        error: emailError instanceof Error ? emailError.message : "Unknown error",
                    })),
                },
            }).catch(() => { /* Ignore audit log errors */ });
        }

        return NextResponse.json({
            success: true,
            message: "Registrasi berhasil ditolak",
        });
    } catch (error) {
        console.error("Reject registration error:", error);
        return handlePrismaError(error);
    }
}
