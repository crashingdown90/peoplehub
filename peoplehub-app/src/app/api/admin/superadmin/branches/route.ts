import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";
import { z } from "zod";

// GET /api/admin/superadmin/branches - List all branches with location data
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Super Admin access required" } },
                { status: 403 }
            );
        }

        const branches = await prisma.branch.findMany({
            where: { tenantId: context.tenantId },
            select: {
                id: true,
                code: true,
                name: true,
                address: true,
                city: true,
                latitude: true,
                longitude: true,
                geofenceRadiusMeters: true,
                isActive: true,
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { name: "asc" },
        });

        const formattedBranches = branches.map(b => ({
            ...b,
            latitude: b.latitude ? Number(b.latitude) : null,
            longitude: b.longitude ? Number(b.longitude) : null,
            employeeCount: b._count.employees,
        }));

        return NextResponse.json({ success: true, data: formattedBranches });
    } catch (error) {
        console.error("Get branches error:", error);
        return handlePrismaError(error);
    }
}

const updateBranchSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    geofenceRadiusMeters: z.number().min(10).max(10000).optional(),
    address: z.string().optional(),
});

// PATCH /api/admin/superadmin/branches - Update branch location
export async function PATCH(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Super Admin access required" } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { branchId, ...data } = body;

        if (!branchId) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Branch ID is required" } },
                { status: 400 }
            );
        }

        const result = updateBranchSchema.safeParse(data);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid data", details: result.error.issues } },
                { status: 400 }
            );
        }

        // Verify branch belongs to tenant
        const branch = await prisma.branch.findFirst({
            where: { id: branchId, tenantId: context.tenantId },
        });

        if (!branch) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Branch not found" } },
                { status: 404 }
            );
        }

        const updated = await prisma.branch.update({
            where: { id: branchId },
            data: {
                latitude: result.data.latitude,
                longitude: result.data.longitude,
                geofenceRadiusMeters: result.data.geofenceRadiusMeters ?? branch.geofenceRadiusMeters,
                address: result.data.address ?? branch.address,
            },
            select: {
                id: true,
                code: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                geofenceRadiusMeters: true,
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "UPDATE_BRANCH_LOCATION",
                objectType: "Branch",
                objectId: branchId,
                beforeData: {
                    latitude: branch.latitude ? Number(branch.latitude) : null,
                    longitude: branch.longitude ? Number(branch.longitude) : null,
                    geofenceRadiusMeters: branch.geofenceRadiusMeters,
                },
                afterData: {
                    latitude: result.data.latitude,
                    longitude: result.data.longitude,
                    geofenceRadiusMeters: result.data.geofenceRadiusMeters ?? branch.geofenceRadiusMeters,
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                ...updated,
                latitude: updated.latitude ? Number(updated.latitude) : null,
                longitude: updated.longitude ? Number(updated.longitude) : null,
            },
            message: "Lokasi branch berhasil diperbarui",
        });
    } catch (error) {
        console.error("Update branch location error:", error);
        return handlePrismaError(error);
    }
}
