// @ai:cl - Ticket resolution API route
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { TicketService } from "@/services/ticket";
import { prisma } from "@/lib/db";
import { z } from "zod";

const resolveSchema = z.object({
  resolution: z.string().min(10, "Resolusi minimal 10 karakter").max(5000, "Resolusi terlalu panjang"),
});

// POST /api/tickets/[id]/resolve - Resolve ticket
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
    const validation = resolveSchema.safeParse(body);

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

    const result = await TicketService.resolve(context, id, validation.data);

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
        action: "TICKET_RESOLVED",
        objectType: "Ticket",
        objectId: id,
        afterData: JSON.parse(JSON.stringify({
          resolvedById: context.userId,
          resolution: validation.data.resolution,
        })),
      },
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Tiket berhasil diselesaikan",
    });
  } catch (error) {
    console.error("Resolve ticket error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}
