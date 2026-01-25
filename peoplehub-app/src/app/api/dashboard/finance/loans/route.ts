// @ai:cl - Employee loans API for Finance dashboard
// NOTE: Loan model belum ada di schema, returning placeholder data
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";

// GET /api/dashboard/finance/loans - Get employee loans summary
// Returns placeholder since Loan model not implemented yet
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext();

    if (!context) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu" } },
        { status: 401 }
      );
    }

    if (!["FINANCE", "HRD", "SUPER_ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    // Return placeholder data - Loan model not implemented yet
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          pending: { count: 0, amount: 0 },
          active: { count: 0, principal: 0, remaining: 0 },
          completed: { count: 0, amount: 0 },
        },
        totalOutstanding: 0,
        overdue: {
          count: 0,
          total: 0,
          items: [],
        },
        upcoming: [],
        byType: [],
        loans: [],
        monthlyTrend: [],
        _note: "Loan model belum diimplementasi. Data akan tersedia setelah model Loan ditambahkan ke schema.",
      },
    });
  } catch (error) {
    console.error("Get loans error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}
