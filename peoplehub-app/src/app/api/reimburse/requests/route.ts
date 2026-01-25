import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";

const reimburseSchema = z.object({
    category: z.enum(["Transport", "Meals", "Accommodation", "Equipment", "Other"]),
    description: z.string().min(10, "Deskripsi minimal 10 karakter"),
    items: z.array(z.object({
        description: z.string().min(3),
        amount: z.number().min(1000, "Minimal Rp 1.000"),
        date: z.string(),
        receiptUrl: z.string().optional(),
    })).min(1, "Minimal 1 item"),
});

// GET /api/reimburse/requests - Get my reimburse requests
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
            prisma.reimburseRequest.findMany({
                where,
                include: { items: true },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.reimburseRequest.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: requests.map(r => ({
                ...r,
                totalAmount: Number(r.totalAmount),
                items: r.items.map(i => ({ ...i, amount: Number(i.amount) })),
            })),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Get reimburse requests error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// POST /api/reimburse/requests - Create reimburse request
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
        const result = reimburseSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const { category, description, items } = result.data;
        const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

        const reimburseRequest = await prisma.reimburseRequest.create({
            data: {
                tenantId: context.tenantId,
                employeeId: context.employeeId,
                category,
                description,
                totalAmount,
                status: "PENDING",
                items: {
                    create: items.map(item => ({
                        description: item.description,
                        amount: item.amount,
                        date: new Date(item.date),
                        receiptUrl: item.receiptUrl,
                    })),
                },
            },
            include: { items: true },
        });

        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "REIMBURSE_REQUESTED",
                objectType: "ReimburseRequest",
                objectId: reimburseRequest.id,
                afterData: JSON.parse(JSON.stringify({ category, totalAmount, itemCount: items.length })),
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                ...reimburseRequest,
                totalAmount: Number(reimburseRequest.totalAmount),
                items: reimburseRequest.items.map(i => ({ ...i, amount: Number(i.amount) })),
            },
            message: "Pengajuan reimburse berhasil",
        }, { status: 201 });
    } catch (error) {
        console.error("Create reimburse request error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
