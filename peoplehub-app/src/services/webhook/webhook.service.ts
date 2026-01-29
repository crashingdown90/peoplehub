// @ai:cl - Webhook Service with CRUD, delivery, and retry mechanism
import { prisma } from "@/lib/db";
import { RequestContext } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes, PaginationParams } from "../types";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

// ==========================================
// TYPES
// ==========================================

export const WEBHOOK_EVENTS = {
  // Attendance events
  "attendance.clockin": "Clock in recorded",
  "attendance.clockout": "Clock out recorded",
  "attendance.late": "Employee arrived late",
  "attendance.absent": "Employee absent",
  "attendance.correction.requested": "Attendance correction requested",
  "attendance.correction.approved": "Attendance correction approved",
  "attendance.correction.rejected": "Attendance correction rejected",

  // Leave events
  "leave.requested": "Leave request submitted",
  "leave.approved.manager": "Leave approved by manager",
  "leave.approved.hrd": "Leave approved by HRD",
  "leave.approved": "Leave fully approved",
  "leave.rejected": "Leave request rejected",
  "leave.cancelled": "Leave request cancelled",

  // Employee events
  "employee.created": "New employee created",
  "employee.updated": "Employee data updated",
  "employee.terminated": "Employee terminated",
  "employee.onboarded": "Employee onboarding completed",

  // Payroll events
  "payslip.generated": "Payslip generated",
  "payslip.published": "Payslip published",

  // Ticket events
  "ticket.created": "Support ticket created",
  "ticket.assigned": "Support ticket assigned",
  "ticket.resolved": "Support ticket resolved",
  "ticket.closed": "Support ticket closed",

  // Travel & Reimburse
  "travel.requested": "Travel request submitted",
  "travel.approved": "Travel request approved",
  "travel.rejected": "Travel request rejected",
  "reimburse.requested": "Reimbursement requested",
  "reimburse.approved": "Reimbursement approved",
  "reimburse.rejected": "Reimbursement rejected",
  "reimburse.paid": "Reimbursement paid",

  // KPI events
  "kpi.target.set": "KPI target set",
  "kpi.target.updated": "KPI actual value updated",

  // Announcement events
  "announcement.published": "Announcement published",
} as const;

export type WebhookEvent = keyof typeof WEBHOOK_EVENTS;

export interface CreateWebhookInput {
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  headers?: Record<string, string>;
  retryCount?: number;
}

export interface UpdateWebhookInput {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  secret?: string;
  headers?: Record<string, string>;
  retryCount?: number;
  isActive?: boolean;
}

export interface WebhookFilter extends PaginationParams {
  isActive?: boolean;
  event?: string;
}

export interface WebhookPayload<T = unknown> {
  event: WebhookEvent;
  timestamp: string;
  tenantId: string;
  data: T;
}

type WebhookWithLogs = Prisma.WebhookGetPayload<{
  include: { logs: { take: 5; orderBy: { sentAt: "desc" } } };
}>;

// ==========================================
// SERVICE CLASS
// ==========================================

export class WebhookService {
  /**
   * Create a new webhook
   */
  static async create(
    context: RequestContext,
    data: CreateWebhookInput
  ): Promise<ServiceResponse<WebhookWithLogs>> {
    // Only admins can create webhooks
    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya IT Admin yang dapat membuat webhook");
    }

    // Validate URL
    try {
      new URL(data.url);
    } catch {
      return error(ErrorCodes.VALIDATION_ERROR, "URL tidak valid");
    }

    // Validate events
    const validEvents = Object.keys(WEBHOOK_EVENTS) as WebhookEvent[];
    const invalidEvents = data.events.filter((e) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return error(
        ErrorCodes.VALIDATION_ERROR,
        `Event tidak valid: ${invalidEvents.join(", ")}`
      );
    }

    // Generate secret if not provided
    const secret = data.secret || crypto.randomBytes(32).toString("hex");

