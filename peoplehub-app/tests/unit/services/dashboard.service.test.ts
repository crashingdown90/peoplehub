/**
 * @jest-environment node
 */
// @ai:cl - DashboardService unit tests - Refactored to use centralized mocks
import { prismaMock, resetPrismaMock } from "../../mocks/prisma";
import { DashboardService } from "@/services/dashboard/dashboard.service";
import type { RequestContext } from "@/lib/tenant";

describe("DashboardService", () => {
  // Test contexts
  const employeeContext: RequestContext = {
    tenantId: "tenant-123",
    userId: "user-123",
    employeeId: "emp-123",
    role: "EMPLOYEE",
  };

  const managerContext: RequestContext = {
    tenantId: "tenant-123",
    userId: "user-456",
    employeeId: "emp-456",
    role: "MANAGER",
  };

  const hrdContext: RequestContext = {
    tenantId: "tenant-123",
    userId: "user-789",
    employeeId: "emp-789",
    role: "HRD",
  };

  const superAdminContext: RequestContext = {
    tenantId: "tenant-123",
    userId: "user-admin",
    employeeId: "emp-admin",
    role: "SUPER_ADMIN",
  };

  beforeEach(() => {
    resetPrismaMock();
    // Setup default mocks
    (prismaMock.attendance.groupBy as jest.Mock).mockResolvedValue([]);
    (prismaMock.attendance.findFirst as jest.Mock).mockResolvedValue(null);
    (prismaMock.attendance.count as jest.Mock).mockResolvedValue(0);
    (prismaMock.leaveBalance.aggregate as jest.Mock).mockResolvedValue({ _sum: { remainingBalance: 0 } });
    (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);
    (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(null);
    (prismaMock.kpiTarget.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.notification.count as jest.Mock).mockResolvedValue(0);
    (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);
    (prismaMock.travelRequest.count as jest.Mock).mockResolvedValue(0);
    (prismaMock.reimburseRequest.count as jest.Mock).mockResolvedValue(0);
    (prismaMock.user.count as jest.Mock).mockResolvedValue(0);
    (prismaMock.payslip.count as jest.Mock).mockResolvedValue(0);
  });

  describe("getStats", () => {
    it("should route to employee stats for EMPLOYEE role", async () => {
      // Setup mocks for employee stats
      (prismaMock.attendance.groupBy as jest.Mock).mockResolvedValue([]);
      (prismaMock.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.leaveBalance.aggregate as jest.Mock).mockResolvedValue({ _sum: { remainingBalance: 12 } });
      (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.notification.count as jest.Mock).mockResolvedValue(0);

      const result = await DashboardService.getStats(employeeContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("attendance");
      expect(result.data).toHaveProperty("leave");
      expect(result.data).toHaveProperty("kpi");
      expect(result.data).toHaveProperty("notifications");
    });

    it("should route to manager stats for MANAGER role", async () => {
      // Setup mocks for employee stats (called first)
      (prismaMock.attendance.groupBy as jest.Mock).mockResolvedValue([]);
      (prismaMock.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.leaveBalance.aggregate as jest.Mock).mockResolvedValue({ _sum: { remainingBalance: 12 } });
      (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.notification.count as jest.Mock).mockResolvedValue(0);

      // Setup mocks for manager-specific stats
      (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([{ id: "sub-1" }, { id: "sub-2" }]);
      (prismaMock.attendance.count as jest.Mock).mockResolvedValue(2);
      (prismaMock.travelRequest.count as jest.Mock).mockResolvedValue(1);
      (prismaMock.reimburseRequest.count as jest.Mock).mockResolvedValue(0);

      const result = await DashboardService.getStats(managerContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("team");
      expect(result.data).toHaveProperty("approvals");
    });

    it("should route to admin stats for HRD role", async () => {
      // Setup mocks for admin stats
      (prismaMock.employee.count as jest.Mock).mockResolvedValue(50);
      (prismaMock.attendance.count as jest.Mock).mockResolvedValue(45);
      (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(5);
      (prismaMock.travelRequest.count as jest.Mock).mockResolvedValue(2);
      (prismaMock.reimburseRequest.count as jest.Mock).mockResolvedValue(3);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(1);
      (prismaMock.payslip.count as jest.Mock).mockResolvedValue(10);

      const result = await DashboardService.getStats(hrdContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("employees");
      expect(result.data).toHaveProperty("attendance");
      expect(result.data).toHaveProperty("approvals");
      expect(result.data).toHaveProperty("payroll");
    });

    it("should route to admin stats for SUPER_ADMIN role", async () => {
      (prismaMock.employee.count as jest.Mock).mockResolvedValue(100);
      (prismaMock.attendance.count as jest.Mock).mockResolvedValue(80);
      (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(10);
      (prismaMock.travelRequest.count as jest.Mock).mockResolvedValue(5);
      (prismaMock.reimburseRequest.count as jest.Mock).mockResolvedValue(3);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(2);
      (prismaMock.payslip.count as jest.Mock).mockResolvedValue(20);

      const result = await DashboardService.getStats(superAdminContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("employees");
    });

    it("should return FORBIDDEN for unknown role", async () => {
      const unknownContext = {
        ...employeeContext,
        role: "UNKNOWN" as unknown as RequestContext["role"],
      };

      const result = await DashboardService.getStats(unknownContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("getEmployeeStats", () => {
    it("should return complete employee stats", async () => {
      (prismaMock.attendance.groupBy as jest.Mock).mockResolvedValue([
        { status: "PRESENT", _count: { status: 15 } },
        { status: "LATE", _count: { status: 3 } },
        { status: "ABSENT", _count: { status: 1 } },
      ]);
      (prismaMock.attendance.findFirst as jest.Mock).mockResolvedValue({
        clockIn: new Date("2026-01-15T08:00:00"),
      });
      (prismaMock.leaveBalance.aggregate as jest.Mock).mockResolvedValue({
        _sum: { remainingBalance: 10 },
      });
      (prismaMock.leaveRequest.count as jest.Mock)
        .mockResolvedValueOnce(2) // pending
        .mockResolvedValueOnce(5); // approved this year
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue({
        id: "period-1",
        name: "Q1 2026",
        isActive: true,
      });
      (prismaMock.kpiTarget.findMany as jest.Mock).mockResolvedValue([
        { score: 85, actualValue: 80 },
        { score: 90, actualValue: 95 },
        { score: null, actualValue: null },
      ]);
      (prismaMock.notification.count as jest.Mock).mockResolvedValue(5);

      const result = await DashboardService.getEmployeeStats(employeeContext);

      expect(result.success).toBe(true);
      expect(result.data?.attendance.presentThisMonth).toBe(15);
      expect(result.data?.attendance.lateThisMonth).toBe(3);
      expect(result.data?.attendance.absentThisMonth).toBe(1);
      expect(result.data?.attendance.lastClockIn).toEqual(new Date("2026-01-15T08:00:00"));
      expect(result.data?.leave.balance).toBe(10);
      expect(result.data?.leave.pendingRequests).toBe(2);
      expect(result.data?.leave.approvedThisYear).toBe(5);
      expect(result.data?.kpi.totalTargets).toBe(3);
      expect(result.data?.kpi.completedTargets).toBe(2);
      expect(result.data?.kpi.currentScore).toBe(87.5); // (85+90)/2
      expect(result.data?.notifications.unreadCount).toBe(5);
    });

    it("should return NOT_FOUND when no employeeId in context", async () => {
      const contextNoEmployee: RequestContext = {
        ...employeeContext,
        employeeId: undefined,
      };

      const result = await DashboardService.getEmployeeStats(contextNoEmployee);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("should handle null values gracefully", async () => {
      (prismaMock.attendance.groupBy as jest.Mock).mockResolvedValue([]);
      (prismaMock.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.leaveBalance.aggregate as jest.Mock).mockResolvedValue({
        _sum: { remainingBalance: null },
      });
      (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.notification.count as jest.Mock).mockResolvedValue(0);

      const result = await DashboardService.getEmployeeStats(employeeContext);

      expect(result.success).toBe(true);
      expect(result.data?.attendance.presentThisMonth).toBe(0);
      expect(result.data?.attendance.lastClockIn).toBeNull();
      expect(result.data?.leave.balance).toBe(0);
      expect(result.data?.kpi.currentScore).toBeNull();
    });
  });

  describe("getManagerStats", () => {
    beforeEach(() => {
      // Setup default employee stats mocks
      (prismaMock.attendance.groupBy as jest.Mock).mockResolvedValue([]);
      (prismaMock.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.leaveBalance.aggregate as jest.Mock).mockResolvedValue({ _sum: { remainingBalance: 12 } });
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.notification.count as jest.Mock).mockResolvedValue(0);
    });

    it("should return manager stats with team info", async () => {
      (prismaMock.leaveRequest.count as jest.Mock)
        .mockResolvedValueOnce(0) // employee pending
        .mockResolvedValueOnce(0) // employee approved
        .mockResolvedValueOnce(1) // team on leave today
        .mockResolvedValueOnce(3); // team pending leave

      (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([
        { id: "sub-1" },
        { id: "sub-2" },
        { id: "sub-3" },
      ]);
      (prismaMock.attendance.count as jest.Mock).mockResolvedValue(2); // team present today
      (prismaMock.travelRequest.count as jest.Mock).mockResolvedValue(2);
      (prismaMock.reimburseRequest.count as jest.Mock).mockResolvedValue(1);

      const result = await DashboardService.getManagerStats(managerContext);

      expect(result.success).toBe(true);
      expect(result.data?.team.totalMembers).toBe(3);
      expect(result.data?.team.presentToday).toBe(2);
      expect(result.data?.approvals.pendingLeave).toBe(3);
      expect(result.data?.approvals.pendingTravel).toBe(2);
      expect(result.data?.approvals.pendingReimburse).toBe(1);
      expect(result.data?.approvals.total).toBe(6);
    });

    it("should return NOT_FOUND when no employeeId", async () => {
      const contextNoEmployee: RequestContext = {
        ...managerContext,
        employeeId: undefined,
      };

      const result = await DashboardService.getManagerStats(contextNoEmployee);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("should handle empty team", async () => {
      (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.attendance.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.travelRequest.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.reimburseRequest.count as jest.Mock).mockResolvedValue(0);

      const result = await DashboardService.getManagerStats(managerContext);

      expect(result.success).toBe(true);
      expect(result.data?.team.totalMembers).toBe(0);
      expect(result.data?.team.presentToday).toBe(0);
      expect(result.data?.approvals.total).toBe(0);
    });
  });

  describe("getAdminStats", () => {
    it("should return complete admin stats", async () => {
      (prismaMock.employee.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(90) // active
        .mockResolvedValueOnce(10); // terminated/inactive

      (prismaMock.attendance.count as jest.Mock)
        .mockResolvedValueOnce(70) // present
        .mockResolvedValueOnce(10) // late
        .mockResolvedValueOnce(80); // total attendance

      (prismaMock.leaveRequest.count as jest.Mock)
        .mockResolvedValueOnce(5) // on leave today
        .mockResolvedValueOnce(8); // pending leave

      (prismaMock.travelRequest.count as jest.Mock).mockResolvedValue(3);
      (prismaMock.reimburseRequest.count as jest.Mock).mockResolvedValue(4);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(2); // pending registrations

      (prismaMock.payslip.count as jest.Mock)
        .mockResolvedValueOnce(15) // draft
        .mockResolvedValueOnce(85); // published this month

      const result = await DashboardService.getAdminStats(hrdContext);

      expect(result.success).toBe(true);
      expect(result.data?.employees.total).toBe(100);
      expect(result.data?.employees.active).toBe(90);
      expect(result.data?.employees.terminated).toBe(10);
      expect(result.data?.employees.onLeave).toBe(5);
      expect(result.data?.attendance.presentToday).toBe(70);
      expect(result.data?.attendance.lateToday).toBe(10);
      expect(result.data?.attendance.attendanceRate).toBe(89); // 80/90 * 100
      expect(result.data?.approvals.pendingLeave).toBe(8);
      expect(result.data?.approvals.pendingTravel).toBe(3);
      expect(result.data?.approvals.pendingReimburse).toBe(4);
      expect(result.data?.approvals.pendingRegistrations).toBe(2);
      expect(result.data?.payroll.pendingPayslips).toBe(15);
      expect(result.data?.payroll.publishedThisMonth).toBe(85);
    });

    it("should handle zero active employees", async () => {
      (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.attendance.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.travelRequest.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.reimburseRequest.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.payslip.count as jest.Mock).mockResolvedValue(0);

      const result = await DashboardService.getAdminStats(hrdContext);

      expect(result.success).toBe(true);
      expect(result.data?.attendance.attendanceRate).toBe(0);
    });

    it("should calculate absent correctly", async () => {
      (prismaMock.employee.count as jest.Mock)
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(40) // active
        .mockResolvedValueOnce(10); // terminated

      (prismaMock.attendance.count as jest.Mock)
        .mockResolvedValueOnce(25) // present
        .mockResolvedValueOnce(5) // late
        .mockResolvedValueOnce(30); // total attendance

      (prismaMock.leaveRequest.count as jest.Mock)
        .mockResolvedValueOnce(5) // on leave today
        .mockResolvedValueOnce(0);

      (prismaMock.travelRequest.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.reimburseRequest.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(0);
      (prismaMock.payslip.count as jest.Mock).mockResolvedValue(0);

      const result = await DashboardService.getAdminStats(hrdContext);

      expect(result.success).toBe(true);
      // absent = active - attendance - onLeave = 40 - 30 - 5 = 5
      expect(result.data?.attendance.absentToday).toBe(5);
    });
  });
});
