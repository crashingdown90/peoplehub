// @ai:cl - Ticket assignment API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { TicketService } from "@/services/ticket";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const assignSchema = z.object({
  assignedToId: z.string().cuid("User ID tidak valid"),
});

// POST /api/tickets/[id]/assign - Assign ticket to admin/support
export async function POST(
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
    const validation = assignSchema.safeParse(body);

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

    // Verify assignee exists and has admin role
    const assignee = await prisma.user.findFirst({
      where: {
        id: validation.data.assignedToId,
        tenantId: context.tenantId,
        role: { in: ["HRD", "IT_OPS", "SUPER_ADMIN", "FINANCE"] },
        status: "APPROVED",
      },
    });

    if (!assignee) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User yang dituju tidak ditemukan atau bukan admin" } },
        { status: 404 }
      );
    }

    const result = await TicketService.assign(context, id, validation.data);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 : 400;
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
        action: "TICKET_ASSIGNED",
        objectType: "Ticket",
        objectId: id,
        afterData: JSON.parse(JSON.stringify({
          assignedToId: validation.data.assignedToId,
          assignedToEmail: assignee.email,
        })),
      },
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Tiket berhasil ditugaskan ke ${assignee.email}`,
    });
  } catch (error) {
    console.error("Assign ticket error:", error);
    return handlePrismaError(error);
  }
}
