/**
 * @jest-environment node
 */
// @ai:cl - Unit tests for EmployeeService
import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { resetCacheMock } from "../mocks/cache";
import {
    adminContext,
    hrdContext,
    managerContext,
    employeeContext,
    createMockContext,
} from "../mocks/context";
import { EmployeeService } from "@/services/employee/employee.service";

describe("EmployeeService", () => {
    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
    });

    describe("getEmployees", () => {
        const mockEmployees = [
            {
                id: "emp-1",
                tenantId: "tenant-123",
                userId: "user-1",
                fullName: "John Doe",
                employeeNumber: "EMP001",
                status: "ACTIVE",
                employmentType: "PERMANENT",
                user: { email: "john@example.com", role: "EMPLOYEE" },
                branch: { id: "branch-1", name: "Head Office" },
                department: { id: "dept-1", name: "Engineering" },
                position: { id: "pos-1", name: "Developer" },
                manager: null,
            },
            {
                id: "emp-2",
                tenantId: "tenant-123",
                userId: "user-2",
                fullName: "Jane Smith",
                employeeNumber: "EMP002",
                status: "ACTIVE",
                employmentType: "CONTRACT",
                user: { email: "jane@example.com", role: "EMPLOYEE" },
                branch: { id: "branch-1", name: "Head Office" },
                department: { id: "dept-1", name: "Engineering" },
                position: { id: "pos-2", name: "Designer" },
                manager: { id: "emp-1", fullName: "John Doe" },
            },
        ];

        it("should return employees for HRD role", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(2);

            const result = await EmployeeService.getEmployees(hrdContext, { page: 1, limit: 20 });

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.meta?.total).toBe(2);
        });

        it("should return employees for SUPER_ADMIN role", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(2);

            const result = await EmployeeService.getEmployees(adminContext, { page: 1, limit: 20 });

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
        });

        it("should filter subordinates for MANAGER role", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([mockEmployees[1]]);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(1);

            const result = await EmployeeService.getEmployees(managerContext, { page: 1, limit: 20 });

            expect(result.success).toBe(true);
            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        managerId: managerContext.employeeId,
                    }),
                })
            );
        });

        it("should deny access for EMPLOYEE role", async () => {
            const result = await EmployeeService.getEmployees(employeeContext, { page: 1, limit: 20 });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should apply search filter", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([mockEmployees[0]]);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(1);

            await EmployeeService.getEmployees(hrdContext, { page: 1, limit: 20, search: "John" });

            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({ fullName: expect.any(Object) }),
                        ]),
                    }),
                })
            );
        });

        it("should apply department filter", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([mockEmployees[0]]);
            (prismaMock.employee.count as jest.Mock).mockResolvedValue(1);

            await EmployeeService.getEmployees(hrdContext, {
                page: 1,
                limit: 20,
                departmentId: "dept-1",
            });

            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        departmentId: "dept-1",
                    }),
                })
            );
        });
    });

    describe("getEmployeeById", () => {
        const mockEmployee = {
            id: "emp-1",
            tenantId: "tenant-123",
            userId: "user-1",
            fullName: "John Doe",
            employeeNumber: "EMP001",
            status: "ACTIVE",
            managerId: null,
            user: { email: "john@example.com", role: "EMPLOYEE", status: "ACTIVE", lastLoginAt: null },
            branch: { id: "branch-1", name: "Head Office", code: "HO" },
            department: { id: "dept-1", name: "Engineering", code: "ENG" },
            position: { id: "pos-1", name: "Developer", code: "DEV", level: 3 },
            manager: null,
            subordinates: [],
        };

        it("should return employee for HRD", async () => {
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

            const result = await EmployeeService.getEmployeeById(hrdContext, "emp-1");

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe("emp-1");
        });

        it("should allow employee to view own profile", async () => {
            const ownContext = createMockContext({ employeeId: "emp-1", role: "EMPLOYEE" });
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue({
                ...mockEmployee,
                id: "emp-1",
            });

            const result = await EmployeeService.getEmployeeById(ownContext, "emp-1");

            expect(result.success).toBe(true);
        });

        it("should allow manager to view subordinate profile", async () => {
            const subordinateEmployee = {
                ...mockEmployee,
                id: "emp-2",
                managerId: "manager-employee-123",
            };
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(subordinateEmployee);

            const result = await EmployeeService.getEmployeeById(managerContext, "emp-2");

            expect(result.success).toBe(true);
        });

        it("should return NOT_FOUND for non-existent employee", async () => {
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await EmployeeService.getEmployeeById(hrdContext, "non-existent");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should deny access to other employee profiles for regular employees", async () => {
            const otherEmployee = {
                ...mockEmployee,
                id: "emp-other",
                managerId: "other-manager",
            };
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(otherEmployee);

            const result = await EmployeeService.getEmployeeById(employeeContext, "emp-other");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });
    });

    describe("createEmployee", () => {
        const createData = {
            userId: "user-new",
            employeeNumber: "EMP003",
            fullName: "New Employee",
            startDate: new Date(),
        };

        it("should create employee for HRD", async () => {
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaMock.employee.create as jest.Mock).mockResolvedValue({
                id: "emp-new",
                ...createData,
                tenantId: hrdContext.tenantId,
            });

            const result = await EmployeeService.createEmployee(hrdContext, createData);

            expect(result.success).toBe(true);
            expect(result.data?.employeeNumber).toBe("EMP003");
        });

        it("should deny create for non-HRD role", async () => {
            const result = await EmployeeService.createEmployee(employeeContext, createData);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should reject duplicate employee number", async () => {
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValueOnce({
                id: "existing",
                employeeNumber: "EMP003",
            });

            const result = await EmployeeService.createEmployee(hrdContext, createData);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("ALREADY_EXISTS");
        });

        it("should reject if user already has employee profile", async () => {
            (prismaMock.employee.findFirst as jest.Mock)
                .mockResolvedValueOnce(null) // No duplicate employee number
                .mockResolvedValueOnce({ id: "existing", userId: "user-new" }); // User has profile

            const result = await EmployeeService.createEmployee(hrdContext, createData);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("ALREADY_EXISTS");
        });
    });

    describe("updateEmployee", () => {
        const mockEmployee = {
            id: "emp-1",
            tenantId: "tenant-123",
            fullName: "John Doe",
        };

        it("should update employee for HRD", async () => {
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
            (prismaMock.employee.update as jest.Mock).mockResolvedValue({
                ...mockEmployee,
                fullName: "John Updated",
            });

            const result = await EmployeeService.updateEmployee(hrdContext, "emp-1", {
                fullName: "John Updated",
            });

            expect(result.success).toBe(true);
            expect(result.data?.fullName).toBe("John Updated");
        });

        it("should deny update for non-HRD role", async () => {
            const result = await EmployeeService.updateEmployee(employeeContext, "emp-1", {
                fullName: "John Updated",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should return NOT_FOUND for non-existent employee", async () => {
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await EmployeeService.updateEmployee(hrdContext, "non-existent", {
                fullName: "Updated",
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });
    });

    describe("terminateEmployee", () => {
        const mockEmployee = {
            id: "emp-1",
            tenantId: "tenant-123",
            userId: "user-1",
            status: "ACTIVE",
        };

        it("should terminate employee for HRD", async () => {
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
            (prismaMock.employee.update as jest.Mock).mockResolvedValue({
                ...mockEmployee,
                status: "TERMINATED",
            });
            (prismaMock.user.update as jest.Mock).mockResolvedValue({});

            const result = await EmployeeService.terminateEmployee(
                hrdContext,
                "emp-1",
                new Date()
            );

            expect(result.success).toBe(true);
            expect(result.data?.status).toBe("TERMINATED");
            expect(prismaMock.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: "user-1" },
                    data: { status: "SUSPENDED" },
                })
            );
        });

        it("should deny termination for non-HRD role", async () => {
            const result = await EmployeeService.terminateEmployee(
                employeeContext,
                "emp-1",
                new Date()
            );

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });

        it("should reject termination of already terminated employee", async () => {
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue({
                ...mockEmployee,
                status: "TERMINATED",
            });

            const result = await EmployeeService.terminateEmployee(
                hrdContext,
                "emp-1",
                new Date()
            );

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("CONFLICT");
        });
    });

    describe("getSubordinates", () => {
        const mockSubordinates = [
            { id: "emp-2", fullName: "Jane Smith", position: { name: "Designer" } },
            { id: "emp-3", fullName: "Bob Wilson", position: { name: "Developer" } },
        ];

        it("should return subordinates for manager", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue(mockSubordinates);

            const result = await EmployeeService.getSubordinates(managerContext);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        managerId: managerContext.employeeId,
                    }),
                })
            );
        });

        it("should allow HRD to view any manager's subordinates", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue(mockSubordinates);

            const result = await EmployeeService.getSubordinates(hrdContext, "other-manager");

            expect(result.success).toBe(true);
        });

        it("should deny non-manager from viewing other's subordinates", async () => {
            const result = await EmployeeService.getSubordinates(employeeContext, "other-manager");

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });
    });

    describe("getStats", () => {
        it("should return employee statistics for HRD", async () => {
            (prismaMock.employee.count as jest.Mock)
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(90) // active
                .mockResolvedValueOnce(5) // inactive
                .mockResolvedValueOnce(70) // permanent
                .mockResolvedValueOnce(20); // contract

            (prismaMock.employee.groupBy as jest.Mock)
                .mockResolvedValueOnce([
                    { departmentId: "dept-1", _count: { id: 50 } },
                    { departmentId: "dept-2", _count: { id: 40 } },
                ])
                .mockResolvedValueOnce([
                    { branchId: "branch-1", _count: { id: 60 } },
                    { branchId: "branch-2", _count: { id: 30 } },
                ]);

            (prismaMock.department.findMany as jest.Mock).mockResolvedValue([
                { id: "dept-1", name: "Engineering" },
                { id: "dept-2", name: "Marketing" },
            ]);

            (prismaMock.branch.findMany as jest.Mock).mockResolvedValue([
                { id: "branch-1", name: "Head Office" },
                { id: "branch-2", name: "Branch A" },
            ]);

            const result = await EmployeeService.getStats(hrdContext);

            expect(result.success).toBe(true);
            expect(result.data?.total).toBe(100);
            expect(result.data?.active).toBe(90);
            expect(result.data?.byDepartment).toHaveLength(2);
        });

        it("should deny access for regular employees", async () => {
            const result = await EmployeeService.getStats(employeeContext);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("FORBIDDEN");
        });
    });

    describe("searchEmployees", () => {
        const mockResults = [
            { id: "emp-1", fullName: "John Doe", employeeNumber: "EMP001" },
            { id: "emp-2", fullName: "Johnny Smith", employeeNumber: "EMP002" },
        ];

        it("should search employees by name", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue(mockResults);

            const result = await EmployeeService.searchEmployees(employeeContext, "John");

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            { fullName: { contains: "John", mode: "insensitive" } },
                            { employeeNumber: { contains: "John", mode: "insensitive" } },
                        ]),
                    }),
                })
            );
        });

        it("should limit search results", async () => {
            (prismaMock.employee.findMany as jest.Mock).mockResolvedValue(mockResults.slice(0, 1));

            await EmployeeService.searchEmployees(employeeContext, "John", 1);

            expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 1,
                })
            );
        });
    });
});
