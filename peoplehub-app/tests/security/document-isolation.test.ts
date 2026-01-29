/**
 * @jest-environment node
 */
// @ai:cl - Security Test Suite: Document Service Multi-Tenant Isolation
// Verifies tenant protection for sensitive employee documents (contracts, NDA, etc.)

import { prismaMock, resetPrismaMock } from "../mocks/prisma";
import { resetCacheMock } from "../mocks/cache";
import { DocumentService } from "@/services/document/document.service";
import { createMockContext } from "../mocks/context";

describe("Security: Document Service Tenant Isolation", () => {
    beforeEach(() => {
        resetPrismaMock();
        resetCacheMock();
    });

    const TENANT_A = "tenant-A-kreatifindo";
    const TENANT_B = "tenant-B-violet";

    const contextTenantA_HRD = createMockContext({
        tenantId: TENANT_A,
        role: "HRD",
        userId: "user-hrd-a",
        employeeId: "emp-hrd-a",
    });

    const contextTenantB_HRD = createMockContext({
        tenantId: TENANT_B,
        role: "HRD",
        userId: "user-hrd-b",
        employeeId: "emp-hrd-b",
    });

    const contextTenantA_Employee = createMockContext({
        tenantId: TENANT_A,
        role: "EMPLOYEE",
        userId: "user-emp-a",
        employeeId: "emp-a",
    });

    describe("DocumentService.getDocuments", () => {
        it("should ISOLATE document list queries by tenantId", async () => {
            (prismaMock.document.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.document.count as jest.Mock).mockResolvedValue(0);

            await DocumentService.getDocuments(contextTenantA_HRD, { page: 1, limit: 10 });

            expect(prismaMock.document.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_A,
                        isActive: true,
                    }),
                })
            );
        });

        it("should PREVENT cross-tenant document queries", async () => {
            (prismaMock.document.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.document.count as jest.Mock).mockResolvedValue(0);

            await DocumentService.getDocuments(contextTenantB_HRD, { page: 1, limit: 10 });

            expect(prismaMock.document.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_B,
                    }),
                })
            );
        });
    });

    describe("DocumentService.upload", () => {
        it("should ISOLATE upload - check employee in same tenant", async () => {
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(null); // Employee not found in this tenant
            (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});

            const result = await DocumentService.upload(contextTenantA_HRD, {
                employeeId: "emp-from-tenant-B",
                type: "PERSONAL",
                name: "KTP",
                fileUrl: "/files/ktp.pdf",
                fileSize: 1024,
                mimeType: "application/pdf",
            });

            // Employee check MUST filter by tenantId
            expect(prismaMock.employee.findFirst).toHaveBeenCalledWith({
                where: {
                    id: "emp-from-tenant-B",
                    tenantId: TENANT_A, // CRITICAL: Must check in same tenant
                },
            });

            // If employee not found in tenant, should fail
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });

        it("should CREATE document with correct tenantId", async () => {
            const mockEmployee = {
                id: "emp-hrd-a",
                fullName: "HRD Person",
                tenantId: TENANT_A,
            };
            (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
            (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({});

            const result = await DocumentService.upload(contextTenantA_HRD, {
                type: "PERSONAL",
                name: "KTP",
                fileUrl: "/files/ktp.pdf",
                fileSize: 1024,
                mimeType: "application/pdf",
            });

            expect(result.success).toBe(true);
            expect(result.data?.tenantId).toBe(TENANT_A);
        });
    });

    describe("DocumentService.approve (Cross-Tenant Attempt)", () => {
        it("should PREVENT approving document from another tenant", async () => {
            // Mock: No document found because it's isolated
            (prismaMock.document.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await DocumentService.approve(contextTenantB_HRD, "doc-in-tenant-A");

            // Should query with Tenant B context
            expect(prismaMock.document.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_B,
                        id: "doc-in-tenant-A",
                    }),
                })
            );

            // Result should be NOT_FOUND (document not visible to Tenant B)
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });
    });

    describe("DocumentService.delete (Cross-Tenant Attempt)", () => {
        it("should PREVENT deleting document from another tenant", async () => {
            (prismaMock.document.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await DocumentService.delete(contextTenantB_HRD, "doc-in-tenant-A");

            expect(prismaMock.document.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: TENANT_B,
                    }),
                })
            );

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe("NOT_FOUND");
        });
    });

    describe("Employee Role-Based Isolation", () => {
        it("should limit employee to only their own documents", async () => {
            const mockDocuments = [
                {
                    id: "doc-1",
                    tenantId: TENANT_A,
                    employeeId: "emp-a",
                    name: "My KTP",
                },
                {
                    id: "doc-2",
                    tenantId: TENANT_A,
                    employeeId: "emp-other",
                    name: "Other's KTP",
                },
            ];

            (prismaMock.document.findMany as jest.Mock).mockResolvedValue(mockDocuments);
            (prismaMock.document.count as jest.Mock).mockResolvedValue(mockDocuments.length);

            await DocumentService.getDocuments(contextTenantA_Employee, {
                page: 1,
                limit: 10,
            });

            // Service handles filtering internally
            expect(prismaMock.document.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        employeeId: "emp-a",
                    }),
                })
            );
        });
    });
});