    const webhook = await prisma.webhook.create({
      data: {
        tenantId: context.tenantId,
        name: data.name,
        url: data.url,
        events: data.events,
        secret,
        headers: data.headers as Prisma.InputJsonValue,
        retryCount: data.retryCount || 3,
        createdById: context.userId,
      },
      include: { logs: { take: 5, orderBy: { sentAt: "desc" } } },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "WEBHOOK_CREATED",
        objectType: "Webhook",
        objectId: webhook.id,
        afterData: JSON.parse(JSON.stringify({ name: webhook.name, url: webhook.url, events: webhook.events })),
      },
    });

    return success(webhook);
  }

  /**
   * Get webhooks with filters
   */
  static async getWebhooks(
    context: RequestContext,
    filter: WebhookFilter
  ): Promise<ServiceResponse<WebhookWithLogs[]>> {
    // Only admins can view webhooks
    if (!["IT_OPS", "SUPER_ADMIN", "HRD"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke webhook");
    }

    const { page = 1, limit = 20, isActive, event } = filter;

    const where: Prisma.WebhookWhereInput = {
      tenantId: context.tenantId,
    };

    if (isActive !== undefined) where.isActive = isActive;
    if (event) where.events = { has: event };

    const [webhooks, total] = await Promise.all([
      prisma.webhook.findMany({
        where,
        include: { logs: { take: 5, orderBy: { sentAt: "desc" } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.webhook.count({ where }),
    ]);

    return success(webhooks, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  /**
   * Get webhook by ID
   */
  static async getById(
    context: RequestContext,
    webhookId: string
  ): Promise<ServiceResponse<WebhookWithLogs>> {
    // Only admins can view webhooks
    if (!["IT_OPS", "SUPER_ADMIN", "HRD"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke webhook");
    }

    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        tenantId: context.tenantId,
      },
      include: { logs: { take: 50, orderBy: { sentAt: "desc" } } },
    });

    if (!webhook) {
      return error(ErrorCodes.NOT_FOUND, "Webhook tidak ditemukan");
    }

    return success(webhook);
  }

  /**
   * Update webhook
   */
  static async update(
    context: RequestContext,
    webhookId: string,
    data: UpdateWebhookInput
  ): Promise<ServiceResponse<WebhookWithLogs>> {
    // Only admins can update webhooks
    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya IT Admin yang dapat mengubah webhook");
    }

    const existing = await prisma.webhook.findFirst({
      where: { id: webhookId, tenantId: context.tenantId },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Webhook tidak ditemukan");
    }

    // Validate URL if provided
    if (data.url) {
      try {
        new URL(data.url);
      } catch {
        return error(ErrorCodes.VALIDATION_ERROR, "URL tidak valid");
      }
    }

    // Validate events if provided
    if (data.events) {
      const validEvents = Object.keys(WEBHOOK_EVENTS) as WebhookEvent[];
      const invalidEvents = data.events.filter((e) => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        return error(
          ErrorCodes.VALIDATION_ERROR,
          `Event tidak valid: ${invalidEvents.join(", ")}`
        );
      }
    }

    const webhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.url && { url: data.url }),
        ...(data.events && { events: data.events }),
        ...(data.secret && { secret: data.secret }),
        ...(data.headers && { headers: data.headers as Prisma.InputJsonValue }),
        ...(data.retryCount !== undefined && { retryCount: data.retryCount }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
      include: { logs: { take: 5, orderBy: { sentAt: "desc" } } },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "WEBHOOK_UPDATED",
        objectType: "Webhook",
        objectId: webhook.id,
        beforeData: { name: existing.name, url: existing.url, isActive: existing.isActive },
        afterData: JSON.parse(JSON.stringify({ name: webhook.name, url: webhook.url, isActive: webhook.isActive })),
      },
    });

    return success(webhook);
  }

  /**
   * Delete webhook
   */
  static async delete(
    context: RequestContext,
    webhookId: string
  ): Promise<ServiceResponse<void>> {
    // Only admins can delete webhooks
    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya IT Admin yang dapat menghapus webhook");
    }

    const existing = await prisma.webhook.findFirst({
      where: { id: webhookId, tenantId: context.tenantId },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Webhook tidak ditemukan");
    }

    // Delete logs first, then webhook
    await prisma.$transaction([
      prisma.webhookLog.deleteMany({ where: { webhookId } }),
      prisma.webhook.delete({ where: { id: webhookId } }),
    ]);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "WEBHOOK_DELETED",
        objectType: "Webhook",
        objectId: webhookId,
        beforeData: { name: existing.name, url: existing.url },
      },
    });

    return success(undefined);
  }

  /**
   * Test webhook by sending a test payload
   */
  static async test(
    context: RequestContext,
    webhookId: string
  ): Promise<ServiceResponse<{ success: boolean; status: number; response: string }>> {
    // Only admins can test webhooks
    if (!["IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya IT Admin yang dapat menguji webhook");
    }

    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, tenantId: context.tenantId },
    });

    if (!webhook) {
      return error(ErrorCodes.NOT_FOUND, "Webhook tidak ditemukan");
    }

    const testPayload: WebhookPayload = {
      event: "attendance.clockin" as WebhookEvent,
      timestamp: new Date().toISOString(),
      tenantId: context.tenantId,
      data: {
        test: true,
        message: "This is a test webhook payload from PeopleHub",
        webhookId: webhook.id,
      },
    };

    try {
      const result = await this.sendWebhook(webhook, testPayload);
      return success(result);
    } catch (err) {
      return error(
        ErrorCodes.INTERNAL_ERROR,
        `Gagal mengirim webhook: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get webhook logs
   */
  static async getLogs(
    context: RequestContext,
    webhookId: string,
    params: PaginationParams
  ): Promise<ServiceResponse<Prisma.WebhookLogGetPayload<{}>[]>> {
    // Only admins can view logs
    if (!["IT_OPS", "SUPER_ADMIN", "HRD"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke webhook logs");
    }

    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, tenantId: context.tenantId },
    });

    if (!webhook) {
      return error(ErrorCodes.NOT_FOUND, "Webhook tidak ditemukan");
    }

    const { page = 1, limit = 50 } = params;

    const [logs, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where: { webhookId },
        orderBy: { sentAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.webhookLog.count({ where: { webhookId } }),
    ]);

    return success(logs, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  /**
   * Get all available webhook events
   */
  static getAvailableEvents(): ServiceResponse<
    Array<{ event: string; description: string }>
  > {
    const events = Object.entries(WEBHOOK_EVENTS).map(([event, description]) => ({
      event,
      description,
    }));
    return success(events);
  }

  // ==========================================
  // DELIVERY METHODS
  // ==========================================

  /**
   * Trigger webhooks for an event
   */
  static async trigger<T>(
    tenantId: string,
    event: WebhookEvent,
    data: T
  ): Promise<void> {
    // Find all active webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload<T> = {
      event,
      timestamp: new Date().toISOString(),
      tenantId,
      data,
    };

    // Send to all webhooks in parallel (don't await - fire and forget)
    for (const webhook of webhooks) {
      this.deliverWithRetry(webhook, payload).catch((err) => {
        console.error(`Webhook delivery failed for ${webhook.id}:`, err);
      });
    }
  }

  /**
   * Deliver webhook with retry mechanism
   */
  private static async deliverWithRetry<T>(
    webhook: Prisma.WebhookGetPayload<{}>,
    payload: WebhookPayload<T>,
    attempt = 1
  ): Promise<void> {
    try {
      const result = await this.sendWebhook(webhook, payload);

      // Log the attempt
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event: payload.event,
          payload: payload as unknown as Prisma.InputJsonValue,
          status: result.status,
          response: result.response?.substring(0, 1000), // Limit response size
          attempts: attempt,
        },
      });

      // If failed (non-2xx status), retry
      if (result.status < 200 || result.status >= 300) {
        if (attempt < webhook.retryCount) {
          const delay = this.getRetryDelay(attempt);
          await this.sleep(delay);
          await this.deliverWithRetry(webhook, payload, attempt + 1);
        }
      }
    } catch (err) {
      // Log error
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event: payload.event,
          payload: payload as unknown as Prisma.InputJsonValue,
          status: 0,
          response: err instanceof Error ? err.message : "Unknown error",
          attempts: attempt,
        },
      });

      // Retry on network errors
      if (attempt < webhook.retryCount) {
        const delay = this.getRetryDelay(attempt);
        await this.sleep(delay);
        await this.deliverWithRetry(webhook, payload, attempt + 1);
      }
    }
  }

  /**
   * Send webhook request
   */
  private static async sendWebhook<T>(
    webhook: Prisma.WebhookGetPayload<{}>,
    payload: WebhookPayload<T>
  ): Promise<{ success: boolean; status: number; response: string }> {
    const body = JSON.stringify(payload);
    const signature = this.generateSignature(body, webhook.secret || "");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-PeopleHub-Signature": signature,
      "X-PeopleHub-Event": payload.event,
      "X-PeopleHub-Timestamp": payload.timestamp,
      ...(webhook.headers as Record<string, string> || {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      const responseText = await response.text();

      return {
        success: response.ok,
        status: response.status,
        response: responseText,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private static generateSignature(payload: string, secret: string): string {
    if (!secret) return "";
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    return `sha256=${hmac.digest("hex")}`;
  }

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expected = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  /**
   * Get retry delay based on attempt number (exponential backoff)
   */
  private static getRetryDelay(attempt: number): number {
    // 1st retry: 1min, 2nd: 5min, 3rd: 15min
    const delays = [60000, 300000, 900000];
    return delays[attempt - 1] || delays[delays.length - 1];
  }

  /**
   * Sleep helper
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get webhook statistics
   */
  static async getStats(
    context: RequestContext
  ): Promise<ServiceResponse<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    recentLogs: Prisma.WebhookLogGetPayload<{}>[];
  }>> {
    // Only admins can view stats
    if (!["IT_OPS", "SUPER_ADMIN", "HRD"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke statistik webhook");
    }

    const webhooks = await prisma.webhook.findMany({
      where: { tenantId: context.tenantId },
      select: { id: true, isActive: true },
    });

    const webhookIds = webhooks.map((w) => w.id);

    const [totalDeliveries, successfulDeliveries, recentLogs] = await Promise.all([
      prisma.webhookLog.count({ where: { webhookId: { in: webhookIds } } }),
      prisma.webhookLog.count({
        where: {
          webhookId: { in: webhookIds },
          status: { gte: 200, lt: 300 },
        },
      }),
      prisma.webhookLog.findMany({
        where: { webhookId: { in: webhookIds } },
        orderBy: { sentAt: "desc" },
        take: 20,
      }),
    ]);

    return success({
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter((w) => w.isActive).length,
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries: totalDeliveries - successfulDeliveries,
      recentLogs,
    });
  }
}
