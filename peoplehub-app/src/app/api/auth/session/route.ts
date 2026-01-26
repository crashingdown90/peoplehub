import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/auth/session - Get current session and user info
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, data: { user: null } },
                { status: 200 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: context.userId },
            select: {
                id: true,
                tenantId: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                photoUrl: true,
                emailVerifiedAt: true,
                lastLoginAt: true,
                employee: {
                    select: {
                        id: true,
                        employeeNumber: true,
                        fullName: true,
                        branch: { select: { id: true, name: true } },
                        department: { select: { id: true, name: true } },
                        position: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, data: { user: null } },
                { status: 200 }
            );
        }

        // Return in AuthUser format
        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    tenantId: user.tenantId,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    photoUrl: user.photoUrl,
                    emailVerifiedAt: user.emailVerifiedAt,
                    lastLoginAt: user.lastLoginAt,
                    employee: user.employee ? {
                        id: user.employee.id,
                        employeeNumber: user.employee.employeeNumber,
                        fullName: user.employee.fullName,
                        position: user.employee.position,
                        department: user.employee.department,
                        branch: user.employee.branch,
                    } : null,
                },
            },
        });
    } catch (error) {
        console.error("Get session error:", error);
        return NextResponse.json(
            { success: false, data: { user: null } },
            { status: 200 }
        );
    }
}
