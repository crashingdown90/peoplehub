import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext, hasRole } from "@/lib/request-context";
import { z } from "zod";
import { handlePrismaError } from "@/lib/api-utils";

const targetSchema = z.object({
    periodId: z.string().cuid(),
    indicatorId: z.string().cuid(),
    targetValue: z.number(),
});

const updateSchema = z.object({
    actualValue: z.number().optional(),
    notes: z.string().optional(),
});

// GET /api/kpi/targets - Get KPI targets (own or admin mode)
export async function GET(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const periodId = searchParams.get("periodId");
        const mode = searchParams.get("mode");
        const employeeId = searchParams.get("employeeId");

        // Admin mode - list all targets
        if (mode === "admin") {
            if (!hasRole(context, ["HRD", "SUPER_ADMIN", "MANAGER"])) {
                return NextResponse.json(
                    { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                    { status: 403 }
                );
            }

            const targets = await prisma.kpiTarget.findMany({
                where: {
                    tenantId: context.tenantId,
                    ...(periodId ? { periodId } : {}),
                    ...(employeeId ? { employeeId } : {}),
                },
                include: {
                    period: true,
                    indicator: true,
                    employee: {
                        select: {
                            id: true,
                            fullName: true,
                            employeeNumber: true,
                            department: { select: { name: true } },
                        },
                    },
                },
                orderBy: [{ employee: { fullName: "asc" } }, { createdAt: "desc" }],
            });

            return NextResponse.json({
                success: true,
                data: targets.map(t => ({
                    ...t,
                    targetValue: Number(t.targetValue),
                    actualValue: t.actualValue ? Number(t.actualValue) : null,
                    score: t.score ? Number(t.score) : null,
                    indicator: { ...t.indicator, weight: Number(t.indicator.weight) },
                })),
            });
        }

        // Employee mode - get own targets
        if (!context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
                { status: 401 }
            );
        }

        const targets = await prisma.kpiTarget.findMany({
            where: {
                tenantId: context.tenantId,
                employeeId: context.employeeId,
                ...(periodId ? { periodId } : {}),
            },
            include: {
                period: true,
                indicator: true,
            },
            orderBy: { createdAt: "desc" },
        });

        // Calculate totals
        const totalWeight = targets.reduce((sum, t) => sum + Number(t.indicator.weight), 0);
        const completedTargets = targets.filter(t => t.actualValue !== null);
        const averageScore = completedTargets.length > 0
            ? completedTargets.reduce((sum, t) => sum + (Number(t.score) || 0), 0) / completedTargets.length
            : null;

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalTargets: targets.length,
                    completedTargets: completedTargets.length,
                    totalWeight,
                    averageScore,
                },
                targets: targets.map(t => ({
                    ...t,
                    targetValue: Number(t.targetValue),
                    actualValue: t.actualValue ? Number(t.actualValue) : null,
                    score: t.score ? Number(t.score) : null,
                    indicator: { ...t.indicator, weight: Number(t.indicator.weight) },
                })),
            },
        });
    } catch (error) {
        console.error("Get KPI targets error:", error);
        return handlePrismaError(error);
    }
}

// POST /api/kpi/targets - Create KPI target for employee (Manager/HRD)
export async function POST(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        if (!hasRole(context, ["MANAGER", "HRD", "SUPER_ADMIN"])) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const employeeId = body.employeeId;

        if (!employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "employeeId required" } },
                { status: 400 }
            );
        }

        const result = targetSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", details: result.error.issues } },
                { status: 400 }
            );
        }

        const target = await prisma.kpiTarget.create({
            data: {
                tenantId: context.tenantId,
                employeeId,
                ...result.data,
            },
            include: { indicator: true, period: true },
        });

        return NextResponse.json({
            success: true,
            data: {
                ...target,
                targetValue: Number(target.targetValue),
                indicator: { ...target.indicator, weight: Number(target.indicator.weight) },
            },
        }, { status: 201 });
    } catch (error) {
        console.error("Create KPI target error:", error);
        return handlePrismaError(error);
    }
}
