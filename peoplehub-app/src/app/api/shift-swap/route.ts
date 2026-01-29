// @ai:cl - Shift swap CRUD API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

// GET /api/shift-swap - List shift swaps for current user
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { tenantId, employeeId, role } = context;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || undefined;

        // Build where clause - employees see their own, managers/HRD see all
        const isAdmin = hasRole(context, ["MANAGER", "HRD", "SUPER_ADMIN"]);
        const where: Record<string, unknown> = { tenantId };

        if (!isAdmin) {
            where.OR = [{ requesterId: employeeId }, { partnerId: employeeId }];
        }

        if (status) {
            where.status = status;
        }

        const swaps = await prisma.shiftSwap.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        // Fetch employee details for all requester/partner IDs
        const employeeIds = [...new Set(swaps.flatMap(s => [s.requesterId, s.partnerId]))];
        const employees = await prisma.employee.findMany({
            where: { tenantId, id: { in: employeeIds } },
            select: { id: true, fullName: true, employeeNumber: true },
        });
        const empMap = new Map(employees.map(e => [e.id, e]));

        // Fetch schedules for shift info
        const dateKeys = swaps.flatMap(s => [
            { employeeId: s.requesterId, date: s.requesterShiftDate },
            { employeeId: s.partnerId, date: s.partnerShiftDate },
        ]);

        const schedules = dateKeys.length > 0
            ? await prisma.schedule.findMany({
                where: {
                    tenantId,
                    OR: dateKeys.map(dk => ({
                        employeeId: dk.employeeId,
                        scheduleDate: dk.date,
                    })),
                },
                include: { shift: { select: { name: true, startTime: true, endTime: true } } },
            })
            : [];

        const scheduleMap = new Map(
            schedules.map(s => [`${s.employeeId}-${s.scheduleDate.toISOString().split("T")[0]}`, s])
        );

        const data = swaps.map(swap => {
            const requester = empMap.get(swap.requesterId);
            const partner = empMap.get(swap.partnerId);
            const reqDateKey = `${swap.requesterId}-${swap.requesterShiftDate.toISOString().split("T")[0]}`;
            const partDateKey = `${swap.partnerId}-${swap.partnerShiftDate.toISOString().split("T")[0]}`;
            const reqSchedule = scheduleMap.get(reqDateKey);
            const partSchedule = scheduleMap.get(partDateKey);

            return {
                id: swap.id,
                requester: {
                    id: swap.requesterId,
                    name: requester?.fullName || "Unknown",
                    employeeNumber: requester?.employeeNumber || "",
                },
                partner: {
                    id: swap.partnerId,
                    name: partner?.fullName || "Unknown",
                    employeeNumber: partner?.employeeNumber || "",
                },
                requesterShiftDate: swap.requesterShiftDate,
                partnerShiftDate: swap.partnerShiftDate,
                requesterShift: reqSchedule?.shift
                    ? `${reqSchedule.shift.name} (${reqSchedule.shift.startTime}-${reqSchedule.shift.endTime})`
                    : "-",
                partnerShift: partSchedule?.shift
                    ? `${partSchedule.shift.name} (${partSchedule.shift.startTime}-${partSchedule.shift.endTime})`
                    : "-",
                reason: swap.reason,
                status: swap.status,
                createdAt: swap.createdAt,
            };
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Get shift swaps error:", error);
        return handlePrismaError(error);
    }
}

// POST /api/shift-swap - Create a new shift swap request
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { tenantId, employeeId } = context;
        const body = await request.json();
        const { partnerId, requesterShiftDate, partnerShiftDate, reason } = body;

        // Validate required fields
        if (!partnerId || !requesterShiftDate || !partnerShiftDate || !reason) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Semua field wajib diisi" } },
                { status: 400 }
            );
        }

        if (partnerId === employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Tidak bisa tukar shift dengan diri sendiri" } },
                { status: 400 }
            );
        }

        if (reason.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Alasan minimal 10 karakter" } },
                { status: 400 }
            );
        }

        // Check partner exists in same tenant
        const partner = await prisma.employee.findFirst({
            where: { tenantId, id: partnerId, status: "ACTIVE", deletedAt: null },
        });

        if (!partner) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Karyawan partner tidak ditemukan" } },
                { status: 404 }
            );
        }

        // Check for existing pending swap on same dates
        const reqDate = new Date(requesterShiftDate);
        const partDate = new Date(partnerShiftDate);

        const existing = await prisma.shiftSwap.findFirst({
            where: {
                tenantId,
                OR: [
                    {
                        requesterId: employeeId,
                        requesterShiftDate: reqDate,
                        status: { in: ["PENDING_PARTNER", "PENDING_MANAGER"] },
                    },
                    {
                        partnerId: employeeId,
                        partnerShiftDate: reqDate,
                        status: { in: ["PENDING_PARTNER", "PENDING_MANAGER"] },
                    },
                ],
            },
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: { code: "ALREADY_EXISTS", message: "Sudah ada pengajuan tukar shift untuk tanggal tersebut" } },
                { status: 409 }
            );
        }

        const swap = await prisma.shiftSwap.create({
            data: {
                tenantId,
                requesterId: employeeId,
                partnerId,
                requesterShiftDate: reqDate,
                partnerShiftDate: partDate,
                reason: reason.trim(),
                status: "PENDING_PARTNER",
            },
        });

        // Create notification for partner
        const requester = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { fullName: true, userId: true },
        });

        if (partner.userId) {
            await prisma.notification.create({
                data: {
                    tenantId,
                    userId: partner.userId,
                    title: "Permintaan Tukar Shift",
                    message: `${requester?.fullName || "Rekan kerja"} mengajukan tukar shift dengan Anda`,
                    type: "SYSTEM",
                    link: "/shift/swap",
                },
            });
        }

        return NextResponse.json({ success: true, data: swap }, { status: 201 });
    } catch (error) {
        console.error("Create shift swap error:", error);
        return handlePrismaError(error);
    }
}
