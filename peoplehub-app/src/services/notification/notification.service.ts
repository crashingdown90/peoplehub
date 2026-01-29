// @ai:cl - Notification service - business logic layer
import { prisma } from "@/lib/db";
import { RequestContext, withTenant } from "@/lib/tenant";
import { getCache, CacheKeys, CacheTags, CacheTTL } from "@/lib/cache";
import {
  ServiceResponse,
  success,
  error,
  paginated,
  ErrorCodes,
  PaginationParams,
} from "../types";
import type { Notification, NotificationType } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  objectType?: string;
  objectId?: string;
}

export interface CreateBulkNotificationData {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  objectType?: string;
  objectId?: string;
}

export interface NotificationFilter extends PaginationParams {
  type?: NotificationType;
  isRead?: boolean;
}

export interface NotificationWithCount {
  notifications: Notification[];
  unreadCount: number;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class NotificationService {
  /**
   * Create a single notification
   */
  static async create(
    context: RequestContext,
    data: CreateNotificationData
  ): Promise<ServiceResponse<Notification>> {
    const notification = await prisma.notification.create({
      data: {
        tenantId: context.tenantId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        objectType: data.objectType,
        objectId: data.objectId,
      },
    });

    // Invalidate cache for the recipient
    await this.invalidateUserCache(data.userId);

    return success(notification);
  }

  /**
   * Create notifications for multiple users (bulk)
   */
  static async createBulk(
    context: RequestContext,
    data: CreateBulkNotificationData
  ): Promise<ServiceResponse<{ count: number }>> {
    const notifications = data.userIds.map((userId) => ({
      tenantId: context.tenantId,
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      objectType: data.objectType,
      objectId: data.objectId,
    }));

    const result = await prisma.notification.createMany({
      data: notifications,
    });

    // Invalidate cache for all recipients
    await this.invalidateUsersCache(data.userIds);

    return success({ count: result.count });
  }

  /**
   * Get all notifications for current user
   */
  static async getAll(
    context: RequestContext,
    filter: NotificationFilter = {}
  ): Promise<ServiceResponse<Notification[]>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      type,
      isRead,
    } = filter;

    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
      userId: context.userId,
    };

    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  }

  /**
   * Get unread notifications for current user (cached)
   */
  static async getUnread(
    context: RequestContext,
    limit: number = 10
  ): Promise<ServiceResponse<NotificationWithCount>> {
    const cache = getCache();
    const cacheKey = CacheKeys.notificationUnread(context.tenantId, context.userId);

    const cached = await cache.get<NotificationWithCount>(cacheKey);
    if (cached) {
      // Respect limit from cached data
      return success({
        notifications: cached.notifications.slice(0, limit),
        unreadCount: cached.unreadCount,
      });
    }

    const where = {
      tenantId: context.tenantId,
      userId: context.userId,
      isRead: false,
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20, // Cache more than requested for flexibility
      }),
      prisma.notification.count({ where }),
    ]);

    const result = { notifications, unreadCount };

    // Cache for 1 minute with user-specific tag
    await cache.set(cacheKey, result, {
      ttl: CacheTTL.SHORT,
      tags: [CacheTags.notification(context.userId)],
    });

    return success({
      notifications: notifications.slice(0, limit),
      unreadCount,
    });
  }

  /**
   * Get unread count only
   */
  static async getUnreadCount(
    context: RequestContext
  ): Promise<ServiceResponse<number>> {
    const count = await prisma.notification.count({
      where: {
        tenantId: context.tenantId,
        userId: context.userId,
        isRead: false,
      },
    });

    return success(count);
  }

  /**
   * Mark a single notification as read
   */
  static async markRead(
    context: RequestContext,
    notificationId: string
  ): Promise<ServiceResponse<Notification>> {
    // Check ownership
    const notification = await prisma.notification.findFirst({
      where: withTenant(context, {
        id: notificationId,
        userId: context.userId,
      }),
    });

    if (!notification) {
      return error(ErrorCodes.NOT_FOUND, "Notifikasi tidak ditemukan");
    }

    if (notification.isRead) {
      return success(notification);
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Invalidate cache
    await this.invalidateUserCache(context.userId);

    return success(updated);
  }

  /**
   * Mark all notifications as read for current user
   */
  static async markAllRead(
    context: RequestContext
  ): Promise<ServiceResponse<{ count: number }>> {
    const result = await prisma.notification.updateMany({
      where: {
        tenantId: context.tenantId,
        userId: context.userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Invalidate cache
    await this.invalidateUserCache(context.userId);

    return success({ count: result.count });
  }

  /**
   * Delete a notification
   */
  static async delete(
    context: RequestContext,
    notificationId: string
  ): Promise<ServiceResponse<{ deleted: boolean }>> {
    const notification = await prisma.notification.findFirst({
      where: withTenant(context, {
        id: notificationId,
        userId: context.userId,
      }),
    });

    if (!notification) {
      return error(ErrorCodes.NOT_FOUND, "Notifikasi tidak ditemukan");
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return success({ deleted: true });
  }

  /**
   * Delete all read notifications (cleanup)
   */
  static async deleteAllRead(
    context: RequestContext
  ): Promise<ServiceResponse<{ count: number }>> {
    const result = await prisma.notification.deleteMany({
      where: {
        tenantId: context.tenantId,
        userId: context.userId,
        isRead: true,
      },
    });

    return success({ count: result.count });
  }

  // ==========================================
  // NOTIFICATION PREFERENCE METHODS
  // ==========================================

  /**
   * Get notification preferences for current user
   */
  static async getPreferences(
    context: RequestContext
  ): Promise<ServiceResponse<Record<string, unknown>>> {
    let preferences = await prisma.notificationPreference.findUnique({
      where: {
        tenantId_userId: { tenantId: context.tenantId, userId: context.userId },
      },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          tenantId: context.tenantId,
          userId: context.userId,
        },
      });
    }

    return success(preferences);
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    context: RequestContext,
    data: Partial<{
      emailEnabled: boolean;
      emailDigest: string;
      inAppEnabled: boolean;
      attendanceAlerts: boolean;
      leaveAlerts: boolean;
      approvalAlerts: boolean;
      announcementAlerts: boolean;
    }>
  ): Promise<ServiceResponse<Record<string, unknown>>> {
    const preferences = await prisma.notificationPreference.upsert({
      where: {
        tenantId_userId: { tenantId: context.tenantId, userId: context.userId },
      },
      update: data,
      create: {
        tenantId: context.tenantId,
        userId: context.userId,
        ...data,
      },
    });

    return success(preferences);
  }

  // ==========================================
  // HELPER METHODS FOR OTHER SERVICES
  // ==========================================

  /**
   * Send attendance notification
   */
  static async sendAttendanceNotification(
    context: RequestContext,
    userId: string,
    title: string,
    message: string,
    attendanceId?: string
  ): Promise<ServiceResponse<Notification>> {
    return this.create(context, {
      userId,
      type: "ATTENDANCE",
      title,
      message,
      link: attendanceId ? `/attendance/${attendanceId}` : "/attendance",
      objectType: "Attendance",
      objectId: attendanceId,
    });
  }

  /**
   * Send leave notification
   */
  static async sendLeaveNotification(
    context: RequestContext,
    userId: string,
    title: string,
    message: string,
    leaveRequestId?: string
  ): Promise<ServiceResponse<Notification>> {
    return this.create(context, {
      userId,
      type: "LEAVE",
      title,
      message,
      link: leaveRequestId ? `/leave/${leaveRequestId}` : "/leave",
      objectType: "LeaveRequest",
      objectId: leaveRequestId,
    });
  }

  /**
   * Send approval notification
   */
  static async sendApprovalNotification(
    context: RequestContext,
    userId: string,
    title: string,
    message: string,
    approvalType: string,
    approvalId?: string
  ): Promise<ServiceResponse<Notification>> {
    return this.create(context, {
      userId,
      type: "APPROVAL",
      title,
      message,
      link: approvalId ? `/approvals/${approvalType}/${approvalId}` : "/approvals",
      objectType: approvalType,
      objectId: approvalId,
    });
  }

  /**
   * Send announcement notification to multiple users
   */
  static async sendAnnouncementNotification(
    context: RequestContext,
    userIds: string[],
    title: string,
    message: string,
    announcementId?: string
  ): Promise<ServiceResponse<{ count: number }>> {
    return this.createBulk(context, {
      userIds,
      type: "ANNOUNCEMENT",
      title,
      message,
      link: announcementId ? `/announcements/${announcementId}` : "/announcements",
      objectType: "Announcement",
      objectId: announcementId,
    });
  }

  /**
   * Send system notification
   */
  static async sendSystemNotification(
    context: RequestContext,
    userId: string,
    title: string,
    message: string
  ): Promise<ServiceResponse<Notification>> {
    return this.create(context, {
      userId,
      type: "SYSTEM",
      title,
      message,
    });
  }

  // ==========================================
  // CACHE HELPERS
  // ==========================================

  /**
   * Invalidate notification cache for a user
   */
  private static async invalidateUserCache(userId: string): Promise<void> {
    const cache = getCache();
    await cache.invalidateByTag(CacheTags.notification(userId));
  }

  /**
   * Invalidate notification cache for multiple users
   */
  private static async invalidateUsersCache(userIds: string[]): Promise<void> {
    const cache = getCache();
    const tags = userIds.map((userId) => CacheTags.notification(userId));
    await cache.invalidateByTags(tags);
  }
}
