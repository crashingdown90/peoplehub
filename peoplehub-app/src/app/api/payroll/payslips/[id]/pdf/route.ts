import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { handlePrismaError } from "@/lib/api-utils";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/payroll/payslips/[id]/pdf - Generate PDF payslip
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const context = await getRequestContext();
        const { id } = await params;

        if (!context || !context.employeeId) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Employee not found" } },
                { status: 401 }
            );
        }

        const payslip = await prisma.payslip.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
                employeeId: context.employeeId,
                status: "PUBLISHED",
            },
            include: {
                employee: {
                    select: {
                        employeeNumber: true,
                        fullName: true,
                        nik: true,
                        npwp: true,
                        bankName: true,
                        bankAccountNumber: true,
                        bankAccountHolder: true,
                        branch: { select: { name: true } },
                        department: { select: { name: true } },
                        position: { select: { name: true } },
                    },
                },
            },
        });

        if (!payslip) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Slip gaji tidak ditemukan" } },
                { status: 404 }
            );
        }

        // Generate HTML for PDF (will be rendered client-side)
        const formatCurrency = (amount: number) =>
            new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

        const formatPeriod = (period: string) => {
            const [year, month] = period.split("-");
            return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        };

        const allowances = (payslip.allowances as Record<string, number>) || {};
        const otherDeductions = (payslip.otherDeductions as Record<string, number>) || {};

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Slip Gaji - ${payslip.employee.fullName} - ${formatPeriod(payslip.period)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .header h1 { font-size: 18px; }
    .header h2 { font-size: 14px; color: #666; }
    .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .info-left, .info-right { width: 48%; }
    .info-row { margin-bottom: 5px; display: flex; }
    .info-label { width: 120px; color: #666; }
    .info-value { font-weight: bold; }
    .section { margin-bottom: 15px; }
    .section-title { font-weight: bold; background: #f5f5f5; padding: 5px; margin-bottom: 5px; }
    .row { display: flex; justify-content: space-between; padding: 3px 5px; }
    .row:nth-child(even) { background: #fafafa; }
    .total-row { font-weight: bold; border-top: 1px solid #333; padding-top: 5px; margin-top: 5px; }
    .net-salary { font-size: 16px; text-align: center; margin-top: 20px; padding: 10px; background: #e3f2fd; }
    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SLIP GAJI</h1>
    <h2>Periode: ${formatPeriod(payslip.period)}</h2>
  </div>
  
  <div class="info">
    <div class="info-left">
      <div class="info-row"><span class="info-label">Nama:</span><span class="info-value">${payslip.employee.fullName}</span></div>
      <div class="info-row"><span class="info-label">No. Karyawan:</span><span class="info-value">${payslip.employee.employeeNumber}</span></div>
      <div class="info-row"><span class="info-label">NIK:</span><span class="info-value">${payslip.employee.nik || "-"}</span></div>
      <div class="info-row"><span class="info-label">NPWP:</span><span class="info-value">${payslip.employee.npwp || "-"}</span></div>
    </div>
    <div class="info-right">
      <div class="info-row"><span class="info-label">Cabang:</span><span class="info-value">${payslip.employee.branch?.name || "-"}</span></div>
      <div class="info-row"><span class="info-label">Departemen:</span><span class="info-value">${payslip.employee.department?.name || "-"}</span></div>
      <div class="info-row"><span class="info-label">Jabatan:</span><span class="info-value">${payslip.employee.position?.name || "-"}</span></div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">PENDAPATAN</div>
    <div class="row"><span>Gaji Pokok</span><span>${formatCurrency(Number(payslip.basicSalary))}</span></div>
    ${Object.entries(allowances).map(([key, val]) => `<div class="row"><span>Tunjangan ${key}</span><span>${formatCurrency(val)}</span></div>`).join("")}
    <div class="row"><span>Lembur</span><span>${formatCurrency(Number(payslip.overtimeAmount))}</span></div>
    <div class="row"><span>Bonus</span><span>${formatCurrency(Number(payslip.bonus))}</span></div>
    <div class="row total-row"><span>Total Pendapatan</span><span>${formatCurrency(Number(payslip.grossSalary))}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">POTONGAN</div>
    <div class="row"><span>Potongan Terlambat</span><span>${formatCurrency(Number(payslip.lateDeduction))}</span></div>
    <div class="row"><span>Potongan Absen</span><span>${formatCurrency(Number(payslip.absentDeduction))}</span></div>
    <div class="row"><span>PPh 21</span><span>${formatCurrency(Number(payslip.taxDeduction))}</span></div>
    <div class="row"><span>BPJS Kesehatan</span><span>${formatCurrency(Number(payslip.bpjsKesehatan))}</span></div>
    <div class="row"><span>BPJS Ketenagakerjaan</span><span>${formatCurrency(Number(payslip.bpjsKetenagakerjaan))}</span></div>
    ${Object.entries(otherDeductions).map(([key, val]) => `<div class="row"><span>${key}</span><span>${formatCurrency(val)}</span></div>`).join("")}
    <div class="row total-row"><span>Total Potongan</span><span>${formatCurrency(Number(payslip.totalDeductions))}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">RINGKASAN KEHADIRAN</div>
    <div class="row"><span>Hari Kerja</span><span>${payslip.workDays} hari</span></div>
    <div class="row"><span>Hadir</span><span>${payslip.presentDays} hari</span></div>
    <div class="row"><span>Terlambat</span><span>${payslip.lateDays} hari</span></div>
    <div class="row"><span>Tidak Hadir</span><span>${payslip.absentDays} hari</span></div>
    <div class="row"><span>Cuti</span><span>${payslip.leaveDays} hari</span></div>
    <div class="row"><span>Lembur</span><span>${Number(payslip.overtimeHours)} jam</span></div>
  </div>
  
  <div class="net-salary">
    <strong>GAJI BERSIH: ${formatCurrency(Number(payslip.netSalary))}</strong>
  </div>
  
  ${payslip.employee.bankName ? `
  <div class="section" style="margin-top: 20px;">
    <div class="section-title">INFORMASI BANK</div>
    <div class="row"><span>Bank</span><span>${payslip.employee.bankName}</span></div>
    <div class="row"><span>No. Rekening</span><span>${payslip.employee.bankAccountNumber}</span></div>
    <div class="row"><span>Atas Nama</span><span>${payslip.employee.bankAccountHolder}</span></div>
  </div>
  ` : ""}
  
  <div class="footer">
    <p>Dokumen ini digenerate secara otomatis pada ${new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}</p>
    <p>Slip gaji ini bersifat rahasia dan pribadi</p>
  </div>
</body>
</html>
    `;

        return new Response(htmlContent, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Content-Disposition": `inline; filename="slip-gaji-${payslip.employee.employeeNumber}-${payslip.period}.html"`,
            },
        });
    } catch (error) {
        console.error("Generate payslip PDF error:", error);
        return handlePrismaError(error);
    }
}
