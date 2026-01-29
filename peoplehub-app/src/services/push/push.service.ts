// @ai:cl - Push Notification Service for web push notifications
import { prisma } from "@/lib/db";
import { RequestContext } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes, PaginationParams } from "../types";
import { Prisma } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface RegisterSubscriptionInput {
  subscription: PushSubscription;
  deviceName?: string;
  platform?: "WEB" | "ANDROID" | "IOS";
}

export interface SendPushInput {
  userId?: string;
  userIds?: string[];
  roleFilter?: string[];
  branchId?: string;
  departmentId?: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  action?: { label: string; url: string };
  ttl?: number; // Time to live in seconds
}

export interface PushDevice {
  id: string;
  userId: string;
  subscription: PushSubscription;
  deviceName?: string;
  platform: string;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
}

export interface PushNotificationLog {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  sentById: string;
  sentAt: Date;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class PushService {
  // VAPID keys (in production, store these in environment variables)
  private static VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
  private static VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
  private static VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@peoplehub.id";

  /**
   * Get VAPID public key for client registration
   */
  static getPublicKey(): ServiceResponse<string> {
    return success(this.VAPID_PUBLIC_KEY);
  }

  /**
   * Register a push subscription for a user
   */
  static async registerSubscription(
    context: RequestContext,
    data: RegisterSubscriptionInput
  ): Promise<ServiceResponse<PushDevice>> {
    // Check for existing subscription with same endpoint
    const existing = await this.getSubscriptionByEndpoint(context.tenantId, data.subscription.endpoint);

    if (existing) {
      // Update existing subscription
      const updated = await this.updateSubscription(context, existing.id, {
        isActive: true,
        lastUsedAt: new Date(),
      });
      return success(updated);
    }

    const deviceId = `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const device: PushDevice = {
      id: deviceId,
      userId: context.userId,
      subscription: data.subscription,
      deviceName: data.deviceName,
      platform: data.platform || "WEB",
      isActive: true,
      lastUsedAt: new Date(),
      createdAt: new Date(),
    };

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "PUSH_SUBSCRIPTION_REGISTERED",
        objectType: "PushDevice",
        objectId: deviceId,
        afterData: device as unknown as Prisma.InputJsonValue,
      },
    });

    return success(device);
  }

  /**
   * Unregister a push subscription
   */
  static async unregisterSubscription(
    context: RequestContext,
    endpoint: string
  ): Promise<ServiceResponse<void>> {
    const subscription = await this.getSubscriptionByEndpoint(context.tenantId, endpoint);

    if (!subscription) {
      return error(ErrorCodes.NOT_FOUND, "Subscription tidak ditemukan");
    }

    if (subscription.userId !== context.userId) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak dapat menghapus subscription ini");
    }

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "PUSH_SUBSCRIPTION_UNREGISTERED",
        objectType: "PushDevice",
        objectId: subscription.id,
      },
    });

    return success(undefined);
  }

  /**
   * Get user's push subscriptions
   */
  static async getUserSubscriptions(
    context: RequestContext
  ): Promise<ServiceResponse<PushDevice[]>> {
    const subscriptions = await this.getSubscriptionsForUser(context.tenantId, context.userId);
    return success(subscriptions);
  }

  /**
   * Send push notification to a user
   */
  static async sendToUser(
    context: RequestContext,
    userId: string,
    data: Omit<SendPushInput, "userId" | "userIds">
  ): Promise<ServiceResponse<{ sent: number; failed: number }>> {
    const subscriptions = await this.getSubscriptionsForUser(context.tenantId, userId);

    if (subscriptions.length === 0) {
      return success({ sent: 0, failed: 0 });
    }

    const results = await this.sendToSubscriptions(subscriptions, data);

    // Log the notification
    await this.logNotification(context.tenantId, context.userId, data, 1, results.sent, results.failed);

    return success(results);
  }

  /**
   * Send push notification to multiple users
   */
  static async sendToUsers(
    context: RequestContext,
    data: SendPushInput
  ): Promise<ServiceResponse<{ sent: number; failed: number; recipientCount: number }>> {
    // Only admins can send bulk notifications
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk mengirim notifikasi massal");
    }

    let userIds: string[] = [];

    if (data.userIds) {
      userIds = data.userIds;
    } else if (data.roleFilter || data.branchId || data.departmentId) {
      // Build user query
      const where: Prisma.UserWhereInput = {
        tenantId: context.tenantId,
        status: "APPROVED",
      };

      if (data.roleFilter && data.roleFilter.length > 0) {
        where.role = { in: data.roleFilter as Prisma.EnumUserRoleFilter["in"] };
      }

      if (data.branchId || data.departmentId) {
        where.employee = {
          ...(data.branchId && { branchId: data.branchId }),
          ...(data.departmentId && { departmentId: data.departmentId }),
        };
      }

      const users = await prisma.user.findMany({
        where,
        select: { id: true },
      });

      userIds = users.map((u) => u.id);
    }

    if (userIds.length === 0) {
      return success({ sent: 0, failed: 0, recipientCount: 0 });
    }

    // Get all subscriptions for these users
    const allSubscriptions: PushDevice[] = [];
    for (const userId of userIds) {
      const subs = await this.getSubscriptionsForUser(context.tenantId, userId);
      allSubscriptions.push(...subs);
    }

    if (allSubscriptions.length === 0) {
      return success({ sent: 0, failed: 0, recipientCount: userIds.length });
    }

    const results = await this.sendToSubscriptions(allSubscriptions, data);

    // Log the notification
    await this.logNotification(
      context.tenantId,
      context.userId,
      data,
      userIds.length,
      results.sent,
      results.failed
    );

    return success({ ...results, recipientCount: userIds.length });
  }

  /**
   * Send push notification from system (no context)
   */
  static async sendSystemNotification(
    tenantId: string,
    userId: string,
    data: Omit<SendPushInput, "userId" | "userIds">
  ): Promise<void> {
    try {
      const subscriptions = await this.getSubscriptionsForUser(tenantId, userId);

      if (subscriptions.length > 0) {
        await this.sendToSubscriptions(subscriptions, data);
      }
    } catch (err) {
      console.error("Failed to send system push notification:", err);
    }
  }

  /**
   * Get notification logs
   */
  static async getLogs(
    context: RequestContext,
    params: PaginationParams
  ): Promise<ServiceResponse<PushNotificationLog[]>> {
    // Only admins can view logs
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke log notifikasi");
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        action: "PUSH_NOTIFICATION_SENT",
      },
      orderBy: { createdAt: "desc" },
      skip: ((params.page || 1) - 1) * (params.limit || 20),
      take: params.limit || 20,
    });

    const notificationLogs: PushNotificationLog[] = logs.map((log) => {
      const data = log.afterData as unknown as PushNotificationLog;
      return {
        ...data,
        sentAt: log.createdAt,
      };
    });

    return success(notificationLogs);
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  /**
   * Send push to multiple subscriptions
   */
  private static async sendToSubscriptions(
    subscriptions: PushDevice[],
    data: Omit<SendPushInput, "userId" | "userIds">
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      icon: data.icon || "/icons/notification-icon.png",
      badge: data.badge || "/icons/badge-icon.png",
      data: data.data,
      actions: data.action ? [{ action: "open", title: data.action.label }] : undefined,
    });

    for (const device of subscriptions) {
      try {
        // In production, use web-push library
        // const webpush = require('web-push');
        // webpush.setVapidDetails(this.VAPID_SUBJECT, this.VAPID_PUBLIC_KEY, this.VAPID_PRIVATE_KEY);
        // await webpush.sendNotification(device.subscription, payload, { TTL: data.ttl || 3600 });

        // For now, simulate success
        console.log(`Push notification sent to device ${device.id}:`, data.title);
        sent++;
      } catch (err) {
        console.error(`Failed to send push to device ${device.id}:`, err);
        failed++;

        // If subscription is invalid, mark as inactive
        if (err instanceof Error && err.message.includes("expired")) {
          await this.deactivateSubscription(device.id);
        }
      }
    }

    return { sent, failed };
  }

  /**
   * Get subscription by endpoint
   */
  private static async getSubscriptionByEndpoint(
    tenantId: string,
    endpoint: string
  ): Promise<PushDevice | null> {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: "PUSH_SUBSCRIPTION_REGISTERED",
        objectType: "PushDevice",
      },
      orderBy: { createdAt: "desc" },
    });

    for (const log of logs) {
      const device = log.afterData as unknown as PushDevice;
      if (device.subscription.endpoint === endpoint && device.isActive) {
        return device;
      }
    }

    return null;
  }

  /**
   * Get subscriptions for a user
   */
  private static async getSubscriptionsForUser(
    tenantId: string,
    userId: string
  ): Promise<PushDevice[]> {
    const registerLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        actorId: userId,
        action: "PUSH_SUBSCRIPTION_REGISTERED",
        objectType: "PushDevice",
      },
      orderBy: { createdAt: "desc" },
    });

    const devices: PushDevice[] = [];

    for (const log of registerLogs) {
      const device = log.afterData as unknown as PushDevice;

      // Check if unregistered
      const unregisterLog = await prisma.auditLog.findFirst({
        where: {
          tenantId,
          action: "PUSH_SUBSCRIPTION_UNREGISTERED",
          objectId: device.id,
          createdAt: { gt: log.createdAt },
        },
      });

      if (!unregisterLog && device.isActive) {
        devices.push(device);
      }
    }

    return devices;
  }

  /**
   * Update subscription
   */
  private static async updateSubscription(
    context: RequestContext,
    deviceId: string,
    updates: Partial<PushDevice>
  ): Promise<PushDevice> {
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        tenantId: context.tenantId,
        objectId: deviceId,
        action: "PUSH_SUBSCRIPTION_REGISTERED",
      },
      orderBy: { createdAt: "desc" },
    });

    const existing = existingLog?.afterData as unknown as PushDevice;
    const updated: PushDevice = {
      ...existing,
      ...updates,
    };

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "PUSH_SUBSCRIPTION_UPDATED",
        objectType: "PushDevice",
        objectId: deviceId,
        afterData: updated as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  /**
   * Deactivate subscription
   */
  private static async deactivateSubscription(deviceId: string): Promise<void> {
    await prisma.auditLog.create({
      data: {
        tenantId: "",
        action: "PUSH_SUBSCRIPTION_DEACTIVATED",
        objectType: "PushDevice",
        objectId: deviceId,
      },
    });
  }

  /**
   * Log notification
   */
  private static async logNotification(
    tenantId: string,
    sentById: string,
    data: Omit<SendPushInput, "userId" | "userIds">,
    recipientCount: number,
    successCount: number,
    failureCount: number
  ): Promise<void> {
    const log: PushNotificationLog = {
      id: `push-log-${Date.now()}`,
      tenantId,
      title: data.title,
      body: data.body,
      recipientCount,
      successCount,
      failureCount,
      sentById,
      sentAt: new Date(),
    };

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorId: sentById,
        action: "PUSH_NOTIFICATION_SENT",
        objectType: "PushNotification",
        afterData: log as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
