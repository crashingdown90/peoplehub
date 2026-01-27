// @ai:cl - Bulk generate payslips API
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { PayrollService } from "@/services";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const generateSchema = z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
});

// POST /api/payroll/payslips/generate - Generate payslips for all active employees
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
        const validation = generateSchema.safeParse(body);

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

        const result = await PayrollService.bulkGeneratePayslips(context, validation.data.period);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 422 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            message: `Berhasil generate ${result.data?.success || 0} slip gaji`,
        });
    } catch (error) {
        console.error("Generate payslips error:", error);
        return handlePrismaError(error);
    }
}
