import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

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

        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const [employees, attendances, schedules, leaves] = await Promise.all([
            prisma.employee.findMany({
                where: {
                    tenantId: context.tenantId,
                    status: "ACTIVE",
                    deletedAt: null,
                },
                select: {
                    id: true,
                    employeeNumber: true,
                    fullName: true,
                    department: { select: { name: true } },
                },
                orderBy: { fullName: "asc" },
            }),
            prisma.attendance.findMany({
                where: {
                    tenantId: context.tenantId,
                    attendanceDate: {
                        gte: start,
                        lte: end,
                    },
                },
                include: {
                    schedule: { include: { shift: { select: { name: true } } } },
                },
            }),
            prisma.schedule.findMany({
                where: {
                    tenantId: context.tenantId,
                    scheduleDate: {
                        gte: start,
                        lte: end,
                    },
                },
                include: {
                    shift: { select: { name: true } },
                },
            }),
            prisma.leaveRequest.findMany({
                where: {
                    tenantId: context.tenantId,
                    status: "APPROVED",
                    deletedAt: null,
                    startDate: { lte: end },
                    endDate: { gte: start },
                },
                select: { employeeId: true, startDate: true, endDate: true },
            }),
        ]);

        const keyFor = (employeeId: string, date: Date) =>
            `${employeeId}:${date.toISOString().split("T")[0]}`;

        const attendanceMap = new Map<string, (typeof attendances)[number]>();
        for (const att of attendances) {
            attendanceMap.set(keyFor(att.employeeId, att.attendanceDate), att);
        }

        const scheduleMap = new Map<string, (typeof schedules)[number]>();
        for (const sched of schedules) {
            scheduleMap.set(keyFor(sched.employeeId, sched.scheduleDate), sched);
        }

        const leaveSet = new Set<string>();
        for (const leave of leaves) {
            const d = new Date(leave.startDate);
            d.setHours(0, 0, 0, 0);
            const last = new Date(leave.endDate);
            last.setHours(0, 0, 0, 0);
            for (let cursor = new Date(d); cursor <= last; cursor.setDate(cursor.getDate() + 1)) {
                leaveSet.add(keyFor(leave.employeeId, cursor));
            }
        }

        const headers = ["Tanggal", "NIK", "Nama", "Departemen", "Shift", "Status", "Clock In", "Clock Out", "Terlambat (menit)", "Lembur (menit)"];
        const rows: string[][] = [];

        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
            for (const emp of employees) {
                const key = keyFor(emp.id, day);
                const att = attendanceMap.get(key);
                const sched = scheduleMap.get(key);

                let status = "ABSENT";
                if (att) {
                    status = att.status;
                } else if (leaveSet.has(key)) {
                    status = "LEAVE";
                }

                rows.push([
                    day.toISOString().split("T")[0],
                    emp.employeeNumber,
                    emp.fullName,
                    emp.department?.name || "",
                    att?.schedule?.shift?.name || sched?.shift?.name || "-",
                    status,
                    att?.clockIn ? att.clockIn.toISOString() : "",
                    att?.clockOut ? att.clockOut.toISOString() : "",
                    att ? att.lateMinutes.toString() : "0",
                    att ? att.overtimeMinutes.toString() : "0",
                ]);
            }
        }

        const csv = [
            headers.join(","),
            ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(",")),
        ].join("\n");

        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="attendance-${startDate}-to-${endDate}.csv"`,
            },
        });
    } catch (error) {
        console.error("Export attendance error:", error);
        return handlePrismaError(error);
    }
}
