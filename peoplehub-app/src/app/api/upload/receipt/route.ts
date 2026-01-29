// @ai:cl - Receipt upload API for reimburse items
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { saveReceipt } from "@/lib/upload";
import { handlePrismaError } from "@/lib/api-utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// POST /api/upload/receipt - Upload a receipt image
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "File tidak ditemukan" } },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Format file tidak didukung. Gunakan JPEG, PNG, atau WebP" } },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Ukuran file maksimal 10MB" } },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use a temporary ID; will be linked to actual request later
        const tempId = `temp_${Date.now()}`;
        const result = await saveReceipt(buffer, context.tenantId, tempId, file.name);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "UPLOAD_FAILED", message: result.error || "Gagal upload file" } },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { url: result.url },
        });
    } catch (error) {
        console.error("Upload receipt error:", error);
        return handlePrismaError(error);
    }
}
