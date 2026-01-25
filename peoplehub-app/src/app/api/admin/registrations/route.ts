// @ai:cl - Registration list API for HRD - Updated for Phase 1A
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

// GET /api/admin/registrations - Get pending registrations
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

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

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "PENDING";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: {
                    tenantId: context.tenantId,
                    status: status as "PENDING" | "APPROVED" | "REJECTED",
                    employee: null, // Only users without employee record (pending approval)
                },
                select: {
                    // Basic info
                    id: true,
                    email: true,
                    phone: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    // Phase 1A fields
                    fullName: true,
                    gender: true,
                    birthPlace: true,
                    birthDate: true,
                    // Bank data
                    bankName: true,
                    bankAccountNumber: true,
                    bankAccountHolder: true,
                    // Documents
                    photoUrl: true,
                    ktpPhotoUrl: true,
                    // Optional fields
                    nik: true,
                    npwp: true,
                    address: true,
                    emergencyContactName: true,
                    emergencyContactPhone: true,
                    // Tenant info
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.user.count({
                where: {
                    tenantId: context.tenantId,
                    status: status as "PENDING" | "APPROVED" | "REJECTED",
                    employee: null,
                },
            }),
        ]);

        // Transform data for frontend
        const data = users.map((user) => ({
            id: user.id,
            email: user.email,
            phone: user.phone,
            status: user.status,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            // Phase 1A fields
            fullName: user.fullName || "",
            gender: user.gender,
            birthPlace: user.birthPlace,
            birthDate: user.birthDate?.toISOString().split("T")[0],
            // Bank data
            bankName: user.bankName,
            bankAccountNumber: user.bankAccountNumber,
            bankAccountHolder: user.bankAccountHolder,
            // Documents
            photoUrl: user.photoUrl,
            ktpPhotoUrl: user.ktpPhotoUrl,
            // Optional fields
            nik: user.nik,
            npwp: user.npwp,
            address: user.address,
            emergencyContactName: user.emergencyContactName,
            emergencyContactPhone: user.emergencyContactPhone,
            // Tenant
            tenantId: user.tenant?.id,
            tenantName: user.tenant?.name,
            tenantCode: user.tenant?.code,
        }));

        return NextResponse.json({
            success: true,
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get registrations error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
