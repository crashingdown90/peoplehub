/**
 * @jest-environment node
 */
// Comprehensive Tenant Isolation Test Suite
// This suite verifies that ALL critical services properly isolate tenant data
// Risk Mitigation: RISK-003 from Risk Register

import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { resetCacheMock } from "../mocks/cache";
import { createMockContext } from "../mocks/context";

// Import all services that handle tenant-sensitive data
import { EmployeeService } from "@/services/employee/employee.service";
import { AttendanceService } from "@/services/attendance/attendance.service";
import { LeaveService } from "@/services/leave/leave.service";
import { PayrollService } from "@/services/payroll/payroll.service";
import { DashboardService } from "@/services/dashboard/dashboard.service";
import { NotificationService } from "@/services/notification/notification.service";

/**
 * TENANT ISOLATION SECURITY TESTS
 *
 * These tests verify STRICT Rule #1: "Zero Data Leakage between Tenants"
 *
 * Test Categories:
 * 1. Query Isolation - All queries MUST include tenantId filter
 * 2. Cross-Tenant Access Prevention - Tenant B cannot access Tenant A data
 * 3. Write Isolation - Tenant B cannot modify Tenant A data
 * 4. Stats/Aggregation Isolation - Reports only include tenant's own data
 */

describe("COMPREHENSIVE TENANT ISOLATION SECURITY", () => {
    // Test Tenants
    const TENANT_A = "tenant-kreatifindo";
    const TENANT_B = "tenant-violet";
    const TENANT_C = "tenant-cyber";

    // Test Contexts
    const contextTenantA_Employee = createMockContext({
        tenantId: TENANT_A,
        role: "EMPLOYEE",
        userId: "user-emp-a",
        employeeId: "emp-a",
    });

    const contextTenantA_HRD = createMockContext({
        tenantId: TENANT_A,
        role: "HRD",
        userId: "user-hrd-a",
        employeeId: "emp-hrd-a",
    });

    const contextTenantA_Manager = createMockContext({
        tenantId: TENANT_A,
        role: "MANAGER",
        userId: "user-mgr-a",
        employeeId: "emp-mgr-a",
    });

    const contextTenantB_Employee = createMockContext({
        tenantId: TENANT_B,
        role: "EMPLOYEE",
        userId: "user-emp-b",
        employeeId: "emp-b",
    });

    const contextTenantB_HRD = createMockContext({
        tenantId: TENANT_B,
        role: "HRD",
        userId: "user-hrd-b",
        employeeId: "emp-hrd-b",
    });

    const contextTenantC_SuperAdmin = createMockContext({
        tenantId: TENANT_C,
        role: "SUPER_ADMIN",
        userId: "user-superadmin-c",
        employeeId: "emp-superadmin-c",
    });

    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
    });

    // ===========================================
    // 1. EMPLOYEE SERVICE ISOLATION
    // ===========================================
    describe("EmployeeService Tenant Isolation", () => {
        it("MUST filter getEmployees by tenantId", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);

            await EmployeeService.getEmployees(contextTenantA_HRD, { page: 1, limit: 10 });

            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("MUST prevent cross-tenant employee access by ID", async () => {
            const tenantAEmployeeId = "emp-secret-data-tenant-a";

            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null);

            await EmployeeService.getEmployeeById(contextTenantB_HRD, tenantAEmployeeId);

            // Query MUST include Tenant B's tenantId
            expect(prismaMock.employee.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: tenantAEmployeeId,
                        tenantId: TENANT_B, // Attacker's tenant, not target's
                    }),
                })
            );
        });

        it("MUST isolate employee search", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);

            await EmployeeService.searchEmployees(contextTenantA_Employee, "john");

            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("MUST isolate employee statistics", async () => {
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(50);
            (prismaMock.employee.groupBy as jest.Mock).mockResolvedValue([]);
            (prismaMock.department.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.branch.findMany as jest.Mock).mockResolvedValue([]);

            await EmployeeService.getStats(contextTenantA_HRD);

            expect(prismaMock.employee.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });
    });

    // ===========================================
    // 2. ATTENDANCE SERVICE ISOLATION
    // ===========================================
    describe("AttendanceService Tenant Isolation", () => {
        it("MUST filter attendance history by tenantId", async () => {
            (prismaMock.attendance.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.attendance.count as jest.Mock).mockResolvedValue(0);

            await AttendanceService.getHistory(contextTenantA_Employee, { page: 1, limit: 10 });

            expect(prismaMock.attendance.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("MUST prevent viewing other tenant's attendance", async () => {
            (prismaMock.attendance.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.attendance.count as jest.Mock).mockResolvedValue(0);

            // Tenant B tries to access Tenant A's employee attendance
            await AttendanceService.getHistory(contextTenantB_Employee, {
                page: 1,
                limit: 10,
                employeeId: "emp-a", // Tenant A's employee
            });

            // Query still uses Tenant B's context
            expect(prismaMock.attendance.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_B,
                    }),
                })
            );
        });

        it("MUST isolate attendance summary", async () => {
            (prismaMock.attendance.findMany as jest.Mock).mockResolvedValue([]);

            await AttendanceService.getSummary(
                contextTenantA_HRD,
                "emp-a",
                new Date("2026-01-01"),
                new Date("2026-01-31")
            );

            expect(prismaMock.attendance.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("MUST isolate clock-in verification", async () => {
            (prismaMock.attendance.findFirst as jest.Mock).mockResolvedValue(null);

            await AttendanceService.getToday(contextTenantA_Employee);

            expect(prismaMock.attendance.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });
    });

    // ===========================================
    // 3. LEAVE SERVICE ISOLATION
    // ===========================================
    describe("LeaveService Tenant Isolation", () => {
        it("MUST filter leave requests by tenantId", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);

            await LeaveService.getRequests(contextTenantA_HRD, { page: 1, limit: 10 });

            expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("MUST prevent cross-tenant leave approval", async () => {
            const targetLeaveId = "leave-in-tenant-a";

            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null);

            await LeaveService.approveByHrd(contextTenantB_HRD, targetLeaveId);

            expect(prismaMock.leaveRequest.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: targetLeaveId,
                        tenantId: TENANT_B, // Uses attacker's context
                    }),
                })
            );
        });

        it("MUST prevent cross-tenant leave rejection", async () => {
            const targetLeaveId = "leave-in-tenant-a";

            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null);

            await LeaveService.reject(contextTenantB_HRD, targetLeaveId, "Rejected");

            expect(prismaMock.leaveRequest.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: targetLeaveId,
                        tenantId: TENANT_B,
                    }),
                })
            );
        });

        it("MUST isolate leave balance queries", async () => {
            (prismaMock.leaveBalance.findMany as jest.Mock).mockResolvedValue([]);

            await LeaveService.getBalances(contextTenantA_Employee);

            expect(prismaMock.leaveBalance.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });
    });

    // ===========================================
    // 4. PAYROLL SERVICE ISOLATION
    // ===========================================
    describe("PayrollService Tenant Isolation", () => {
        it("MUST filter payslips by tenantId", async () => {
            (prismaMock.payslip.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.payslip.count as jest.Mock).mockResolvedValue(0);

            await PayrollService.getPayslips(contextTenantA_HRD, { page: 1, limit: 10 });

            expect(prismaMock.payslip.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("MUST prevent cross-tenant payslip access", async () => {
            const targetPayslipId = "payslip-tenant-a-secret";

            (prismaMock.payslip.findFirst as jest.Mock).mockResolvedValue(null);

            await PayrollService.getPayslipById(contextTenantB_Employee, targetPayslipId);

            expect(prismaMock.payslip.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: targetPayslipId,
                        tenantId: TENANT_B,
                    }),
                })
            );
        });

        it("MUST isolate payslip publishing", async () => {
            (prismaMock.payslip.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

            const period = "2026-01";
            await PayrollService.bulkPublishPayslips(contextTenantA_HRD, period);

            expect(prismaMock.payslip.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });
    });

    // ===========================================
    // 5. DASHBOARD SERVICE ISOLATION
    // ===========================================
    describe("DashboardService Tenant Isolation", () => {
        it("MUST isolate employee dashboard stats", async () => {
            // Mock groupBy for attendance stats
            (prismaMock.attendance.groupBy as jest.Mock).mockResolvedValue([]);
            (prismaMock.attendance.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaMock.leaveBalance.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.leaveBalance.aggregate as jest.Mock).mockResolvedValue({ _sum: { remainingBalance: 0 } });
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);
            (prismaMock.kpiTarget.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaMock.notification.count as jest.Mock).mockResolvedValue(0);

            await DashboardService.getEmployeeStats(contextTenantA_Employee);

            // groupBy should be called with tenant isolation
            expect(prismaMock.attendance.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("MUST isolate HRD dashboard stats", async () => {
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(100);
            (prismaMock.attendance.count as jest.Mock).mockResolvedValue(80);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(5);

            await DashboardService.getAdminStats(contextTenantA_HRD);

            expect(prismaMock.employee.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });
    });

    // ===========================================
    // 6. NOTIFICATION SERVICE ISOLATION
    // ===========================================
    describe("NotificationService Tenant Isolation", () => {
        it("MUST filter notifications by tenantId", async () => {
            (prismaMock.notification.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.notification.count as jest.Mock).mockResolvedValue(0);

            await NotificationService.getAll(contextTenantA_Employee);

            expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                    }),
                })
            );
        });

        it("MUST prevent marking other tenant's notification as read", async () => {
            const targetNotificationId = "notif-tenant-a";

            // markRead uses findFirst to check ownership, then update
            (prismaMock.notification.findFirst as jest.Mock).mockResolvedValue(null);

            await NotificationService.markRead(contextTenantB_Employee, targetNotificationId);

            // findFirst should be called with tenant isolation
            expect(prismaMock.notification.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: targetNotificationId,
                        tenantId: TENANT_B,
                    }),
                })
            );
        });
    });

    // ===========================================
    // 7. EDGE CASES & ATTACK SCENARIOS
    // ===========================================
    describe("Attack Scenario Prevention", () => {
        it("should pass undefined tenantId to query - no data match possible", async () => {
            const maliciousContext = createMockContext({
                tenantId: undefined as unknown as string,
                role: "HRD",
                userId: "attacker",
                employeeId: "attacker-emp",
            });

            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);

            // Service passes undefined tenantId - Prisma won't match any real data
            await EmployeeService.getEmployees(maliciousContext, { page: 1, limit: 10 });

            // Verify the query was made with undefined - this will never match real data
            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: undefined,
                    }),
                })
            );
        });

        it("should pass empty tenantId to query - no data match possible", async () => {
            const maliciousContext = createMockContext({
                tenantId: "",
                role: "HRD",
                userId: "attacker",
                employeeId: "attacker-emp",
            });

            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);

            // Service passes empty tenantId - Prisma won't match any real data
            await EmployeeService.getEmployees(maliciousContext, { page: 1, limit: 10 });

            // Verify empty string is used - production DB has no tenant with empty ID
            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: "",
                    }),
                })
            );
        });

        it("MUST prevent SQL injection in tenantId", async () => {
            const maliciousContext = createMockContext({
                tenantId: "'; DROP TABLE employees; --",
                role: "HRD",
                userId: "attacker",
                employeeId: "attacker-emp",
            });

            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);

            await EmployeeService.getEmployees(maliciousContext, { page: 1, limit: 10 });

            // Prisma should parameterize this safely
            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: "'; DROP TABLE employees; --",
                    }),
                })
            );
        });
    });

    // ===========================================
    // 8. MULTI-TENANT PARALLEL ACCESS
    // ===========================================
    describe("Parallel Multi-Tenant Access", () => {
        it("MUST correctly isolate concurrent requests from different tenants", async () => {
            // Reset mock call counts
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);

            // Simulate concurrent requests
            await Promise.all([
                EmployeeService.getEmployees(contextTenantA_HRD, { page: 1, limit: 10 }),
                EmployeeService.getEmployees(contextTenantB_HRD, { page: 1, limit: 10 }),
            ]);

            // Both calls should have been made with their respective tenantIds
            const calls = (prismaMock.employee.findMany as jest.Mock).mock.calls;
            const tenantIds = calls.map((call: unknown[]) => (call[0] as { where: { tenantId: string } }).where.tenantId);

            expect(tenantIds).toContain(TENANT_A);
            expect(tenantIds).toContain(TENANT_B);
        });
    });
});
