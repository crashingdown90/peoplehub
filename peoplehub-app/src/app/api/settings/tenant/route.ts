// @ai:cl - Tenant Settings API routes
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/tenant";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

// Validation schema for updating tenant settings
const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  branding: z
    .object({
      logo: z.string().url().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
    .optional(),
});

// GET /api/settings/tenant - Get tenant settings (IT_OPS/SUPER_ADMIN)
export async function GET() {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses ke pengaturan tenant" },
        { status: 403 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: {
        id: true,
        name: true,
        domain: true,
        branding: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("GET /api/settings/tenant error:", error);
    return handlePrismaError(error);
  }
}

// PUT /api/settings/tenant - Update tenant settings (SUPER_ADMIN only)
export async function PUT(request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Hanya SUPER_ADMIN yang dapat mengubah pengaturan tenant" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = UpdateTenantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, branding } = validation.data;

    // Get current tenant for audit
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
    });

    const tenant = await prisma.tenant.update({
      where: { id: context.tenantId },
      data: {
        ...(name && { name }),
        ...(branding && { branding }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        domain: true,
        branding: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "UPDATE_TENANT_SETTINGS",
        objectType: "Tenant",
        objectId: context.tenantId,
        beforeData: { name: currentTenant?.name, branding: currentTenant?.branding },
        afterData: JSON.parse(JSON.stringify({ name: tenant.name, branding: tenant.branding })),
      },
    });

    return NextResponse.json({
      success: true,
      data: tenant,
      message: "Pengaturan tenant berhasil diperbarui",
    });
  } catch (error) {
    console.error("PUT /api/settings/tenant error:", error);
    return handlePrismaError(error);
  }
}
