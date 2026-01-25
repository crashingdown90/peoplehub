/**
 * @jest-environment node
 */
// @ai:cl - Unit tests for ApprovalService
import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { resetCacheMock } from "../mocks/cache";
import {
    adminContext,
    hrdContext,
    managerContext,
    financeContext,
    employeeContext,
    createMockContext,
} from "../mocks/context";
import { ApprovalService } from "@/services/approval/approval.service";

describe("ApprovalService", () => {
    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
    });

    describe("getPendingApprovals", () => {
        const mockLeaveRequests = [
            {
                id: "leave-1",
                employeeId: "emp-1",
                status: "PENDING",
                createdAt: new Date(),
                employee: { fullName: "John Doe", employeeNumber: "EMP001" },
                leaveType: { name: "Annual Leave" },
                startDate: new Date(),
                endDate: new Date(),
                totalDays: 3,
                reason: "Vacation",
            },
        ];

        const mockCorrections = [
            {
                id: "corr-1",
                employeeId: "emp-2",
                status: "PENDING",
                createdAt: new Date(),
                employee: { fullName: "Jane Smith", employeeNumber: "EMP002" },
                attendanceDate: new Date(),
                originalClockIn: new Date(),
                originalClockOut: new Date(),
                requestedClockIn: new Date(),
                requestedClockOut: new Date(),
                reason: "Forgot to clock out",
            },
        ];

        it("should return pending approvals for HRD", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue(mockLeaveRequests);
            (prismaMock.attendanceCorrection.findMany as jest.Mock).mockResolvedValue(mockCorrections);
            (prismaMock.travelRequest.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.reimburseRequest.findMany as jest.Mock).mockResolvedValue([]);

            const result = await ApprovalService.getPendingApprovals(hrdContext, {
                page: 1,
                limit: 20,
            });

            expect(result.success).toBe(true);
            expect(result.data?.length).toBeGreaterThanOrEqual(1);
        });

        it("should return approvals filtered by type", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue(mockLeaveRequests);

            const result = await ApprovalService.getPendingApprovals(hrdContext, {
                type: "LEAVE",
                page: 1,
                limit: 20,
            });

            expect(result.success).toBe(true);
            expect(prismaMock.attendanceCorrection.findMany).not.toHaveBeenCalled();
        });

        it("should return manager subordinates' requests only", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([
                { id: "emp-subordinate" },
            ]);
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.attendanceCorrection.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.travelRequest.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.reimburseRequest.findMany as jest.Mock).mockResolvedValue([]);

            await ApprovalService.getPendingApprovals(managerContext, { page: 1, limit: 20 });

            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        managerId: managerContext.employeeId,
                    }),
                })
            );
        });

        it("should deny access for regular employees", async () => {
            const result = await ApprovalService.getPendingApprovals(employeeContext, {
                page: 1,
                limit: 20,
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should return reimburse approvals for FINANCE role", async () => {
            (prismaMock.leaveRequest.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.attendanceCorrection.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.travelRequest.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.reimburseRequest.findMany as jest.Mock).mockResolvedValue([
                {
                    id: "reimb-1",
                    employeeId: "emp-1",
                    status: "APPROVED_MANAGER",
                    createdAt: new Date(),
                    employee: { fullName: "John Doe", employeeNumber: "EMP001" },
                    category: "Transport",
                    totalAmount: 500000,
                    description: "Taxi expense",
                },
            ]);

            const result = await ApprovalService.getPendingApprovals(financeContext, {
                page: 1,
                limit: 20,
            });

            expect(result.success).toBe(true);
            expect(prismaMock.reimburseRequest.findMany).toHaveBeenCalled();
        });
    });

    describe("approve", () => {
        describe("Leave approval", () => {
            const mockLeaveRequest = {
                id: "leave-1",
                employeeId: "emp-1",
                leaveTypeId: "type-1",
                totalDays: 3,
                status: "PENDING",
            };

            it("should approve leave for manager (first level)", async () => {
                (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(mockLeaveRequest);
                (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                    ...mockLeaveRequest,
                    status: "APPROVED_MANAGER",
                });

                const result = await ApprovalService.approve(managerContext, "LEAVE", "leave-1");

                expect(result.success).toBe(true);
                expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            status: "APPROVED_MANAGER",
                        }),
                    })
                );
            });

            it("should approve leave for HRD (final approval)", async () => {
                const pendingManagerRequest = {
                    ...mockLeaveRequest,
                    status: "APPROVED_MANAGER",
                };
                (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(pendingManagerRequest);
                (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                    ...pendingManagerRequest,
                    status: "APPROVED",
                });
                (prismaMock.leaveBalance.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

                const result = await ApprovalService.approve(hrdContext, "LEAVE", "leave-1");

                expect(result.success).toBe(true);
                expect(prismaMock.leaveBalance.updateMany).toHaveBeenCalled(); // Balance should be updated
            });

            it("should return NOT_FOUND for non-existent request", async () => {
                (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(null);

                const result = await ApprovalService.approve(hrdContext, "LEAVE", "non-existent");

                expect(result.success).toBe(false);
                expect(result.error?.code).toBe("NOT_FOUND");
            });
        });

        describe("Correction approval", () => {
            const mockCorrection = {
                id: "corr-1",
                employeeId: "emp-1",
                attendanceDate: new Date(),
                requestedClockIn: new Date(),
                requestedClockOut: new Date(),
                status: "PENDING",
            };

            it("should approve correction and update attendance", async () => {
                (prismaMock.attendanceCorrection.findFirst as jest.Mock).mockResolvedValue(mockCorrection);
                (prismaMock.attendance.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
                (prismaMock.attendanceCorrection.update as jest.Mock).mockResolvedValue({
                    ...mockCorrection,
                    status: "APPROVED",
                });

                const result = await ApprovalService.approve(hrdContext, "ATTENDANCE_CORRECTION", "corr-1");

                expect(result.success).toBe(true);
                expect(prismaMock.attendance.updateMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            isCorrected: true,
                        }),
                    })
                );
            });

            it("should reject approval for already processed correction", async () => {
                (prismaMock.attendanceCorrection.findFirst as jest.Mock).mockResolvedValue({
                    ...mockCorrection,
                    status: "APPROVED",
                });

                const result = await ApprovalService.approve(hrdContext, "ATTENDANCE_CORRECTION", "corr-1");

                expect(result.success).toBe(false);
                expect(result.error?.code).toBe("CANNOT_MODIFY");
            });
        });
    });

    describe("reject", () => {
        it("should reject leave request with reason", async () => {
            const mockLeaveRequest = {
                id: "leave-1",
                employeeId: "emp-1",
                status: "PENDING",
            };
            (prismaMock.leaveRequest.findFirst as jest.Mock).mockResolvedValue(mockLeaveRequest);
            (prismaMock.leaveRequest.update as jest.Mock).mockResolvedValue({
                ...mockLeaveRequest,
                status: "REJECTED",
            });

            const result = await ApprovalService.reject(hrdContext, "LEAVE", "leave-1", {
                reason: "Insufficient leave balance",
            });

            expect(result.success).toBe(true);
            expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: "REJECTED",
                        rejectionReason: "Insufficient leave balance",
                    }),
                })
            );
        });

        it("should require minimum reason length", async () => {
            const result = await ApprovalService.reject(hrdContext, "LEAVE", "leave-1", {
                reason: "Too short",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("VALIDATION_ERROR");
        });

        it("should reject correction request", async () => {
            const mockCorrection = {
                id: "corr-1",
                employeeId: "emp-1",
                status: "PENDING",
            };
            (prismaMock.attendanceCorrection.findFirst as jest.Mock).mockResolvedValue(mockCorrection);
            (prismaMock.attendanceCorrection.update as jest.Mock).mockResolvedValue({
                ...mockCorrection,
                status: "REJECTED",
            });

            const result = await ApprovalService.reject(hrdContext, "ATTENDANCE_CORRECTION", "corr-1", {
                reason: "Invalid correction request - no evidence provided",
            });

            expect(result.success).toBe(true);
        });
    });

    describe("getStats", () => {
        it("should return approval statistics", async () => {
            (prismaMock.leaveRequest.count as jest.Mock)
                .mockResolvedValueOnce(5) // pending
                .mockResolvedValueOnce(20) // approved
                .mockResolvedValueOnce(3); // rejected

            (prismaMock.attendanceCorrection.count as jest.Mock).mockResolvedValue(2);
            (prismaMock.travelRequest.count as jest.Mock).mockResolvedValue(1);
            (prismaMock.reimburseRequest.count as jest.Mock).mockResolvedValue(4);

            const result = await ApprovalService.getStats(hrdContext);

            expect(result.success).toBe(true);
            expect(result.data?.pending).toBeGreaterThan(0);
            expect(result.data?.byType).toBeDefined();
            expect(result.data?.byType.LEAVE).toBe(5);
        });

        it("should deny access for regular employees", async () => {
            const result = await ApprovalService.getStats(employeeContext);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });
    });
});
