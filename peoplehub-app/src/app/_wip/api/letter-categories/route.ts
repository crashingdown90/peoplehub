// @ai:cl - Letter category management API routes - GET (list) and POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/tenant/context";
import { LetterCategoryService } from "@/services/letter";
import { createLetterCategorySchema } from "@/validations/letter.schema";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/admin/letter-categories
 * Get all letter categories
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const isActive = searchParams.get("isActive");

        const result = await LetterCategoryService.getAll(
            context,
            isActive !== null ? isActive === "true" : undefined
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API] Error getting letter categories:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/admin/letter-categories
 * Create new letter category
 */
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admin roles can create categories
        if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const validated = createLetterCategorySchema.parse(body);

        const result = await LetterCategoryService.create(context, validated);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Audit log
        await logAudit({
            tenantId: context.tenantId,
            userId: context.userId,
            action: "CREATE",
            resource: "LETTER_CATEGORY",
            resourceId: result.data.id,
            details: {
                code: result.data.code,
                name: result.data.name,
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("[API] Error creating letter category:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
