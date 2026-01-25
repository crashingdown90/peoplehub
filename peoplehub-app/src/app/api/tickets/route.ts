// @ai:cl - Ticket API routes for list and create
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { TicketService } from "@/services/ticket";
import { z } from "zod";

const createTicketSchema = z.object({
  category: z.enum(["HR", "IT", "FINANCE", "OTHER"], {
    message: "Kategori wajib dipilih",
  }),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  subject: z.string().min(5, "Subjek minimal 5 karakter").max(200, "Subjek maksimal 200 karakter"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
});

// GET /api/tickets - Get tickets list
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = {
      status: searchParams.get("status") as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | undefined,
      category: searchParams.get("category") as "HR" | "IT" | "FINANCE" | "OTHER" | undefined,
      priority: searchParams.get("priority") as "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined,
      assignedToId: searchParams.get("assignedToId") || undefined,
      createdById: searchParams.get("createdById") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await TicketService.getTickets(context, filter);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create new ticket
export async function POST(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Tidak terautentikasi" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createTicketSchema.safeParse(body);

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

    const result = await TicketService.create(context, validation.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Tiket berhasil dibuat. Tim support akan segera menghubungi Anda.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}
