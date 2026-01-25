// @ai:cl - Get leave balances using LeaveService
import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { LeaveService } from "@/services";

// GET /api/leave/balance - Get my leave balances
export async function GET() {
  try {
    const context = await getRequestContext();

    if (!context || !context.employeeId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
        { status: 401 }
      );
    }

    const result = await LeaveService.getBalances(context);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data?.map((b) => ({
        id: b.id,
        leaveType: b.leaveType,
        year: b.year,
        initialBalance: b.initialBalance,
        usedBalance: b.usedBalance,
        remainingBalance: b.remainingBalance,
        expiryDate: b.expiryDate,
      })),
    });
  } catch (error) {
    console.error("Get leave balance error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
      { status: 500 }
    );
  }
}
