/**
 * @jest-environment node
 */
// @ai:cl - NotificationService unit tests
import { prismaMock, resetPrismaMocks } from "../../mocks/prisma.mock";
import { createMockContext } from "../../mocks/context.mock";
import { NotificationService } from "@/services/notification";

describe("NotificationService", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  describe("create", () => {
    it("should create a notification successfully", async () => {
      const context = createMockContext();
      const mockNotification = {
        id: "notif-1",
        tenantId: context.tenantId,
        userId: "user-456",
        type: "LEAVE",
        title: "Leave Approved",
        message: "Your leave request has been approved",
        link: "/leave/123",
        objectType: "LeaveRequest",
        objectId: "leave-123",
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      };

      (prismaMock.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await NotificationService.create(context, {
        userId: "user-456",
        type: "LEAVE",
        title: "Leave Approved",
        message: "Your leave request has been approved",
        link: "/leave/123",
        objectType: "LeaveRequest",
        objectId: "leave-123",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNotification);
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: context.tenantId,
          userId: "user-456",
          type: "LEAVE",
          title: "Leave Approved",
        }),
      });
    });
  });

  describe("createBulk", () => {
    it("should create notifications for multiple users", async () => {
      const context = createMockContext();
      (prismaMock.notification.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await NotificationService.createBulk(context, {
        userIds: ["user-1", "user-2", "user-3"],
        type: "ANNOUNCEMENT",
        title: "New Announcement",
        message: "Important announcement for all employees",
      });

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(3);
      expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: "user-1" }),
          expect.objectContaining({ userId: "user-2" }),
          expect.objectContaining({ userId: "user-3" }),
        ]),
      });
    });
  });

  describe("getAll", () => {
    it("should return paginated notifications", async () => {
      const context = createMockContext();
      const mockNotifications = [
        { id: "notif-1", title: "Test 1", isRead: false, createdAt: new Date() },
        { id: "notif-2", title: "Test 2", isRead: true, createdAt: new Date() },
      ];

      (prismaMock.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (prismaMock.notification.count as jest.Mock).mockResolvedValue(10);

      const result = await NotificationService.getAll(context, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNotifications);
      expect(result.meta?.total).toBe(10);
      expect(result.meta?.page).toBe(1);
    });

    it("should filter by type", async () => {
      const context = createMockContext();
      (prismaMock.notification.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.notification.count as jest.Mock).mockResolvedValue(0);

      await NotificationService.getAll(context, { type: "LEAVE" });

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "LEAVE" }),
        })
      );
    });
  });

  describe("getUnread", () => {
    it("should return unread notifications with count", async () => {
      const context = createMockContext();
      const mockNotifications = [
        { id: "notif-1", title: "Unread 1", isRead: false },
        { id: "notif-2", title: "Unread 2", isRead: false },
      ];

      (prismaMock.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (prismaMock.notification.count as jest.Mock).mockResolvedValue(5);

      const result = await NotificationService.getUnread(context, 10);

      expect(result.success).toBe(true);
      expect(result.data?.notifications).toEqual(mockNotifications);
      expect(result.data?.unreadCount).toBe(5);
    });
  });

  describe("markRead", () => {
    it("should mark notification as read", async () => {
      const context = createMockContext();
      const mockNotification = {
        id: "notif-1",
        userId: context.userId,
        isRead: false,
        tenantId: context.tenantId,
      };
      const updatedNotification = { ...mockNotification, isRead: true, readAt: new Date() };

      (prismaMock.notification.findFirst as jest.Mock).mockResolvedValue(mockNotification);
      (prismaMock.notification.update as jest.Mock).mockResolvedValue(updatedNotification);

      const result = await NotificationService.markRead(context, "notif-1");

      expect(result.success).toBe(true);
      expect(result.data?.isRead).toBe(true);
    });

    it("should return error if notification not found", async () => {
      const context = createMockContext();
      (prismaMock.notification.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await NotificationService.markRead(context, "non-existent");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("should return success if already read", async () => {
      const context = createMockContext();
      const mockNotification = {
        id: "notif-1",
        userId: context.userId,
        isRead: true,
        readAt: new Date(),
        tenantId: context.tenantId,
      };

      (prismaMock.notification.findFirst as jest.Mock).mockResolvedValue(mockNotification);

      const result = await NotificationService.markRead(context, "notif-1");

      expect(result.success).toBe(true);
      expect(prismaMock.notification.update).not.toHaveBeenCalled();
    });
  });

  describe("markAllRead", () => {
    it("should mark all unread notifications as read", async () => {
      const context = createMockContext();
      (prismaMock.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await NotificationService.markAllRead(context);

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(5);
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId: context.tenantId,
          userId: context.userId,
          isRead: false,
        },
        data: expect.objectContaining({
          isRead: true,
        }),
      });
    });
  });

  describe("getPreferences", () => {
    it("should return existing preferences", async () => {
      const context = createMockContext();
      const mockPrefs = {
        id: "pref-1",
        userId: context.userId,
        emailEnabled: true,
        inAppEnabled: true,
      };

      (prismaMock.notificationPreference.findUnique as jest.Mock).mockResolvedValue(mockPrefs);

      const result = await NotificationService.getPreferences(context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPrefs);
    });

    it("should create default preferences if not exists", async () => {
      const context = createMockContext();
      const newPrefs = {
        id: "pref-new",
        userId: context.userId,
        tenantId: context.tenantId,
        emailEnabled: true,
        inAppEnabled: true,
      };

      (prismaMock.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaMock.notificationPreference.create as jest.Mock).mockResolvedValue(newPrefs);

      const result = await NotificationService.getPreferences(context);

      expect(result.success).toBe(true);
      expect(prismaMock.notificationPreference.create).toHaveBeenCalled();
    });
  });

  describe("helper methods", () => {
    it("sendLeaveNotification should create leave notification", async () => {
      const context = createMockContext();
      const mockNotification = { id: "notif-1", type: "LEAVE" };

      (prismaMock.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await NotificationService.sendLeaveNotification(
        context,
        "user-456",
        "Leave Approved",
        "Your leave has been approved",
        "leave-123"
      );

      expect(result.success).toBe(true);
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "LEAVE",
          objectType: "LeaveRequest",
          objectId: "leave-123",
        }),
      });
    });

    it("sendAnnouncementNotification should create bulk notifications", async () => {
      const context = createMockContext();
      (prismaMock.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await NotificationService.sendAnnouncementNotification(
        context,
        ["user-1", "user-2"],
        "Announcement",
        "Important message"
      );

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(2);
    });
  });
});
