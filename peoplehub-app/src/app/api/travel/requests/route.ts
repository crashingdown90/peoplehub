import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const travelSchema = z.object({
    destination: z.string().min(3, "Destinasi minimal 3 karakter"),
    purpose: z.string().min(10, "Tujuan minimal 10 karakter"),
    departureDate: z.string().min(1, "Tanggal keberangkatan wajib"),
    returnDate: z.string().min(1, "Tanggal kembali wajib"),
    estimatedBudget: z.number().min(0).optional(),
    transportation: z.string().optional(),
    accommodation: z.string().optional(),
    notes: z.string().optional(),
});

// GET /api/travel/requests - Get my travel requests
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const where = {
            tenantId: context.tenantId,
            employeeId: context.employeeId,
            ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
        };

        const [requests, total] = await Promise.all([
            prisma.travelRequest.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.travelRequest.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: requests.map(r => ({
                ...r,
                estimatedBudget: Number(r.estimatedBudget),
            })),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Get travel requests error:", error);
        return handlePrismaError(error);
    }
}

// POST /api/travel/requests - Create travel request
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const result = travelSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const { destination, purpose, departureDate, returnDate, estimatedBudget, transportation, accommodation, notes } = result.data;

        const departure = new Date(departureDate);
        const returnD = new Date(returnDate);

        if (returnD < departure) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "Tanggal kembali harus setelah keberangkatan" } },
                { status: 400 }
            );
        }

        const travelRequest = await prisma.travelRequest.create({
            data: {
                tenantId: context.tenantId,
                employeeId: context.employeeId,
                destination,
                purpose,
                departureDate: departure,
                returnDate: returnD,
                estimatedBudget: estimatedBudget || 0,
                transportation,
                accommodation,
                notes,
                status: "PENDING",
            },
        });

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "TRAVEL_REQUESTED",
                objectType: "TravelRequest",
                objectId: travelRequest.id,
                afterData: JSON.parse(JSON.stringify({ destination, departureDate, returnDate })),
            },
        });

        return NextResponse.json({
            success: true,
            data: { ...travelRequest, estimatedBudget: Number(travelRequest.estimatedBudget) },
            message: "Pengajuan perjalanan dinas berhasil",
        }, { status: 201 });
    } catch (error) {
        console.error("Create travel request error:", error);
        return handlePrismaError(error);
    }
}
