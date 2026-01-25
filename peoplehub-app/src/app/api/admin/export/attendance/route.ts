import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";

// GET /api/admin/export/attendance - Export attendance to CSV
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "startDate and endDate required" } },
                { status: 400 }
            );
        }

        const attendances = await prisma.attendance.findMany({
            where: {
                tenantId: context.tenantId,
                attendanceDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            include: {
                employee: {
                    select: { employeeNumber: true, fullName: true, department: { select: { name: true } } },
                },
            },
            orderBy: [{ attendanceDate: "desc" }, { employee: { fullName: "asc" } }],
        });

        const headers = ["Tanggal", "NIK", "Nama", "Departemen", "Status", "Clock In", "Clock Out", "Terlambat (menit)", "Lembur (menit)"];
        const rows = attendances.map(att => [
            att.attendanceDate.toISOString().split("T")[0],
            att.employee.employeeNumber,
            att.employee.fullName,
            att.employee.department?.name || "",
            att.status,
            att.clockIn ? att.clockIn.toISOString() : "",
            att.clockOut ? att.clockOut.toISOString() : "",
            att.lateMinutes.toString(),
            att.overtimeMinutes.toString(),
        ]);

        const csv = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
        ].join("\n");

        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="attendance-${startDate}-to-${endDate}.csv"`,
            },
        });
    } catch (error) {
        console.error("Export attendance error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
