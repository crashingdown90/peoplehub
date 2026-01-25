// @ai:cl - Login API with cookie fix for Route Handler
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, generateToken, AUTH_CONFIG, type JWTPayload } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { validateCsrf } from "@/lib/security/csrf";

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
        const result = loginSchema.safeParse(body);
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

        const { email, password } = result.data;

        // Find user by email (across all tenants for now, in production filter by tenant)
        const user = await prisma.user.findFirst({
            where: {
                email: email.toLowerCase(),
            },
            include: {
                employee: {
                    include: {
                        branch: true,
                        department: true,
                        position: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Email atau password salah",
                    },
                },
                { status: 401 }
            );
        }

        // Check user status
        if (user.status === "PENDING") {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "PENDING_APPROVAL",
                        message: "Akun Anda masih menunggu persetujuan HRD",
                    },
                },
                { status: 403 }
            );
        }

        if (user.status === "REJECTED") {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "ACCOUNT_REJECTED",
                        message: "Akun Anda ditolak. Silakan hubungi HRD untuk informasi lebih lanjut.",
                    },
                },
                { status: 403 }
            );
        }

        if (user.status === "SUSPENDED") {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "ACCOUNT_SUSPENDED",
                        message: "Akun Anda dinonaktifkan. Silakan hubungi HRD.",
                    },
                },
                { status: 403 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Email atau password salah",
                    },
                },
                { status: 401 }
            );
        }

        // Generate JWT token
        const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            employeeId: user.employee?.id,
        };

        const token = generateToken(payload);

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                tenantId: user.tenantId,
                actorId: user.id,
                action: "USER_LOGIN",
                objectType: "User",
                objectId: user.id,
                ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
                userAgent: request.headers.get("user-agent") || "unknown",
            },
        });

        // Create response with cookie
        // Note: In Route Handlers, must set cookie on NextResponse, not via cookies().set()
        const response = NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    employee: user.employee
                        ? {
                            id: user.employee.id,
                            fullName: user.employee.fullName,
                            employeeNumber: user.employee.employeeNumber,
                            branch: user.employee.branch,
                            department: user.employee.department,
                            position: user.employee.position,
                        }
                        : null,
                },
            },
        });

        // Set auth cookie on response
        response.cookies.set(AUTH_CONFIG.cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: AUTH_CONFIG.cookieMaxAge,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Terjadi kesalahan server",
                },
            },
            { status: 500 }
        );
    }
}
