/**
 * @jest-environment node
 */
// @ai:qa - LeaveService unit tests for comprehensive leave management testing
import { prismaMock, resetPrismaMock } from "../../mocks/prisma";
import { LeaveService } from "@/services/leave";
import type { RequestContext } from "@/lib/tenant";

describe("LeaveService", () => {
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
    const mockLeaveType = {
        id: "type-annual",
        code: "ANNUAL",
        name: "Cuti Tahunan",
        isPaid: true,
        maxDays: 12,
    };

    const mockLeaveBalance = {
        id: "balance-123",
        tenantId: "tenant-123",
        employeeId: "emp-123",
        leaveTypeId: "type-annual",
        year: 2026,
        totalBalance: 12,
        usedBalance: 0,
        remainingBalance: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
        leaveType: mockLeaveType,
    };

    const mockLeaveRequest = {
        id: "request-123",
        tenantId: "tenant-123",
        employeeId: "emp-123",
        leaveTypeId: "type-annual",
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-02-03"),
        totalDays: 3,
        reason: "Liburan keluarga",
        status: "PENDING",
        attachmentUrl: null,
        delegateToId: null,
        approvedByManagerId: null,
        managerApprovedAt: null,
        approvedByHrdId: null,
        hrdApprovedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockEmployee = {
        id: "emp-123",
        tenantId: "tenant-123",
        fullName: "John Doe",
        employeeNumber: "EMP001",
        managerId: "emp-456",
    };

    beforeEach(() => {
        resetPrismaMock();
        // Setup default mocks
        (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue(mockLeaveBalance);
        (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null); // No overlapping
        (prismaMock.leaveRequest.create as jest.Mock).mockResolvedValue(mockLeaveRequest);
        (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([mockLeaveRequest]);
        (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(1);
        (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue(mockLeaveRequest);
        (prismaMock.leaveBalance.findMany as jest.Mock).mockResolvedValue([mockLeaveBalance]);
        (prismaMock.leaveBalance.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
        (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);
    });

    describe("createRequest", () => {
        it("should create leave request with valid data", async () => {
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue(mockLeaveBalance);
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null); // No overlap
            (prismaMock.leaveRequest.create as jest.Mock).mockResolvedValue(mockLeaveRequest);

            const result = await LeaveService.createRequest(employeeContext, {
                leaveTypeId: "type-annual",
                startDate: "2026-02-01",
                endDate: "2026-02-03",
                reason: "Liburan keluarga",
            });

            expect(result.success).toBe(true);
            expect(result.data?.status).toBe("PENDING");
            expect(prismaMock.leaveRequest.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        tenantId: "tenant-123",
                        employeeId: "emp-123",
                        status: "PENDING",
                    }),
                })
            );
        });

        it("should reject if insufficient balance", async () => {
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValueOnce({
                ...mockLeaveBalance,
                remainingBalance: 1, // Not enough for multiple days
            });

            const result = await LeaveService.createRequest(employeeContext, {
                leaveTypeId: "type-annual",
                startDate: "2026-02-02", // Monday
                endDate: "2026-02-06", // Friday (5 work days)
                reason: "Liburan keluarga",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("INSUFFICIENT_BALANCE");
        });

        it("should reject if no balance record exists", async () => {
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await LeaveService.createRequest(employeeContext, {
                leaveTypeId: "type-annual",
                startDate: "2026-02-01",
                endDate: "2026-02-03",
                reason: "Liburan keluarga",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("INSUFFICIENT_BALANCE");
        });

        it("should reject if overlapping request exists", async () => {
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue(mockLeaveBalance);
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(mockLeaveRequest); // Overlap exists

            const result = await LeaveService.createRequest(employeeContext, {
                leaveTypeId: "type-annual",
                startDate: "2026-02-01",
                endDate: "2026-02-03",
                reason: "Liburan keluarga",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CONFLICT");
        });

        it("should create request with optional attachment and delegate", async () => {
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue(mockLeaveBalance);
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaMock.leaveRequest.create as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                attachmentUrl: "https://example.com/doc.pdf",
                delegateToId: "emp-789",
            });

            const result = await LeaveService.createRequest(employeeContext, {
                leaveTypeId: "type-annual",
                startDate: "2026-02-01",
                endDate: "2026-02-03",
                reason: "Cuti sakit",
                attachmentUrl: "https://example.com/doc.pdf",
                delegateToId: "emp-789",
            });

            expect(result.success).toBe(true);
            expect(prismaMock.leaveRequest.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        attachmentUrl: "https://example.com/doc.pdf",
                        delegateToId: "emp-789",
                    }),
                })
            );
        });
    });

    describe("getRequests", () => {
        it("should return own requests for EMPLOYEE", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([mockLeaveRequest]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(1);

            const result = await LeaveService.getRequests(employeeContext, {});

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: "tenant-123",
                        employeeId: "emp-123",
                    }),
                })
            );
        });

        it("should return all requests for HRD", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([mockLeaveRequest]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(1);

            const result = await LeaveService.getRequests(hrdContext, {});

            expect(result.success).toBe(true);
            expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: "tenant-123",
                    }),
                })
            );
        });

        it("should return team requests for MANAGER", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([
                { id: "emp-sub-1" },
                { id: "emp-sub-2" },
            ]);
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([mockLeaveRequest]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(1);

            const result = await LeaveService.getRequests(managerContext, {});

            expect(result.success).toBe(true);
            expect(prismaMock.employee.findMany).toHaveBeenCalled();
        });

        it("should filter by status", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([mockLeaveRequest]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(1);

            await LeaveService.getRequests(hrdContext, { status: "PENDING" });

            expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: "PENDING",
                    }),
                })
            );
        });

        it("should filter by leave type", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([mockLeaveRequest]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(1);

            await LeaveService.getRequests(hrdContext, { leaveTypeId: "type-annual" });

            expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        leaveTypeId: "type-annual",
                    }),
                })
            );
        });
    });

    describe("getBalances", () => {
        it("should return own balances for EMPLOYEE", async () => {
            (prismaMock.leaveBalance.findMany as jest.Mock).mockResolvedValue([mockLeaveBalance]);

            const result = await LeaveService.getBalances(employeeContext);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].remainingBalance).toBe(12);
        });

        it("should return other employee balances for HRD", async () => {
            (prismaMock.leaveBalance.findMany as jest.Mock).mockResolvedValue([mockLeaveBalance]);

            const result = await LeaveService.getBalances(hrdContext, "emp-123", 2026);

            expect(result.success).toBe(true);
        });

        it("should deny access to other employee balances for EMPLOYEE", async () => {
            const result = await LeaveService.getBalances(employeeContext, "other-emp", 2026);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should use current year if not specified", async () => {
            (prismaMock.leaveBalance.findMany as jest.Mock).mockResolvedValue([mockLeaveBalance]);

            await LeaveService.getBalances(employeeContext);

            expect(prismaMock.leaveBalance.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        year: new Date().getFullYear(),
                    }),
                })
            );
        });
    });

    describe("approveByManager", () => {
        it("should approve pending request as manager", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                employee: { ...mockEmployee, managerId: "emp-456" },
            });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "APPROVED_MANAGER",
            });

            const result = await LeaveService.approveByManager(managerContext, "request-123");

            expect(result.success).toBe(true);
            expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: "APPROVED_MANAGER",
                        approvedByManagerId: "emp-456",
                    }),
                })
            );
        });

        it("should reject if not the manager of the employee", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                employee: { ...mockEmployee, managerId: "other-manager" },
            });

            const result = await LeaveService.approveByManager(managerContext, "request-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should reject if request not found", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await LeaveService.approveByManager(managerContext, "nonexistent");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should reject if already processed", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "APPROVED",
                employee: { ...mockEmployee, managerId: "emp-456" },
            });

            const result = await LeaveService.approveByManager(managerContext, "request-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });
    });

    describe("approveByHrd", () => {
        it("should approve and deduct balance for HRD", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "APPROVED_MANAGER",
            });
            (prismaMock.leaveBalance.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "APPROVED",
            });

            const result = await LeaveService.approveByHrd(hrdContext, "request-123");

            expect(result.success).toBe(true);
            expect(prismaMock.leaveBalance.updateMany).toHaveBeenCalled();
            expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: "APPROVED",
                        approvedByHrdId: "emp-789",
                    }),
                })
            );
        });

        it("should approve PENDING request directly (override mode)", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "PENDING",
            });
            (prismaMock.leaveBalance.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "APPROVED",
            });

            const result = await LeaveService.approveByHrd(hrdContext, "request-123");

            expect(result.success).toBe(true);
        });

        it("should deny approval for non-HRD", async () => {
            const result = await LeaveService.approveByHrd(employeeContext, "request-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should reject if request not found", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await LeaveService.approveByHrd(hrdContext, "nonexistent");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should reject if already processed", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "REJECTED",
            });

            const result = await LeaveService.approveByHrd(hrdContext, "request-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });
    });

    describe("reject", () => {
        it("should reject request as HRD", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "PENDING",
                employee: mockEmployee,
            });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "REJECTED",
                rejectionReason: "Deadline project",
            });

            const result = await LeaveService.reject(hrdContext, "request-123", "Deadline project");

            expect(result.success).toBe(true);
            expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: "REJECTED",
                        rejectionReason: "Deadline project",
                    }),
                })
            );
        });

        it("should reject request as manager of the employee", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "PENDING",
                employee: { ...mockEmployee, managerId: "emp-456" },
            });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "REJECTED",
            });

            const result = await LeaveService.reject(managerContext, "request-123", "Team shortage");

            expect(result.success).toBe(true);
        });

        it("should deny rejection for EMPLOYEE", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                employee: mockEmployee,
            });

            const result = await LeaveService.reject(employeeContext, "request-123", "Some reason");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should reject if request not found", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await LeaveService.reject(hrdContext, "nonexistent", "Some reason");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should reject if already processed", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "APPROVED",
                employee: mockEmployee,
            });

            const result = await LeaveService.reject(hrdContext, "request-123", "Some reason");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });
    });

    describe("cancel", () => {
        it("should cancel pending request by employee", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "PENDING",
            });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "CANCELLED",
            });

            const result = await LeaveService.cancel(employeeContext, "request-123");

            expect(result.success).toBe(true);
            expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: "CANCELLED",
                    }),
                })
            );
        });

        it("should cancel APPROVED_MANAGER request", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "APPROVED_MANAGER",
            });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "CANCELLED",
            });

            const result = await LeaveService.cancel(employeeContext, "request-123");

            expect(result.success).toBe(true);
        });

        it("should reject if request not found or not owned", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await LeaveService.cancel(employeeContext, "request-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should reject if already approved by HRD", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "APPROVED",
            });

            const result = await LeaveService.cancel(employeeContext, "request-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });

        it("should reject if already rejected", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "REJECTED",
            });

            const result = await LeaveService.cancel(employeeContext, "request-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });
    });
});
