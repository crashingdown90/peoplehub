// @ai:cl - Ticket status change API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { TicketService } from "@/services/ticket";
import { prisma } from "@/lib/db";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], {
    message: "Status wajib dipilih",
  }),
});

// PUT /api/tickets/[id]/status - Change ticket status
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
    const validation = statusSchema.safeParse(body);

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

    // Get current ticket for audit log
    const beforeTicket = await prisma.ticket.findFirst({
      where: { id, tenantId: context.tenantId },
      select: { status: true },
    });

    const result = await TicketService.changeStatus(context, id, validation.data.status);

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
        action: "TICKET_STATUS_CHANGED",
        objectType: "Ticket",
        objectId: id,
        beforeData: { status: beforeTicket?.status },
        afterData: JSON.parse(JSON.stringify({ status: validation.data.status })),
      },
    });

    const statusLabels: Record<string, string> = {
      OPEN: "Dibuka",
      IN_PROGRESS: "Sedang Dikerjakan",
      RESOLVED: "Diselesaikan",
      CLOSED: "Ditutup",
    };

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Status tiket diubah menjadi "${statusLabels[validation.data.status]}"`,
    });
  } catch (error) {
    console.error("Change ticket status error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}
