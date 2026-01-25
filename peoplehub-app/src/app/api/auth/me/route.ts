import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";

// GET /api/auth/me - Get current user profile
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: context.userId },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                employee: {
                    select: {
                        id: true,
                        employeeNumber: true,
                        fullName: true,
                        nik: true,
                        npwp: true,
                        phone: true,
                        address: true,
                        employmentType: true,
                        workMode: true,
                        startDate: true,
                        status: true,
                        branch: { select: { id: true, name: true } },
                        department: { select: { id: true, name: true } },
                        position: { select: { id: true, name: true } },
                        manager: { select: { id: true, fullName: true } },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error("Get me error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
