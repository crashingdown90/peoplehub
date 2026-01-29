/**
 * @jest-environment node
 */
// @ai:cl - Leave request flow tests (QA-010)
// Tests the complete leave request lifecycle
import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { LeaveService } from "@/services/leave";
import type { RequestContext } from "@/lib/tenant";
import type { LeaveRequest, LeaveBalance, LeaveType, Employee, ApprovalStatus } from "@prisma/client";

describe("LeaveService - Leave Request Flow (QA-010)", () => {
    // Test contexts
    const employeeContext: RequestContext = {
        tenantId: "tenant-123",
        userId: "user-emp",
        employeeId: "emp-123",
        role: "EMPLOYEE",
    };

    const managerContext: RequestContext = {
        tenantId: "tenant-123",
        userId: "user-mgr",
        employeeId: "emp-mgr",
        role: "MANAGER",
    };

    const hrdContext: RequestContext = {
        tenantId: "tenant-123",
        userId: "user-hrd",
        employeeId: "emp-hrd",
        role: "HRD",
    };

    // Mock data
    const mockLeaveType: LeaveType = {
        id: "lt-annual",
        tenantId: "tenant-123",
        code: "ANNUAL",
        name: "Cuti Tahunan",
        defaultBalance: 12,
        isPaid: true,
        requiresAttachment: false,
        createdAt: new Date(),
        isActive: true,
    };

    const mockBalance: LeaveBalance = {
        id: "bal-123",
        tenantId: "tenant-123",
        employeeId: "emp-123",
        leaveTypeId: "lt-annual",
        year: 2026,
        initialBalance: 12,
        usedBalance: 3,
        remainingBalance: 9,
        expiryDate: new Date("2026-12-31"),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockEmployee: Employee = {
        id: "emp-123",
        tenantId: "tenant-123",
        userId: "user-emp",
        employeeNumber: "EMP001",
        fullName: "John Doe",
        phone: "+628123456789",
        address: null,
        nik: null,
        startDate: new Date("2024-01-01"),
        endDate: null,
        employmentType: "PERMANENT",
        workMode: "WFO",
        status: "ACTIVE",
        branchId: "branch-1",
        departmentId: "dept-1",
        positionId: "pos-1",
        managerId: "emp-mgr",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        employeeCode: "EMP001",
        npwp: null,
        bpjsKesehatan: null,
        bpjsKetenagakerjaan: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        bankName: null,
        bankAccountNumber: null,
        bankAccountHolder: null,
        bankBranch: null,
        defaultShiftId: null,
        shiftId: null,
    };

    const mockLeaveRequest: LeaveRequest = {
        id: "lr-123",
        tenantId: "tenant-123",
        employeeId: "emp-123",
        leaveTypeId: "lt-annual",
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-02-03"),
        totalDays: 3,
        reason: "Family vacation",
        attachmentUrl: null,
        delegateToId: null,
        status: "PENDING" as ApprovalStatus,
        approvedByManagerId: null,
        managerApprovedAt: null,
        approvedByHrdId: null,
        hrdApprovedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(() => {
        resetPrismaMock();
    });

    describe("Create Leave Request", () => {
        it("should create leave request with sufficient balance", async () => {
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue(mockBalance);
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null); // No overlapping
            (prismaMock.leaveRequest.create as jest.Mock).mockResolvedValue(mockLeaveRequest);

            const result = await LeaveService.createRequest(employeeContext, {
                leaveTypeId: "lt-annual",
                startDate: "2026-02-01",
                endDate: "2026-02-03",
                reason: "Family vacation",
            });

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty("status", "PENDING");
            expect(prismaMock.leaveRequest.create).toHaveBeenCalled();
        });

        it("should reject request with insufficient balance", async () => {
            const lowBalance = { ...mockBalance, remainingBalance: 1 };
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue(lowBalance);

            const result = await LeaveService.createRequest(employeeContext, {
                leaveTypeId: "lt-annual",
                startDate: "2026-02-01",
                endDate: "2026-02-03",
                reason: "Family vacation",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("INSUFFICIENT_BALANCE");
        });

        it("should reject overlapping leave requests", async () => {
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue(mockBalance);
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(mockLeaveRequest); // Overlapping exists

            const result = await LeaveService.createRequest(employeeContext, {
                leaveTypeId: "lt-annual",
                startDate: "2026-02-02",
                endDate: "2026-02-04",
                reason: "Another vacation",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CONFLICT");
        });

        it("should reject request when no balance record exists", async () => {
            (prismaMock.leaveBalance.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await LeaveService.createRequest(employeeContext, {
                leaveTypeId: "lt-annual",
                startDate: "2026-02-01",
                endDate: "2026-02-03",
                reason: "Family vacation",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("INSUFFICIENT_BALANCE");
        });
    });

    describe("Cancel Leave Request", () => {
        it("should allow employee to cancel pending request", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(mockLeaveRequest);
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "CANCELLED",
            });

            const result = await LeaveService.cancel(employeeContext, "lr-123");

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty("status", "CANCELLED");
        });

        it("should prevent cancelling already approved request", async () => {
            const approvedRequest = { ...mockLeaveRequest, status: "APPROVED" as ApprovalStatus };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(approvedRequest);

            const result = await LeaveService.cancel(employeeContext, "lr-123");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });

        it("should return NOT_FOUND for non-existent request", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await LeaveService.cancel(employeeContext, "nonexistent");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });
    });

    describe("Get Leave Balance", () => {
        it("should return employee's own balance", async () => {
            const balanceWithType = {
                ...mockBalance,
                leaveType: { code: "ANNUAL", name: "Cuti Tahunan", isPaid: true },
            };
            (prismaMock.leaveBalance.findMany as jest.Mock).mockResolvedValue([balanceWithType]);

            const result = await LeaveService.getBalances(employeeContext);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect((result.data as LeaveBalance[])[0].remainingBalance).toBe(9);
        });

        it("should allow HRD to view any employee balance", async () => {
            const balanceWithType = {
                ...mockBalance,
                leaveType: { code: "ANNUAL", name: "Cuti Tahunan", isPaid: true },
            };
            (prismaMock.leaveBalance.findMany as jest.Mock).mockResolvedValue([balanceWithType]);

            const result = await LeaveService.getBalances(hrdContext, "emp-123");

            expect(result.success).toBe(true);
        });

        it("should deny employee from viewing other's balance", async () => {
            const result = await LeaveService.getBalances(employeeContext, "emp-other");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });
    });

    describe("Get Leave Requests", () => {
        it("should return employee's own requests", async () => {
            const requestWithDetails = {
                ...mockLeaveRequest,
                employee: { fullName: "John Doe", employeeNumber: "EMP001" },
                leaveType: { code: "ANNUAL", name: "Cuti Tahunan" },
            };
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([requestWithDetails]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(1);

            const result = await LeaveService.getRequests(employeeContext, {});

            expect(result.success).toBe(true);
            expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        employeeId: "emp-123",
                    }),
                })
            );
        });

        it("should allow HRD to view all requests", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);

            await LeaveService.getRequests(hrdContext, {});

            // HRD should not have employeeId filter unless specified
            expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.not.objectContaining({
                        employeeId: hrdContext.employeeId,
                    }),
                })
            );
        });

        it("should filter by status", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.leaveRequest.count as jest.Mock).mockResolvedValue(0);

            await LeaveService.getRequests(hrdContext, { status: "PENDING" });

            expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: "PENDING",
                    }),
                })
            );
        });
    });
});
