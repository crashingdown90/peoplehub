/**
 * @jest-environment node
 */
// @ai:cl - Multi-level approval flow tests (QA-011)
// Tests the complete multi-level approval workflow for leave requests
import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { LeaveService } from "@/services/leave";
import type { RequestContext } from "@/lib/tenant";
import type { LeaveRequest, Employee, ApprovalStatus } from "@prisma/client";

describe("LeaveService - Multi-level Approval Flow (QA-011)", () => {
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
    };

    const pendingRequest: LeaveRequest = {
        id: "lr-pending",
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

    describe("Manager Approval - Level 1", () => {
        it("should allow manager to approve subordinate's leave request", async () => {
            const requestWithEmployee = { ...pendingRequest, employee: mockEmployee };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(requestWithEmployee);
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...pendingRequest,
                status: "APPROVED_MANAGER",
                approvedByManagerId: "emp-mgr",
                managerApprovedAt: new Date(),
            });

            const result = await LeaveService.approveByManager(managerContext, "lr-pending");

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty("status", "APPROVED_MANAGER");
            expect(result.data).toHaveProperty("approvedByManagerId", "emp-mgr");
            expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: "APPROVED_MANAGER",
                    }),
                })
            );
        });

        it("should deny manager from approving non-subordinate's request", async () => {
            const otherEmployee = { ...mockEmployee, managerId: "emp-other-mgr" };
            const requestWithEmployee = { ...pendingRequest, employee: otherEmployee };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(requestWithEmployee);

            const result = await LeaveService.approveByManager(managerContext, "lr-pending");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should deny employee from using manager approval endpoint", async () => {
            const requestWithEmployee = { ...pendingRequest, employee: mockEmployee };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(requestWithEmployee);

            const result = await LeaveService.approveByManager(employeeContext, "lr-pending");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should prevent approving already processed request", async () => {
            const approvedRequest = {
                ...pendingRequest,
                status: "APPROVED" as ApprovalStatus,
                employee: mockEmployee,
            };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(approvedRequest);

            const result = await LeaveService.approveByManager(managerContext, "lr-pending");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });
    });

    describe("HRD Approval - Level 2", () => {
        it("should allow HRD to approve pending request", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(pendingRequest);
            (prismaMock.leaveBalance.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...pendingRequest,
                status: "APPROVED",
                approvedByHrdId: "emp-hrd",
                hrdApprovedAt: new Date(),
            });

            const result = await LeaveService.approveByHrd(hrdContext, "lr-pending");

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty("status", "APPROVED");
            expect(prismaMock.leaveBalance.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        usedBalance: { increment: 3 },
                        remainingBalance: { decrement: 3 },
                    }),
                })
            );
        });

        it("should allow HRD to approve manager-approved request", async () => {
            const managerApprovedRequest = {
                ...pendingRequest,
                status: "APPROVED_MANAGER" as ApprovalStatus,
                approvedByManagerId: "emp-mgr",
            };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(managerApprovedRequest);
            (prismaMock.leaveBalance.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...managerApprovedRequest,
                status: "APPROVED",
                approvedByHrdId: "emp-hrd",
                hrdApprovedAt: new Date(),
            });

            const result = await LeaveService.approveByHrd(hrdContext, "lr-pending");

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty("status", "APPROVED");
        });

        it("should deduct leave balance on HRD approval", async () => {
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(pendingRequest);
            (prismaMock.leaveBalance.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...pendingRequest,
                status: "APPROVED",
            });

            await LeaveService.approveByHrd(hrdContext, "lr-pending");

            expect(prismaMock.leaveBalance.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        employeeId: "emp-123",
                        leaveTypeId: "lt-annual",
                    }),
                    data: expect.objectContaining({
                        usedBalance: { increment: 3 },
                        remainingBalance: { decrement: 3 },
                    }),
                })
            );
        });

        it("should deny non-HRD from using HRD approval endpoint", async () => {
            const result = await LeaveService.approveByHrd(employeeContext, "lr-pending");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should deny manager from using HRD approval endpoint", async () => {
            const result = await LeaveService.approveByHrd(managerContext, "lr-pending");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });
    });

    describe("Rejection Flow", () => {
        it("should allow manager to reject subordinate's request", async () => {
            const requestWithEmployee = { ...pendingRequest, employee: mockEmployee };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(requestWithEmployee);
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...pendingRequest,
                status: "REJECTED",
                rejectionReason: "Insufficient coverage",
            });

            const result = await LeaveService.reject(
                managerContext,
                "lr-pending",
                "Insufficient coverage"
            );

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty("status", "REJECTED");
            expect(result.data).toHaveProperty("rejectionReason");
        });

        it("should allow HRD to reject any request", async () => {
            const requestWithEmployee = { ...pendingRequest, employee: mockEmployee };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(requestWithEmployee);
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...pendingRequest,
                status: "REJECTED",
                rejectionReason: "Invalid reason",
            });

            const result = await LeaveService.reject(hrdContext, "lr-pending", "Invalid reason");

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty("status", "REJECTED");
        });

        it("should deny employee from rejecting their own request", async () => {
            const requestWithEmployee = { ...pendingRequest, employee: mockEmployee };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(requestWithEmployee);

            const result = await LeaveService.reject(employeeContext, "lr-pending", "Changed my mind");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should prevent rejecting already approved request", async () => {
            const approvedRequest = {
                ...pendingRequest,
                status: "APPROVED" as ApprovalStatus,
                employee: mockEmployee,
            };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(approvedRequest);

            const result = await LeaveService.reject(hrdContext, "lr-pending", "Too late");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CANNOT_MODIFY");
        });
    });

    describe("Complete Multi-level Flow Simulation", () => {
        it("should follow complete approval chain: PENDING → APPROVED_MANAGER → APPROVED", async () => {
            // Step 1: Manager approves
            const requestWithEmployee = { ...pendingRequest, employee: mockEmployee };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(requestWithEmployee);
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...pendingRequest,
                status: "APPROVED_MANAGER",
                approvedByManagerId: "emp-mgr",
            });

            const managerApproval = await LeaveService.approveByManager(managerContext, "lr-pending");
            expect(managerApproval.success).toBe(true);
            expect(managerApproval.data?.status).toBe("APPROVED_MANAGER");

            // Step 2: HRD approves
            const managerApprovedRequest = {
                ...pendingRequest,
                status: "APPROVED_MANAGER" as ApprovalStatus,
            };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(managerApprovedRequest);
            (prismaMock.leaveBalance.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...pendingRequest,
                status: "APPROVED",
                approvedByHrdId: "emp-hrd",
            });

            const hrdApproval = await LeaveService.approveByHrd(hrdContext, "lr-pending");
            expect(hrdApproval.success).toBe(true);
            expect(hrdApproval.data?.status).toBe("APPROVED");
        });

        it("should allow HRD to skip manager level and approve directly", async () => {
            // HRD can approve PENDING request directly
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(pendingRequest);
            (prismaMock.leaveBalance.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...pendingRequest,
                status: "APPROVED",
                approvedByHrdId: "emp-hrd",
            });

            const result = await LeaveService.approveByHrd(hrdContext, "lr-pending");

            expect(result.success).toBe(true);
            expect(result.data?.status).toBe("APPROVED");
        });
    });
});
