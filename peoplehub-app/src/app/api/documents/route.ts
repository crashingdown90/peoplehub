// @ai:cl - Documents API routes for list and upload
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { DocumentService } from "@/services/document";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const uploadDocumentSchema = z.object({
  employeeId: z.string().cuid().optional(),
  category: z.enum(["PERSONAL", "CONTRACT", "CERTIFICATE", "TRAINING", "PERFORMANCE", "MEDICAL", "OTHER"]),
  name: z.string().min(1, "Nama dokumen wajib diisi"),
  description: z.string().optional(),
  fileUrl: z.string().url("URL file tidak valid"),
  fileSize: z.number().int().positive("Ukuran file tidak valid"),
  mimeType: z.string().min(1, "Tipe file wajib diisi"),
  expiryDate: z.string().optional(),
  isRequired: z.boolean().optional(),
});

// GET /api/documents - Get documents list
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
      employeeId: searchParams.get("employeeId") || undefined,
      category: searchParams.get("category") as "PERSONAL" | "CONTRACT" | "CERTIFICATE" | undefined,
      status: searchParams.get("status") as "PENDING" | "APPROVED" | "REJECTED" | undefined,
      search: searchParams.get("search") || undefined,
      expiringSoon: searchParams.get("expiringSoon") === "true",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await DocumentService.getDocuments(context, filter);

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
    console.error("Get documents error:", error);
    return handlePrismaError(error);
  }
}

// POST /api/documents - Upload document
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
    const validation = uploadDocumentSchema.safeParse(body);

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

    const result = await DocumentService.upload(context, validation.data);

    if (!result.success) {
      const status =
        result.error?.code === "NOT_FOUND" ? 404 :
        result.error?.code === "FORBIDDEN" ? 403 : 422;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Dokumen berhasil diupload",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload document error:", error);
    return handlePrismaError(error);
  }
}
