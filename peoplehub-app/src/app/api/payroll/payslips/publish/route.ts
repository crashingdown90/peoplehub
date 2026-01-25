// @ai:cl - Bulk publish payslips API
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { PayrollService } from "@/services";
import { z } from "zod";

const publishSchema = z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
});

// POST /api/payroll/payslips/publish - Publish all draft payslips for a period
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["HRD", "FINANCE", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validation = publishSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Format periode tidak valid",
                        details: validation.error.issues,
                    },
                },
                { status: 400 }
            );
        }

        const result = await PayrollService.bulkPublishPayslips(context, validation.data.period);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 422 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            message: `Berhasil publish ${result.data?.published || 0} slip gaji`,
        });
    } catch (error) {
        console.error("Publish payslips error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
            { status: 500 }
        );
    }
}
