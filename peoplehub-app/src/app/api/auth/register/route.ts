// @ai:cl - User registration API with full Phase 1A support
// Supports: tenant selection, personal data, bank data, photo, optional fields

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/validations/auth.schema";
import { EmailService } from "@/services/email";
import { formatDate } from "@/constants/locale";

import { validateCsrf, getCsrfErrorResponse } from "@/lib/security/csrf";
import { handlePrismaError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
    try {
        // Validate CSRF token
        const csrfResult = await validateCsrf(request.headers);
        if (!csrfResult.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "CSRF_ERROR",
                        message: csrfResult.error || "CSRF token validation failed",
                    },
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate input
        const result = registerSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Data tidak valid",
                        details: result.error.issues,
                    },
                },
                { status: 400 }
            );
        }

        const {
            tenantId,
            email,
            phone,
            password,
            fullName,
            gender,
            birthPlace,
            birthDate,
            bankName,
            bankAccountNumber,
            bankAccountHolder,
            photoUrl,
            nik,
            npwp,
            address,
            ktpPhotoUrl,
            emergencyContactName,
            emergencyContactPhone,
        } = result.data;

        // Verify tenant exists and is active
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId, isActive: true },
        });

        if (!tenant) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INVALID_TENANT",
                        message: "Perusahaan tidak ditemukan atau tidak aktif",
                    },
                },
                { status: 400 }
            );
        }

        // Check if email already exists for this tenant
        const existingUser = await prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email: email.toLowerCase(),
                },
            },
        });

        if (existingUser) {
            // If user was rejected, allow re-registration by deleting old record
            if (existingUser.status === "REJECTED") {
                await prisma.user.delete({
                    where: { id: existingUser.id },
                });
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "DUPLICATE_ENTRY",
                            message: "Email sudah terdaftar",
                        },
                    },
                    { status: 409 }
                );
            }
        }

        // Check if phone already exists for this tenant
        const existingPhone = await prisma.user.findFirst({
            where: {
                tenantId: tenant.id,
                phone: phone,
                status: { not: "REJECTED" },
            },
        });

        if (existingPhone) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "DUPLICATE_PHONE",
                        message: "Nomor telepon sudah terdaftar",
                    },
                },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user with pending status and all registration data
        const user = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email: email.toLowerCase(),
                phone,
                passwordHash,
                fullName,
                status: "PENDING",
                role: "EMPLOYEE",

                // Phase 1A: Additional registration data
                gender,
                birthPlace,
                // Parse date string properly to avoid timezone issues
                // Input format: "YYYY-MM-DD" from HTML date input
                birthDate: new Date(birthDate + "T00:00:00"),
                photoUrl,
                bankName,
                bankAccountNumber,
                bankAccountHolder,

                // Optional fields
                nik: nik || null,
                npwp: npwp || null,
                address: address || null,
                ktpPhotoUrl: ktpPhotoUrl || null,
                emergencyContactName: emergencyContactName || null,
                emergencyContactPhone: emergencyContactPhone || null,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                tenantId: tenant.id,
                actorId: user.id,
                action: "USER_REGISTERED",
                objectType: "User",
                objectId: user.id,
                afterData: JSON.parse(
                    JSON.stringify({
                        email: user.email,
                        phone: user.phone,
                        fullName,
                        tenantName: tenant.name,
                        status: user.status,
                    })
                ),
            },
        });

        // Create notification for HRD
        const hrdUsers = await prisma.user.findMany({
            where: {
                tenantId: tenant.id,
                role: "HRD",
                status: "ACTIVE",
            },
            select: { id: true },
        });

        // If no HRD in this tenant, notify HRD from all tenants (shared HRD)
        type HrdItem = typeof hrdUsers[number];
        let notifyUserIds = hrdUsers.map((u: HrdItem) => u.id);
        if (notifyUserIds.length === 0) {
            const allHrds = await prisma.user.findMany({
                where: {
                    role: "HRD",
                    status: "ACTIVE",
                },
                select: { id: true, tenantId: true },
            });
            type AllHrdItem = typeof allHrds[number];
            notifyUserIds = allHrds.map((u: AllHrdItem) => u.id);
        }

        // Create in-app notifications for HRD
        for (const hrdId of notifyUserIds) {
            await prisma.notification.create({
                data: {
                    tenantId: tenant.id,
                    userId: hrdId,
                    type: "APPROVAL",
                    title: "Registrasi Baru",
                    message: `${fullName} mendaftar di ${tenant.name}. Menunggu approval.`,
                    link: `/admin/registrations`,
                    objectType: "User",
                    objectId: user.id,
                },
            });
        }

        // Send registration pending email notification
        try {
            await EmailService.sendTemplate(
                "registrationPending",
                { email: user.email, name: fullName },
                {
                    fullName,
                    email: user.email,
                    phone: phone || "-",
                    companyName: tenant.name,
                    registrationDate: formatDate(new Date(), "FULL"),
                }
            );
        } catch (emailError) {
            // Log email error to audit log for tracking/retry purposes
            console.error("Failed to send registration email:", emailError);
            try {
                await prisma.auditLog.create({
                    data: {
                        tenantId: tenant.id,
                        actorId: user.id,
                        action: "EMAIL_SEND_FAILED",
                        objectType: "User",
                        objectId: user.id,
                        afterData: JSON.parse(JSON.stringify({
                            template: "registrationPending",
                            recipient: user.email,
                            error: emailError instanceof Error ? emailError.message : "Unknown error",
                        })),
                    },
                });
            } catch (auditError) {
                // Log to console if audit log fails - don't silently swallow
                console.error("Failed to create audit log for email failure:", auditError);
            }
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    status: user.status,
                    tenantName: tenant.name,
                },
                message: `Registrasi berhasil. Silakan tunggu persetujuan dari HRD ${tenant.name}.`,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Register error:", error);
        return handlePrismaError(error);
    }
}
