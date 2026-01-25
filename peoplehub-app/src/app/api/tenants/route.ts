// @ai:cl - Public API to get list of active tenants for registration
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const tenants = await prisma.tenant.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                domain: true,
                code: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: tenants,
        });
    } catch (error) {
        console.error("Get tenants error:", error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Gagal mengambil data perusahaan",
                },
            },
            { status: 500 }
        );
    }
}
