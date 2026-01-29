// @ai:cl - Public API to get list of banks for registration
import { NextResponse } from "next/server";
import { BANK_LIST } from "@/constants/banks";
import { handlePrismaError } from "@/lib/api-utils";

export async function GET() {
    try {
        // Return bank list from constants
        const banks = BANK_LIST.map((bank) => ({
            code: bank.code,
            name: bank.name,
        }));

        return NextResponse.json({
            success: true,
            data: banks,
        });
    } catch (error) {
        console.error("Get banks error:", error);
        return handlePrismaError(error);
    }
}
