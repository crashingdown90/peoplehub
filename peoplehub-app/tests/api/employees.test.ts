/**
 * @jest-environment node
 */
// @ai:cl - Integration tests for Employee API endpoints
import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { resetCacheMock } from "../mocks/cache";

// Mock request context
jest.mock("@/lib/request-context", () => ({
    getRequestContext: jest.fn(),
    hasRole: jest.fn((context, roles) => roles.includes(context.role)),
}));

import { getRequestContext } from "@/lib/request-context";
import { GET, POST } from "@/app/api/admin/employees/route";
import { NextRequest } from "next/server";

const createMockRequest = (url: string, options: { method?: string; body?: string } = {}): NextRequest => {
    return new NextRequest(new URL(url, "http://localhost:3000"), options);
};

describe("GET /api/admin/employees", () => {
    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
        jest.clearAllMocks();
    });

    const mockEmployees = [
        {
            id: "emp-1",
            fullName: "John Doe",
            employeeNumber: "EMP001",
            status: "ACTIVE",
            user: { email: "john@example.com", role: "EMPLOYEE" },
            branch: { id: "branch-1", name: "HQ" },
            department: { id: "dept-1", name: "Engineering" },
            position: { id: "pos-1", name: "Developer" },
            manager: null,
        },
    ];

    it("should return employees for authenticated HRD user", async () => {
        (getRequestContext as jest.Mock).mockResolvedValue({
            tenantId: "tenant-123",
            userId: "user-123",
            employeeId: "emp-hrd",
            role: "HRD",
        });
        (prismaMock.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
        (prismaMock.employee.count as jest.Mock).mockResolvedValue(1);

        const request = createMockRequest("http://localhost:3000/api/admin/employees");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(1);
    });

    it("should return 401 for unauthenticated request", async () => {
        (getRequestContext as jest.Mock).mockResolvedValue(null);

        const request = createMockRequest("http://localhost:3000/api/admin/employees");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
    });

    it("should apply search filter", async () => {
        (getRequestContext as jest.Mock).mockResolvedValue({
            tenantId: "tenant-123",
            userId: "user-123",
            employeeId: "emp-hrd",
            role: "HRD",
        });
        (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
        (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);

        const request = createMockRequest("http://localhost:3000/api/admin/employees?search=john");
        await GET(request);

        expect(prismaMock.employee.findMany).toHaveBeenCalled();
    });

    it("should apply status filter", async () => {
        (getRequestContext as jest.Mock).mockResolvedValue({
            tenantId: "tenant-123",
            userId: "user-123",
            employeeId: "emp-hrd",
            role: "HRD",
        });
        (prismaMock.employee.findMany as jest.Mock).mockResolvedValue([]);
        (prismaMock.employee.count as jest.Mock).mockResolvedValue(0);

        const request = createMockRequest("http://localhost:3000/api/admin/employees?status=ACTIVE");
        await GET(request);

        expect(prismaMock.employee.findMany).toHaveBeenCalled();
    });
});

describe("POST /api/admin/employees", () => {
    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
        jest.clearAllMocks();
    });

    const validEmployeeData = {
        userId: "user-new",
        fullName: "New Employee",
        employeeNumber: "EMP999",
        employmentType: "PERMANENT",
        workMode: "WFO",
        startDate: "2025-01-01",
    };

    it("should create employee for HRD user", async () => {
        (getRequestContext as jest.Mock).mockResolvedValue({
            tenantId: "tenant-123",
            userId: "user-hrd",
            employeeId: "emp-hrd",
            role: "HRD",
        });
        (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaMock.employee.create as jest.Mock).mockResolvedValue({
            id: "emp-new",
            ...validEmployeeData,
            tenantId: "tenant-123",
        });

        const request = createMockRequest("http://localhost:3000/api/admin/employees", {
            method: "POST",
            body: JSON.stringify(validEmployeeData),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.employeeNumber).toBe("EMP999");
    });

    it("should return 401 for unauthenticated request", async () => {
        (getRequestContext as jest.Mock).mockResolvedValue(null);

        const request = createMockRequest("http://localhost:3000/api/admin/employees", {
            method: "POST",
            body: JSON.stringify(validEmployeeData),
        });
        const response = await POST(request);

        expect(response.status).toBe(401);
    });

    it("should return 403 for non-HRD user", async () => {
        (getRequestContext as jest.Mock).mockResolvedValue({
            tenantId: "tenant-123",
            userId: "user-emp",
            employeeId: "emp-123",
            role: "EMPLOYEE",
        });

        const request = createMockRequest("http://localhost:3000/api/admin/employees", {
            method: "POST",
            body: JSON.stringify(validEmployeeData),
        });
        const response = await POST(request);

        expect(response.status).toBe(403);
    });

    it("should return 400 for invalid data", async () => {
        (getRequestContext as jest.Mock).mockResolvedValue({
            tenantId: "tenant-123",
            userId: "user-hrd",
            employeeId: "emp-hrd",
            role: "HRD",
        });

        const invalidData = {
            fullName: "A", // Too short
        };

        const request = createMockRequest("http://localhost:3000/api/admin/employees", {
            method: "POST",
            body: JSON.stringify(invalidData),
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.code).toBe("VALIDATION_ERROR");
    });
});
