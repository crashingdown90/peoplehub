/**
 * @jest-environment node
 */
// @ai:cl - KpiService unit tests - Refactored to use centralized mocks
import { prismaMock, resetPrismaMock } from "../../mocks/prisma";
import { KpiService } from "@/services/kpi";
import type { RequestContext } from "@/lib/tenant";

describe("KpiService", () => {
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

  // Mock data
  const mockPeriod = {
    id: "period-123",
    tenantId: "tenant-123",
    name: "Q1 2026",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-03-31"),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockIndicator = {
    id: "ind-123",
    tenantId: "tenant-123",
    code: "SALES",
    name: "Sales Target",
    description: "Monthly sales target",
    unit: "Rp",
    targetType: "HIGHER_BETTER",
    weight: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTarget = {
    id: "target-123",
    tenantId: "tenant-123",
    employeeId: "emp-123",
    periodId: "period-123",
    indicatorId: "ind-123",
    targetValue: 100000000,
    actualValue: null,
    score: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    period: mockPeriod,
    indicator: mockIndicator,
  };

  beforeEach(() => {
    resetPrismaMock();
    // Setup default mocks
    (prismaMock.kpiPeriod.findMany as jest.Mock).mockResolvedValue([mockPeriod]);
    (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(mockPeriod);
    (prismaMock.kpiPeriod.create as jest.Mock).mockResolvedValue(mockPeriod);
    (prismaMock.kpiIndicator.findMany as jest.Mock).mockResolvedValue([mockIndicator]);
    (prismaMock.kpiIndicator.findFirst as jest.Mock).mockResolvedValue(mockIndicator);
    (prismaMock.kpiIndicator.create as jest.Mock).mockResolvedValue(mockIndicator);
    (prismaMock.kpiTarget.findMany as jest.Mock).mockResolvedValue([mockTarget]);
    (prismaMock.kpiTarget.findFirst as jest.Mock).mockResolvedValue(mockTarget);
    (prismaMock.kpiTarget.create as jest.Mock).mockResolvedValue(mockTarget);
    (prismaMock.kpiTarget.update as jest.Mock).mockResolvedValue({ ...mockTarget, actualValue: 50 });
    (prismaMock.kpiTarget.count as jest.Mock).mockResolvedValue(1);
    (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([
      { id: "emp-123", fullName: "John Doe" },
      { id: "emp-456", fullName: "Jane Doe" },
    ]);
    (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue({ id: "emp-123", fullName: "John Doe" });
  });

  describe("getPeriods", () => {
    it("should return all KPI periods for tenant", async () => {
      (prismaMock.kpiPeriod.findMany as jest.Mock).mockResolvedValue([mockPeriod]);

      const result = await KpiService.getPeriods(employeeContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockPeriod]);
      expect(prismaMock.kpiPeriod.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-123" },
        })
      );
    });
  });

  describe("getActivePeriod", () => {
    it("should return active period", async () => {
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(mockPeriod);

      const result = await KpiService.getActivePeriod(employeeContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPeriod);
      expect(prismaMock.kpiPeriod.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-123", isActive: true },
        })
      );
    });

    it("should return null when no active period", async () => {
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await KpiService.getActivePeriod(employeeContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe("createPeriod", () => {
    it("should create period for HRD", async () => {
      (prismaMock.kpiPeriod.create as jest.Mock).mockResolvedValue(mockPeriod);

      const result = await KpiService.createPeriod(hrdContext, {
        name: "Q1 2026",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-03-31"),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPeriod);
    });

    it("should deny period creation for EMPLOYEE", async () => {
      const result = await KpiService.createPeriod(employeeContext, {
        name: "Q1 2026",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-03-31"),
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("getIndicators", () => {
    it("should return active indicators", async () => {
      (prismaMock.kpiIndicator.findMany as jest.Mock).mockResolvedValue([mockIndicator]);

      const result = await KpiService.getIndicators(employeeContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockIndicator]);
      expect(prismaMock.kpiIndicator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-123", isActive: true },
        })
      );
    });
  });

  describe("createIndicator", () => {
    it("should create indicator for HRD", async () => {
      (prismaMock.kpiIndicator.create as jest.Mock).mockResolvedValue(mockIndicator);

      const result = await KpiService.createIndicator(hrdContext, {
        code: "SALES",
        name: "Sales Target",
        unit: "Rp",
        targetType: "HIGHER_BETTER",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockIndicator);
    });

    it("should deny indicator creation for EMPLOYEE", async () => {
      const result = await KpiService.createIndicator(employeeContext, {
        code: "SALES",
        name: "Sales Target",
        unit: "Rp",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("getMyTargets", () => {
    it("should return targets for current employee", async () => {
      (prismaMock.kpiTarget.findMany as jest.Mock).mockResolvedValue([mockTarget]);
      (prismaMock.kpiTarget.count as jest.Mock).mockResolvedValue(1);

      const result = await KpiService.getMyTargets(employeeContext, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockTarget]);
      expect(prismaMock.kpiTarget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: "tenant-123",
            employeeId: "emp-123",
          }),
        })
      );
    });

    it("should filter by periodId when provided", async () => {
      (prismaMock.kpiTarget.findMany as jest.Mock).mockResolvedValue([mockTarget]);
      (prismaMock.kpiTarget.count as jest.Mock).mockResolvedValue(1);

      await KpiService.getMyTargets(employeeContext, { periodId: "period-123" });

      expect(prismaMock.kpiTarget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            periodId: "period-123",
          }),
        })
      );
    });

    it("should return NOT_FOUND when no employeeId in context", async () => {
      const contextNoEmployee: RequestContext = {
        ...employeeContext,
        employeeId: undefined,
      };

      const result = await KpiService.getMyTargets(contextNoEmployee, {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });
  });

  describe("getTeamTargets", () => {
    it("should return team targets for MANAGER", async () => {
      (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([
        { id: "emp-1" },
        { id: "emp-2" },
      ]);
      (prismaMock.kpiTarget.findMany as jest.Mock).mockResolvedValue([mockTarget]);
      (prismaMock.kpiTarget.count as jest.Mock).mockResolvedValue(1);

      const result = await KpiService.getTeamTargets(managerContext, {});

      expect(result.success).toBe(true);
      expect(prismaMock.employee.findMany).toHaveBeenCalled();
    });

    it("should deny team targets for EMPLOYEE", async () => {
      const result = await KpiService.getTeamTargets(employeeContext, {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("createTarget", () => {
    it("should create target for MANAGER", async () => {
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue({ id: "emp-123", managerId: "emp-456" });
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(mockPeriod);
      (prismaMock.kpiIndicator.findFirst as jest.Mock).mockResolvedValue(mockIndicator);
      (prismaMock.kpiTarget.create as jest.Mock).mockResolvedValue(mockTarget);

      const result = await KpiService.createTarget(managerContext, {
        employeeId: "emp-123",
        periodId: "period-123",
        indicatorId: "ind-123",
        targetValue: 100000000,
      });

      expect(result.success).toBe(true);
    });

    it("should deny target creation for EMPLOYEE", async () => {
      const result = await KpiService.createTarget(employeeContext, {
        employeeId: "emp-123",
        periodId: "period-123",
        indicatorId: "ind-123",
        targetValue: 100000000,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("should return NOT_FOUND when employee not found", async () => {
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await KpiService.createTarget(hrdContext, {
        employeeId: "nonexistent",
        periodId: "period-123",
        indicatorId: "ind-123",
        targetValue: 100000000,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });
  });

  describe("updateActualValue", () => {
    it("should allow employee to update own target", async () => {
      (prismaMock.kpiTarget.findFirst as jest.Mock).mockResolvedValue({
        ...mockTarget,
        employeeId: "emp-123",
      });
      (prismaMock.kpiTarget.update as jest.Mock).mockResolvedValue({
        ...mockTarget,
        actualValue: 80000000,
        score: 80,
      });

      const result = await KpiService.updateActualValue(employeeContext, "target-123", {
        actualValue: 80000000,
      });

      expect(result.success).toBe(true);
    });

    it("should return NOT_FOUND when target not found", async () => {
      (prismaMock.kpiTarget.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await KpiService.updateActualValue(employeeContext, "nonexistent", {
        actualValue: 80000000,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("should deny update for non-owner employee", async () => {
      (prismaMock.kpiTarget.findFirst as jest.Mock).mockResolvedValue({
        ...mockTarget,
        employeeId: "other-emp",
      });
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null); // Not a subordinate

      const result = await KpiService.updateActualValue(employeeContext, "target-123", {
        actualValue: 80000000,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("getSummary", () => {
    it("should return summary for own employee", async () => {
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue({ id: "emp-123", fullName: "John Doe" });
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(mockPeriod);
      (prismaMock.kpiTarget.findMany as jest.Mock).mockResolvedValue([
        { ...mockTarget, actualValue: 80000000, score: 80, indicator: { ...mockIndicator, weight: 1 } },
      ]);

      const result = await KpiService.getSummary(employeeContext, "emp-123", "period-123");

      expect(result.success).toBe(true);
      expect(result.data?.employeeId).toBe("emp-123");
      expect(result.data?.totalTargets).toBe(1);
    });

    it("should deny summary access for unauthorized employee", async () => {
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null); // Not a subordinate

      const result = await KpiService.getSummary(employeeContext, "other-emp", "period-123");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("getMySummary", () => {
    it("should return summary for current user", async () => {
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(mockPeriod);
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue({ id: "emp-123", fullName: "John Doe" });
      (prismaMock.kpiTarget.findMany as jest.Mock).mockResolvedValue([mockTarget]);

      const result = await KpiService.getMySummary(employeeContext);

      expect(result.success).toBe(true);
    });

    it("should return NOT_FOUND when no active period", async () => {
      (prismaMock.kpiPeriod.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await KpiService.getMySummary(employeeContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("should return NOT_FOUND when no employeeId", async () => {
      const contextNoEmployee: RequestContext = {
        ...employeeContext,
        employeeId: undefined,
      };

      const result = await KpiService.getMySummary(contextNoEmployee);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });
  });
});
