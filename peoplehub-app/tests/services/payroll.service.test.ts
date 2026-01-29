/**
 * @jest-environment node
 */
// @ai:cl - Unit tests for PayrollService
import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { resetCacheMock } from "../mocks/cache";
import {
    hrdContext,
    financeContext,
    employeeContext,
    createMockContext,
} from "../mocks/context";
import { PayrollService } from "@/services/payroll/payroll.service";

describe("PayrollService", () => {
    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
    });

    describe("getPayslips", () => {
        const mockPayslips = [
            {
                id: "payslip-1",
                tenantId: "tenant-123",
                employeeId: "emp-1",
                period: "2025-01",
                basicSalary: 10000000,
                grossSalary: 12000000,
                totalDeductions: 2000000,
                netSalary: 10000000,
                workDays: 22,
                presentDays: 20,
                status: "PUBLISHED",
                publishedAt: new Date(),
                employee: {
                    fullName: "John Doe",
                    employeeNumber: "EMP001",
                    position: { name: "Developer" },
                    department: { name: "Engineering" },
                },
            },
        ];

        it("should return own payslips for regular employee", async () => {
            (prismaMock.payslip.findMany as jest.Mock).mockResolvedValue(mockPayslips);
            (prismaMock.payslip.count as jest.Mock).mockResolvedValue(1);

            const result = await PayrollService.getPayslips(employeeContext, {
                page: 1,
                limit: 20,
            });

            expect(result.success).toBe(true);
            expect(prismaMock.payslip.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        employeeId: employeeContext.employeeId,
                        status: "PUBLISHED",
                    }),
                })
            );
        });

        it("should return all payslips for HRD", async () => {
            (prismaMock.payslip.findMany as jest.Mock).mockResolvedValue(mockPayslips);
            (prismaMock.payslip.count as jest.Mock).mockResolvedValue(1);

            const result = await PayrollService.getPayslips(hrdContext, {
                page: 1,
                limit: 20,
            });

            expect(result.success).toBe(true);
        });

        it("should return all payslips for FINANCE", async () => {
            (prismaMock.payslip.findMany as jest.Mock).mockResolvedValue(mockPayslips);
            (prismaMock.payslip.count as jest.Mock).mockResolvedValue(1);

            const result = await PayrollService.getPayslips(financeContext, {
                page: 1,
                limit: 20,
            });

            expect(result.success).toBe(true);
        });

        it("should filter by period", async () => {
            (prismaMock.payslip.findMany as jest.Mock).mockResolvedValue(mockPayslips);
            (prismaMock.payslip.count as jest.Mock).mockResolvedValue(1);

            await PayrollService.getPayslips(hrdContext, {
                page: 1,
                limit: 20,
                period: "2025-01",
            });

            expect(prismaMock.payslip.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        period: "2025-01",
                    }),
                })
            );
        });

        it("should filter by status for admin", async () => {
            (prismaMock.payslip.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.payslip.count as jest.Mock).mockResolvedValue(0);

            await PayrollService.getPayslips(hrdContext, {
                page: 1,
                limit: 20,
                status: "DRAFT",
            });

            expect(prismaMock.payslip.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: "DRAFT",
                    }),
                })
            );
        });
    });

    describe("getPayslipById", () => {
        const mockPayslip = {
            id: "payslip-1",
            tenantId: "tenant-123",
            employeeId: "employee-123",
            period: "2025-01",
            basicSalary: 10000000,
            grossSalary: 12000000,
            totalDeductions: 2000000,
            netSalary: 10000000,
            status: "PUBLISHED",
            employee: {
                fullName: "John Doe",
                employeeNumber: "EMP001",
                nik: "1234567890",
                npwp: "12.345.678.9-012.345",
                bankName: "BCA",
                bankAccountNumber: "1234567890",
                bankAccountHolder: "John Doe",
                position: { name: "Developer" },
                department: { name: "Engineering" },
                branch: { name: "Head Office" },
            },
        };

        it("should return payslip for owner", async () => {
            const ownerContext = createMockContext({ employeeId: "employee-123" });
            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue(mockPayslip);

            const result = await PayrollService.getPayslipById(ownerContext, "payslip-1");

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe("payslip-1");
        });

        it("should return payslip for HRD", async () => {
            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue(mockPayslip);

            const result = await PayrollService.getPayslipById(hrdContext, "payslip-1");

            expect(result.success).toBe(true);
        });

        it("should return NOT_FOUND for non-existent payslip", async () => {
            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await PayrollService.getPayslipById(hrdContext, "non-existent");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should deny access to other employee payslip for regular employee", async () => {
            const otherPayslip = {
                ...mockPayslip,
                employeeId: "other-employee",
                status: "PUBLISHED",
            };
            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue(otherPayslip);

            const result = await PayrollService.getPayslipById(employeeContext, "payslip-1");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });
    });

    describe("bulkGeneratePayslips", () => {
        it("should deny access for non-admin", async () => {
            const result = await PayrollService.bulkGeneratePayslips(employeeContext, "2025-01");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should be callable by HRD", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);

            const result = await PayrollService.bulkGeneratePayslips(hrdContext, "2025-01");

            // Should succeed even with no employees
            expect(result.success).toBe(true);
        });

        it("should be callable by FINANCE", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);

            const result = await PayrollService.bulkGeneratePayslips(financeContext, "2025-01");

            expect(result.success).toBe(true);
        });
    });

    describe("bulkPublishPayslips", () => {
        it("should publish all draft payslips for a period", async () => {
            (prismaMock.payslip.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

            const result = await PayrollService.bulkPublishPayslips(financeContext, "2025-01");

            expect(result.success).toBe(true);
            expect(result.data?.published).toBe(5);
        });

        it("should deny access for non-admin", async () => {
            const result = await PayrollService.bulkPublishPayslips(employeeContext, "2025-01");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should return 0 when no payslips to publish", async () => {
            (prismaMock.payslip.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

            const result = await PayrollService.bulkPublishPayslips(hrdContext, "2025-01");

            expect(result.success).toBe(true);
            expect(result.data?.published).toBe(0);
        });
    });
});
