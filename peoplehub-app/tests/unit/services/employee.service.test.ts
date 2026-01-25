/**
 * @jest-environment node
 */
// @ai:cl - EmployeeService unit tests (refactored to use shared mocks)
import { prismaMock, resetPrismaMock } from "../../mocks/prisma";
import { resetCacheMock } from "../../mocks/cache";
import { EmployeeService } from "@/services/employee";
import type { RequestContext } from "@/lib/tenant";

describe("EmployeeService", () => {
  // Test context
  const mockContext: RequestContext = {
    tenantId: "tenant-123",
    userId: "user-123",
    employeeId: "emp-123",
    role: "HRD",
  };

  const mockEmployee = {
    id: "emp-123",
    tenantId: "tenant-123",
    userId: "user-123",
    employeeNumber: "EMP001",
    fullName: "John Doe",
    departmentId: "dept-123",
    branchId: "branch-123",
    positionId: "pos-123",
    managerId: null,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      email: "john@example.com",
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
    department: { id: "dept-123", name: "Engineering" },
    position: { id: "pos-123", name: "Developer" },
    branch: { id: "branch-123", name: "HQ", code: "HQ" },
  };

  beforeEach(() => {
    resetPrismaMock();
    resetCacheMock();
  });

  describe("getEmployeeById", () => {
    it("should return employee when found and user has access", async () => {
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

      const result = await EmployeeService.getEmployeeById(mockContext, "emp-123");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmployee);
    });

    it("should return NOT_FOUND when employee does not exist", async () => {
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await EmployeeService.getEmployeeById(mockContext, "nonexistent");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("should return FORBIDDEN for unauthorized access", async () => {
      const employeeContext: RequestContext = {
        ...mockContext,
        role: "EMPLOYEE",
        employeeId: "other-emp",
      };

      const otherEmployee = {
        ...mockEmployee,
        id: "another-emp",
        managerId: "someone-else",
      };
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(otherEmployee);

      const result = await EmployeeService.getEmployeeById(employeeContext, "another-emp");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("getMyProfile", () => {
    it("should return current user employee profile", async () => {
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

      const result = await EmployeeService.getMyProfile(mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmployee);
    });

    it("should return NOT_FOUND if employee profile not found", async () => {
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await EmployeeService.getMyProfile(mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });
  });

  describe("getEmployees", () => {
    it("should return paginated list of employees for HRD", async () => {
      const employees = [mockEmployee];
      (prismaMock.employee.findMany as jest.Mock).mockResolvedValue(employees);
      (prismaMock.employee.count as jest.Mock).mockResolvedValue(1);

      const result = await EmployeeService.getEmployees(mockContext, {
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(employees);
    });

    it("should filter by status when provided", async () => {
      (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);

      await EmployeeService.getEmployees(mockContext, {
        page: 1,
        limit: 10,
        status: "ACTIVE",
      });

      expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "ACTIVE",
          }),
        })
      );
    });

    it("should filter by department when provided", async () => {
      (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);

      await EmployeeService.getEmployees(mockContext, {
        page: 1,
        limit: 10,
        departmentId: "dept-123",
      });

      expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            departmentId: "dept-123",
          }),
        })
      );
    });
  });

  describe("updateEmployee", () => {
    it("should update employee", async () => {
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
      (prismaMock.employee.update as jest.Mock).mockResolvedValue({
        ...mockEmployee,
        fullName: "John Updated",
      });

      const result = await EmployeeService.updateEmployee(mockContext, "emp-123", {
        fullName: "John Updated",
      });

      expect(result.success).toBe(true);
      expect(result.data?.fullName).toBe("John Updated");
    });

    it("should return FORBIDDEN for non-HRD users", async () => {
      const employeeContext: RequestContext = {
        ...mockContext,
        role: "EMPLOYEE",
      };

      const result = await EmployeeService.updateEmployee(employeeContext, "emp-123", {
        fullName: "John Updated",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("terminateEmployee", () => {
    it("should terminate employee and update user status", async () => {
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
      (prismaMock.employee.update as jest.Mock).mockResolvedValue({
        ...mockEmployee,
        status: "TERMINATED",
        endDate: new Date(),
      });
      (prismaMock.user.update as jest.Mock).mockResolvedValue({
        id: "user-123",
        status: "SUSPENDED",
      });

      const result = await EmployeeService.terminateEmployee(
        mockContext,
        "emp-123",
        new Date()
      );

      expect(result.success).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "SUSPENDED" },
        })
      );
    });

    it("should return FORBIDDEN for non-HRD users", async () => {
      const employeeContext: RequestContext = {
        ...mockContext,
        role: "EMPLOYEE",
      };

      const result = await EmployeeService.terminateEmployee(
        employeeContext,
        "emp-123",
        new Date()
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("getSubordinates", () => {
    it("should return subordinates for a manager", async () => {
      const subordinates = [
        { ...mockEmployee, id: "sub-1", managerId: "emp-123" },
        { ...mockEmployee, id: "sub-2", managerId: "emp-123" },
      ];
      (prismaMock.employee.findMany as jest.Mock).mockResolvedValue(subordinates);

      const result = await EmployeeService.getSubordinates(mockContext, "emp-123");

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should return empty array when no subordinates", async () => {
      (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);

      const result = await EmployeeService.getSubordinates(mockContext, "emp-123");

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe("searchEmployees", () => {
    it("should search employees by name", async () => {
      (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);

      const result = await EmployeeService.searchEmployees(mockContext, "John");

      expect(result.success).toBe(true);
      expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                fullName: expect.objectContaining({ contains: "John" }),
              }),
            ]),
          }),
        })
      );
    });
  });
});
