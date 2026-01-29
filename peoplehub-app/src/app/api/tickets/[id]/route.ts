// @ai:cl - Single ticket API routes (get, update, delete)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { TicketService } from "@/services/ticket";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const updateTicketSchema = z.object({
  category: z.enum(["HR", "IT", "FINANCE", "OTHER"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  subject: z.string().min(5).max(200).optional(),
  description: z.string().min(20).optional(),
});

// GET /api/tickets/[id] - Get single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getRequestContext();
    const { id } = await params;

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const result = await TicketService.getById(context, id);

    if (!result.success) {
      const status = result.error?.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    return handlePrismaError(error);
  }
}

// PUT /api/tickets/[id] - Update ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getRequestContext();
    const { id } = await params;

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateTicketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Data tidak valid",
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const result = await TicketService.update(context, id, validation.data);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Tiket berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    return handlePrismaError(error);
  }
}

// DELETE /api/tickets/[id] - Close/delete ticket (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getRequestContext();
    const { id } = await params;

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    // Only admins can delete/close tickets
    if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya admin yang dapat menghapus tiket" } },
        { status: 403 }
      );
    }

    // Soft delete by changing status to CLOSED
    const result = await TicketService.changeStatus(context, id, "CLOSED");

    if (!result.success) {
      const status = result.error?.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "TICKET_CLOSED",
        objectType: "Ticket",
        objectId: id,
        afterData: JSON.parse(JSON.stringify({ closedBy: context.userId })),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tiket berhasil ditutup",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    return handlePrismaError(error);
  }
}
