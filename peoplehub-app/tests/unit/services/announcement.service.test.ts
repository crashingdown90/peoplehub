/**
 * @jest-environment node
 */
// @ai:cl - AnnouncementService unit tests - Refactored to use centralized mocks
import { prismaMock, resetPrismaMock } from "../../mocks/prisma";
import { AnnouncementService } from "@/services/announcement";
import type { RequestContext } from "@/lib/tenant";

describe("AnnouncementService", () => {
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

  const superAdminContext: RequestContext = {
    tenantId: "tenant-123",
    userId: "user-admin",
    employeeId: "emp-admin",
    role: "SUPER_ADMIN",
  };

  // Mock data
  const mockAnnouncement = {
    id: "ann-123",
    tenantId: "tenant-123",
    title: "Test Announcement",
    content: "This is a test announcement",
    targetAudience: null,
    status: "PUBLISHED",
    publishedById: "user-789",
    publishedAt: new Date(),
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDraftAnnouncement = {
    ...mockAnnouncement,
    id: "ann-456",
    status: "DRAFT",
    publishedById: null,
    publishedAt: null,
  };

  beforeEach(() => {
    resetPrismaMock();
    (prismaMock.announcement.findMany as jest.Mock).mockResolvedValue([mockAnnouncement]);
    (prismaMock.announcement.count as jest.Mock).mockResolvedValue(1);
    (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(mockAnnouncement);
    (prismaMock.announcement.create as jest.Mock).mockResolvedValue(mockDraftAnnouncement);
    (prismaMock.announcement.update as jest.Mock).mockResolvedValue(mockAnnouncement);
    (prismaMock.announcement.delete as jest.Mock).mockResolvedValue({ deleted: true });
    (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue({
      branchId: "branch-1",
      departmentId: "dept-1",
    });
  });

  describe("getAnnouncements", () => {
    it("should return published announcements for EMPLOYEE", async () => {
      (prismaMock.announcement.findMany as jest.Mock).mockResolvedValue([mockAnnouncement]);
      (prismaMock.announcement.count as jest.Mock).mockResolvedValue(1);
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue({
        branchId: "branch-1",
        departmentId: "dept-1",
      });

      const result = await AnnouncementService.getInboxAnnouncements(employeeContext, {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(prismaMock.announcement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PUBLISHED",
          }),
        })
      );
    });

    it("should return all announcements for HRD", async () => {
      (prismaMock.announcement.findMany as jest.Mock).mockResolvedValue([mockAnnouncement, mockDraftAnnouncement]);
      (prismaMock.announcement.count as jest.Mock).mockResolvedValue(2);

      const result = await AnnouncementService.getAdminAnnouncements(hrdContext, {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should filter by status for HRD", async () => {
      (prismaMock.announcement.findMany as jest.Mock).mockResolvedValue([mockDraftAnnouncement]);
      (prismaMock.announcement.count as jest.Mock).mockResolvedValue(1);

      await AnnouncementService.getAdminAnnouncements(hrdContext, { status: "DRAFT" });

      expect(prismaMock.announcement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "DRAFT",
          }),
        })
      );
    });

    it("should filter announcements by audience targeting", async () => {
      const targetedAnnouncement = {
        ...mockAnnouncement,
        targetAudience: { branches: ["branch-1"], departments: [], roles: [] },
      };
      (prismaMock.announcement.findMany as jest.Mock).mockResolvedValue([targetedAnnouncement]);
      (prismaMock.announcement.count as jest.Mock).mockResolvedValue(1);
      (prismaMock.employee.findFirst as jest.Mock).mockResolvedValue({
        branchId: "branch-1",
        departmentId: "dept-1",
      });

      const result = await AnnouncementService.getInboxAnnouncements(employeeContext, {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getAnnouncementById", () => {
    it("should return published announcement for EMPLOYEE", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(mockAnnouncement);

      const result = await AnnouncementService.getAnnouncementById(employeeContext, "ann-123");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnnouncement);
    });

    it("should deny draft announcement access for EMPLOYEE", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(mockDraftAnnouncement);

      const result = await AnnouncementService.getAnnouncementById(employeeContext, "ann-456");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("should allow HRD to view draft announcement", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(mockDraftAnnouncement);

      const result = await AnnouncementService.getAnnouncementById(hrdContext, "ann-456");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDraftAnnouncement);
    });

    it("should return NOT_FOUND when announcement not found", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await AnnouncementService.getAnnouncementById(hrdContext, "nonexistent");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });
  });

  describe("createAnnouncement", () => {
    it("should create announcement for HRD", async () => {
      (prismaMock.announcement.create as jest.Mock).mockResolvedValue(mockDraftAnnouncement);

      const result = await AnnouncementService.createAnnouncement(hrdContext, {
        title: "Test Announcement",
        content: "This is a test",
      });

      expect(result.success).toBe(true);
      expect(prismaMock.announcement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "DRAFT",
          }),
        })
      );
    });

    it("should deny announcement creation for EMPLOYEE", async () => {
      const result = await AnnouncementService.createAnnouncement(employeeContext, {
        title: "Test",
        content: "Content",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("updateAnnouncement", () => {
    it("should update announcement for HRD", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(mockDraftAnnouncement);
      (prismaMock.announcement.update as jest.Mock).mockResolvedValue({
        ...mockDraftAnnouncement,
        title: "Updated Title",
      });

      const result = await AnnouncementService.updateAnnouncement(hrdContext, "ann-456", {
        title: "Updated Title",
      });

      expect(result.success).toBe(true);
    });

    it("should deny update for EMPLOYEE", async () => {
      const result = await AnnouncementService.updateAnnouncement(employeeContext, "ann-456", {
        title: "Updated Title",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("should return NOT_FOUND when announcement not found", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await AnnouncementService.updateAnnouncement(hrdContext, "nonexistent", {
        title: "Updated",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });
  });

  describe("publishAnnouncement", () => {
    it("should publish draft announcement for HRD", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(mockDraftAnnouncement);
      (prismaMock.announcement.update as jest.Mock).mockResolvedValue({
        ...mockDraftAnnouncement,
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      const result = await AnnouncementService.publishAnnouncement(hrdContext, "ann-456");

      expect(result.success).toBe(true);
      expect(prismaMock.announcement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "PUBLISHED",
          }),
        })
      );
    });

    it("should return CONFLICT when already published", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(mockAnnouncement); // Already published

      const result = await AnnouncementService.publishAnnouncement(hrdContext, "ann-123");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("CONFLICT");
    });

    it("should deny publish for EMPLOYEE", async () => {
      const result = await AnnouncementService.publishAnnouncement(employeeContext, "ann-456");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("archiveAnnouncement", () => {
    it("should archive announcement for HRD", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(mockAnnouncement);
      (prismaMock.announcement.update as jest.Mock).mockResolvedValue({
        ...mockAnnouncement,
        status: "ARCHIVED",
      });

      const result = await AnnouncementService.archiveAnnouncement(hrdContext, "ann-123");

      expect(result.success).toBe(true);
    });

    it("should deny archive for EMPLOYEE", async () => {
      const result = await AnnouncementService.archiveAnnouncement(employeeContext, "ann-123");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("deleteAnnouncement", () => {
    it("should delete announcement for SUPER_ADMIN", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(mockAnnouncement);
      (prismaMock.announcement.delete as jest.Mock).mockResolvedValue(mockAnnouncement);

      const result = await AnnouncementService.deleteAnnouncement(superAdminContext, "ann-123");

      expect(result.success).toBe(true);
      expect(result.data?.deleted).toBe(true);
    });

    it("should deny delete for HRD", async () => {
      const result = await AnnouncementService.deleteAnnouncement(hrdContext, "ann-123");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("should deny delete for EMPLOYEE", async () => {
      const result = await AnnouncementService.deleteAnnouncement(employeeContext, "ann-123");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });

    it("should return NOT_FOUND when announcement not found", async () => {
      (prismaMock.announcement.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await AnnouncementService.deleteAnnouncement(superAdminContext, "nonexistent");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });
  });
});
