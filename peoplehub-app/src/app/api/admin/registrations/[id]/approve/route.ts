// @ai:cl - Registration approval API - Simplified for Phase 1A
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { EmailService } from "@/services/email";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/admin/registrations/[id]/approve - Approve registration (Phase 1A simple)
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

        // Get user
        const user = await prisma.user.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                status: "PENDING",
            },
            include: {
                tenant: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Registrasi tidak ditemukan" } },
                { status: 404 }
            );
        }

        // Phase 1A Simple Approval: Just update status to APPROVED
        // Employee record and assignment will be done later by HRD
        const updatedUser = await prisma.$transaction(async (tx) => {
            // Update user status
            const updated = await tx.user.update({
                where: { id: user.id },
                data: { status: "APPROVED" },
            });

            // Create notification for the approved user
            await tx.notification.create({
                data: {
                    tenantId: context.tenantId,
                    userId: user.id,
                    title: "Pendaftaran Disetujui",
                    message: `Selamat! Pendaftaran Anda di ${user.tenant?.name || "perusahaan"} telah disetujui. Anda dapat login ke sistem.`,
                    type: "SYSTEM",
                    link: "/dashboard",
                },
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    tenantId: context.tenantId,
                    actorId: context.userId,
                    action: "REGISTRATION_APPROVED",
                    objectType: "User",
                    objectId: user.id,
                    afterData: JSON.parse(JSON.stringify({
                        userId: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        approvedBy: context.userId,
                        approvedAt: new Date().toISOString(),
                    })),
                },
            });

            return updated;
        });

        // Send approval email notification
        try {
            await EmailService.sendTemplate(
                "registrationApproved",
                { email: user.email, name: user.fullName || user.email.split("@")[0] },
                {
                    fullName: user.fullName || user.email.split("@")[0],
                    email: user.email,
                    companyName: user.tenant?.name || "Perusahaan",
                    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
                }
            );
        } catch (emailError) {
            // Log email error to audit log for tracking
            console.error("Failed to send approval email:", emailError);
            await prisma.auditLog.create({
                data: {
                    tenantId: context.tenantId,
                    actorId: context.userId,
                    action: "EMAIL_SEND_FAILED",
                    objectType: "User",
                    objectId: user.id,
                    afterData: JSON.parse(JSON.stringify({
                        template: "registrationApproved",
                        recipient: user.email,
                        error: emailError instanceof Error ? emailError.message : "Unknown error",
                    })),
                },
            }).catch(() => { /* Ignore audit log errors */ });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                status: updatedUser.status,
            },
            message: "Registrasi berhasil disetujui",
        });
    } catch (error) {
        console.error("Approve registration error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
