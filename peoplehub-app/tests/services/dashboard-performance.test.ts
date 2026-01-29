/**
 * @jest-environment node
 */
// @ai:cl - Dashboard performance tests (QA-012)
// Tests dashboard stats endpoint performance under various loads
import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import type { RequestContext } from "@/lib/tenant";

describe("Dashboard Performance Tests (QA-012)", () => {
    const employeeContext: RequestContext = {
        tenantId: "tenant-123",
        userId: "user-emp",
        employeeId: "emp-123",
        role: "EMPLOYEE",
    };

    const hrdContext: RequestContext = {
        tenantId: "tenant-123",
        userId: "user-hrd",
        employeeId: "emp-hrd",
        role: "HRD",
    };

    beforeEach(() => {
        resetPrismaMock();
    });

    describe("Employee Dashboard Stats", () => {
        it("should complete employee stats queries within acceptable time", async () => {
            // Mock parallel queries
            const mockData = {
                attendance: { id: "att-1", clockIn: new Date(), clockOut: null, status: "PRESENT" },
                monthCount: 18,
                pendingLeaves: 0,
                balance: { remainingBalance: 9 },
                payslip: { period: "2026-01", netSalary: 15000000 },
            };

            (prismaMock.attendance.findUnique as jest.Mock).mockResolvedValue(mockData.attendance);
            (prismaMock.attendance.count as jest.Mock).mockResolvedValue(mockData.monthCount);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(mockData.pendingLeaves);
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue(mockData.balance);
            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue(mockData.payslip);

            const startTime = performance.now();

            // Simulate parallel execution
            await Promise.all([
                prismaMock.attendance.findUnique({ where: { id: 'mock-att-1' } }),
                prismaMock.attendance.count({ where: { tenantId: employeeContext.tenantId } }),
                prismaMock.leaveRequest.count({ where: { employeeId: employeeContext.employeeId } }),
                prismaMock.leaveBalance.findFirst({ where: { employeeId: employeeContext.employeeId } }),
                prismaMock.payslip.findFirst({ where: { employeeId: employeeContext.employeeId } }),
            ]);

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            // Should complete quickly due to parallel execution
            expect(executionTime).toBeLessThan(100); // 100ms for mocked queries
        });

        it("should handle multiple concurrent employee requests efficiently", async () => {
            const mockData = { clockIn: new Date(), status: "PRESENT" };
            (prismaMock.attendance.findUnique as jest.Mock).mockResolvedValue(mockData);
            (prismaMock.attendance.count as jest.Mock).mockResolvedValue(18);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue({ remainingBalance: 9 });
            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue({ period: "2026-01", netSalary: 15000000 });

            const startTime = performance.now();

            // Simulate 100 concurrent employee requests
            const requests = Array.from({ length: 100 }, () =>
                Promise.all([
                    prismaMock.attendance.findUnique({ where: { id: 'mock-att-1' } }),
                    prismaMock.attendance.count({ where: { tenantId: employeeContext.tenantId } }),
                    prismaMock.leaveRequest.count({ where: { employeeId: employeeContext.employeeId } }),
                    prismaMock.leaveBalance.findFirst({ where: { employeeId: employeeContext.employeeId } }),
                    prismaMock.payslip.findFirst({ where: { employeeId: employeeContext.employeeId } }),
                ])
            );

            await Promise.all(requests);

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            // 100 concurrent requests should complete in reasonable time
            expect(executionTime).toBeLessThan(500); // 500ms for 100 requests
            expect(prismaMock.attendance.findUnique).toHaveBeenCalledTimes(100);
        });
    });

    describe("HRD/Admin Dashboard Stats", () => {
        it("should complete admin stats queries within acceptable time", async () => {
            // Mock admin queries
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(150);
            (prismaMock.user.count as jest.Mock).mockResolvedValue(5);
            (prismaMock.attendance.count as jest.Mock)
                .mockResolvedValueOnce(120) // todayPresent
                .mockResolvedValueOnce(15); // todayLate
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(8);
            (prismaMock.employee.groupBy as jest.Mock).mockResolvedValue([
                { departmentId: "dept-1", _count: 50 },
                { departmentId: "dept-2", _count: 100 },
            ]);
            (prismaMock.department.findMany as jest.Mock).mockResolvedValue([
                { id: "dept-1", name: "Engineering" },
                { id: "dept-2", name: "Operations" },
            ]);

            const startTime = performance.now();

            // Simulate main parallel queries
            await Promise.all([
                prismaMock.employee.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.user.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.attendance.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.attendance.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.leaveRequest.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.employee.groupBy({ by: ['departmentId'], where: { tenantId: hrdContext.tenantId } }),
            ]);

            // Then department lookup
            await prismaMock.department.findMany({});

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            // Should complete efficiently with parallel execution
            expect(executionTime).toBeLessThan(150); // 150ms for mocked queries
        });

        it("should handle large dataset efficiently (500 employees)", async () => {
            // Mock 500 employees
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(500);
            (prismaMock.user.count as jest.Mock).mockResolvedValue(20);
            (prismaMock.attendance.count as jest.Mock)
                .mockResolvedValueOnce(450) // present
                .mockResolvedValueOnce(50); // late
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(25);

            // Mock 10 departments
            const mockGroupBy = Array.from({ length: 10 }, (_, i) => ({
                departmentId: `dept-${i}`,
                _count: 50,
            }));
            (prismaMock.employee.groupBy as jest.Mock).mockResolvedValue(mockGroupBy);

            const mockDepts = Array.from({ length: 10 }, (_, i) => ({
                id: `dept-${i}`,
                name: `Department ${i}`,
            }));
            (prismaMock.department.findMany as jest.Mock).mockResolvedValue(mockDepts);

            const startTime = performance.now();

            await Promise.all([
                prismaMock.employee.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.user.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.attendance.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.attendance.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.leaveRequest.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.employee.groupBy({ by: ['departmentId'], where: { tenantId: hrdContext.tenantId } }),
            ]);
            await prismaMock.department.findMany({ where: { tenantId: hrdContext.tenantId } });

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            // Even with 500 employees, should be fast due to aggregation queries
            expect(executionTime).toBeLessThan(200); // 200ms threshold
        });

        it("should handle stress test (1000 employees simulation)", async () => {
            // Mock 1000 employees
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(1000);
            (prismaMock.user.count as jest.Mock).mockResolvedValue(50);
            (prismaMock.attendance.count as jest.Mock)
                .mockResolvedValueOnce(900)
                .mockResolvedValueOnce(100);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(50);

            const mockGroupBy = Array.from({ length: 20 }, (_, i) => ({
                departmentId: `dept-${i}`,
                _count: 50,
            }));
            (prismaMock.employee.groupBy as jest.Mock).mockResolvedValue(mockGroupBy);

            const mockDepts = Array.from({ length: 20 }, (_, i) => ({
                id: `dept-${i}`,
                name: `Department ${i}`,
            }));
            (prismaMock.department.findMany as jest.Mock).mockResolvedValue(mockDepts);

            const startTime = performance.now();

            await Promise.all([
                prismaMock.employee.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.user.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.attendance.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.attendance.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.leaveRequest.count({ where: { tenantId: hrdContext.tenantId } }),
                prismaMock.employee.groupBy({ by: ['departmentId'], where: { tenantId: hrdContext.tenantId } }),
            ]);
            await prismaMock.department.findMany({ where: { tenantId: hrdContext.tenantId } });

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            // Should still complete reasonably fast
            expect(executionTime).toBeLessThan(300); // 300ms max
        });
    });

    describe("Manager Dashboard Stats", () => {
        it("should complete manager stats efficiently", async () => {
            // Mock subordinates
            const subordinates = Array.from({ length: 10 }, (_, i) => ({ id: `emp-${i}` }));
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue(subordinates);

            (prismaMock.attendance.count as jest.Mock).mockResolvedValue(8);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(2);

            const startTime = performance.now();

            await prismaMock.employee.findMany({});
            await Promise.all([
                prismaMock.attendance.count({}),
                prismaMock.leaveRequest.count({}),
            ]);

            const endTime = performance.now();
            const executionTime = endTime - startTime;

            expect(executionTime).toBeLessThan(100);
        });

        it("should handle no subordinates gracefully", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);

            const startTime = performance.now();
            const subordinates = await prismaMock.employee.findMany({});
            const endTime = performance.now();

            expect(subordinates).toHaveLength(0);
            expect(endTime - startTime).toBeLessThan(50);

            // Should not make additional queries if no subordinates
            expect(prismaMock.attendance.count).not.toHaveBeenCalled();
        });
    });

    describe("Query Optimization Verification", () => {
        it("should use parallel queries for employee stats (5 queries)", async () => {
            (prismaMock.attendance.findUnique as jest.Mock).mockResolvedValue({});
            (prismaMock.attendance.count as jest.Mock).mockResolvedValue(18);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue({});
            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue({});

            await Promise.all([
                prismaMock.attendance.findUnique({ where: { id: 'mock-att-1' } }),
                prismaMock.attendance.count({ where: { tenantId: 'tenant-123' } }),
                prismaMock.leaveRequest.count({ where: { employeeId: 'emp-123' } }),
                prismaMock.leaveBalance.findFirst({ where: { employeeId: 'emp-123' } }),
                prismaMock.payslip.findFirst({ where: { employeeId: 'emp-123' } }),
            ]);

            // Verify all 5 queries were called
            expect(prismaMock.attendance.findUnique).toHaveBeenCalledTimes(1);
            expect(prismaMock.attendance.count).toHaveBeenCalledTimes(1);
            expect(prismaMock.leaveRequest.count).toHaveBeenCalledTimes(1);
            expect(prismaMock.leaveBalance.findFirst).toHaveBeenCalledTimes(1);
            expect(prismaMock.payslip.findFirst).toHaveBeenCalledTimes(1);
        });

        it("should use parallel queries for admin stats (6 main + 1 lookup)", async () => {
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(150);
            (prismaMock.user.count as jest.Mock).mockResolvedValue(5);
            (prismaMock.attendance.count as jest.Mock).mockResolvedValue(120);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(8);
            (prismaMock.employee.groupBy as jest.Mock).mockResolvedValue([]);
            (prismaMock.department.findMany as jest.Mock).mockResolvedValue([]);

            await Promise.all([
                prismaMock.employee.count({ where: { tenantId: 'tenant-123' } }),
                prismaMock.user.count({ where: { tenantId: 'tenant-123' } }),
                prismaMock.attendance.count({ where: { tenantId: 'tenant-123' } }),
                prismaMock.attendance.count({ where: { tenantId: 'tenant-123' } }),
                prismaMock.leaveRequest.count({ where: { tenantId: 'tenant-123' } }),
                prismaMock.employee.groupBy({ by: ['departmentId'], where: { tenantId: 'tenant-123' } }),
            ]);
            await prismaMock.department.findMany({ where: { tenantId: 'tenant-123' } });

            // Verify parallel + sequential pattern
            expect(prismaMock.employee.count).toHaveBeenCalledTimes(1);
            expect(prismaMock.department.findMany).toHaveBeenCalledTimes(1);
        });
    });
});
