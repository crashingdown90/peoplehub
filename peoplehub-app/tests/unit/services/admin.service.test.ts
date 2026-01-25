/**
 * @jest-environment node
 */
// @ai:cl - AdminService unit tests - Refactored to use centralized mocks
import { prismaMock, resetPrismaMock } from "../../mocks/prisma";
import { AdminService } from "@/services/admin";
import type { RequestContext } from "@/lib/tenant";

describe("AdminService", () => {
  // Test contexts
  const employeeContext: RequestContext = {
    tenantId: "tenant-123",
    userId: "user-123",
    employeeId: "emp-123",
    role: "EMPLOYEE",
  };

  const hrdContext: RequestContext = {
    tenantId: "tenant-123",
    userId: "user-789",
    employeeId: "emp-789",
    role: "HRD",
  };

  const itOpsContext: RequestContext = {
    tenantId: "tenant-123",
    userId: "user-it",
    employeeId: "emp-it",
    role: "IT_OPS",
  };

  const superAdminContext: RequestContext = {
    tenantId: "tenant-123",
    userId: "user-admin",
    employeeId: "emp-admin",
    role: "SUPER_ADMIN",
  };

  // Mock data
  const mockUser = {
    id: "user-123",
    tenantId: "tenant-123",
    email: "john@example.com",
    phone: "+628123456789",
    passwordHash: "hashed",
    status: "APPROVED",
    role: "EMPLOYEE",
    emailVerifiedAt: new Date(),
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    employee: {
      id: "emp-123",
      fullName: "John Doe",
      employeeNumber: "EMP001",
      departmentId: "dept-1",
      branchId: "branch-1",
    },
  };

  const mockPendingUser = {
    ...mockUser,
    id: "user-pending",
    status: "PENDING",
    employee: null,
  };

  const mockAuditLog = {
    id: "log-123",
    tenantId: "tenant-123",
    actorId: "user-admin",
    action: "UPDATE_USER",
    objectType: "User",
    objectId: "user-123",
    beforeData: { status: "PENDING" },
    afterData: { status: "APPROVED" },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0",
    createdAt: new Date(),
  };

  beforeEach(() => {
    resetPrismaMock();
    (prismaMock.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
    (prismaMock.user.count as jest.Mock).mockResolvedValue(1);
    (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prismaMock.user.update as jest.Mock).mockResolvedValue(mockUser);
    (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
    (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(1);
    (prismaMock.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);
  });

  describe("getUsers", () => {
    it("should return users for IT_OPS", async () => {
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(1);

      const result = await AdminService.getUsers(itOpsContext, {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      // Password hash should be removed
      expect((result.data as unknown[])[0]).not.toHaveProperty("passwordHash");
    });

    it("should return users for SUPER_ADMIN", async () => {
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(1);

      const result = await AdminService.getUsers(superAdminContext, {});

      expect(result.success).toBe(true);
    });

    it("should deny access for EMPLOYEE", async () => {
      const result = await AdminService.getUsers(employeeContext, {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("should deny access for HRD", async () => {
      const result = await AdminService.getUsers(hrdContext, {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("should filter by status", async () => {
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([mockPendingUser]);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(1);

      await AdminService.getUsers(itOpsContext, { status: "PENDING" });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
          }),
        })
      );
    });

    it("should filter by role", async () => {
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(1);

      await AdminService.getUsers(itOpsContext, { role: "EMPLOYEE" });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: "EMPLOYEE",
          }),
        })
      );
    });
  });

  describe("getUserById", () => {
    it("should return user for IT_OPS", async () => {
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await AdminService.getUserById(itOpsContext, "user-123");

      expect(result.success).toBe(true);
      expect(result.data).not.toHaveProperty("passwordHash");
    });

    it("should return NOT_FOUND when user not found", async () => {
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await AdminService.getUserById(itOpsContext, "nonexistent");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("should deny access for EMPLOYEE", async () => {
      const result = await AdminService.getUserById(employeeContext, "user-123");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("updateUser", () => {
    it("should update user for IT_OPS", async () => {
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prismaMock.user.update as jest.Mock).mockResolvedValue({ ...mockUser, status: "SUSPENDED" });
      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AdminService.updateUser(itOpsContext, "user-123", {
        status: "SUSPENDED",
      });

      expect(result.success).toBe(true);
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it("should prevent IT_OPS from modifying SUPER_ADMIN", async () => {
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue({ ...mockUser, role: "SUPER_ADMIN" });

      const result = await AdminService.updateUser(itOpsContext, "user-admin", {
        status: "SUSPENDED",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("should allow SUPER_ADMIN to modify SUPER_ADMIN", async () => {
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue({ ...mockUser, role: "SUPER_ADMIN" });
      (prismaMock.user.update as jest.Mock).mockResolvedValue({ ...mockUser, role: "SUPER_ADMIN" });
      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AdminService.updateUser(superAdminContext, "user-admin", {
        status: "SUSPENDED",
      });

      expect(result.success).toBe(true);
    });

    it("should return NOT_FOUND when user not found", async () => {
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await AdminService.updateUser(itOpsContext, "nonexistent", {
        status: "SUSPENDED",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });
  });

  describe("getRegistrations", () => {
    it("should return pending registrations for HRD", async () => {
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([mockPendingUser]);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(1);

      const result = await AdminService.getRegistrations(hrdContext, {});

      expect(result.success).toBe(true);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
          }),
        })
      );
    });

    it("should return registrations for IT_OPS", async () => {
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([mockPendingUser]);
      (prismaMock.user.count as jest.Mock).mockResolvedValue(1);

      const result = await AdminService.getRegistrations(itOpsContext, {});

      expect(result.success).toBe(true);
    });

    it("should deny access for EMPLOYEE", async () => {
      const result = await AdminService.getRegistrations(employeeContext, {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("approveRegistration", () => {
    it("should approve registration for HRD", async () => {
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(mockPendingUser);
      (prismaMock.user.update as jest.Mock).mockResolvedValue({ ...mockPendingUser, status: "APPROVED" });
      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AdminService.approveRegistration(hrdContext, "user-pending");

      expect(result.success).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "APPROVED",
          }),
        })
      );
    });

    it("should return NOT_FOUND when registration not found or already processed", async () => {
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await AdminService.approveRegistration(hrdContext, "user-123");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("should deny access for EMPLOYEE", async () => {
      const result = await AdminService.approveRegistration(employeeContext, "user-pending");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("rejectRegistration", () => {
    it("should reject registration for HRD", async () => {
      (prismaMock.user.findFirst as jest.Mock).mockResolvedValue(mockPendingUser);
      (prismaMock.user.update as jest.Mock).mockResolvedValue({ ...mockPendingUser, status: "REJECTED" });
      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AdminService.rejectRegistration(hrdContext, "user-pending", "Invalid documents");

      expect(result.success).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "REJECTED",
          }),
        })
      );
    });

    it("should deny access for EMPLOYEE", async () => {
      const result = await AdminService.rejectRegistration(employeeContext, "user-pending");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("getAuditLogs", () => {
    it("should return audit logs for IT_OPS", async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([
        { id: "user-admin", email: "admin@example.com", employee: { fullName: "Admin" } },
      ]);

      const result = await AdminService.getAuditLogs(itOpsContext, {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should return audit logs for SUPER_ADMIN", async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await AdminService.getAuditLogs(superAdminContext, {});

      expect(result.success).toBe(true);
    });

    it("should deny access for EMPLOYEE", async () => {
      const result = await AdminService.getAuditLogs(employeeContext, {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("should deny access for HRD", async () => {
      const result = await AdminService.getAuditLogs(hrdContext, {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("should filter by action", async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([]);

      await AdminService.getAuditLogs(itOpsContext, { action: "UPDATE_USER" });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: "UPDATE_USER",
          }),
        })
      );
    });

    it("should filter by date range", async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([]);

      await AdminService.getAuditLogs(itOpsContext, {
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });
});
