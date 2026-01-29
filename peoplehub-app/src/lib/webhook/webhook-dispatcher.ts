// @ai:cl - Webhook dispatcher for event-driven integrations
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

// ==========================================
// TYPES
// ==========================================

export type WebhookEventType =
  // Attendance events
  | "attendance.clockin"
  | "attendance.clockout"
  | "attendance.correction_requested"
  | "attendance.correction_approved"
  | "attendance.correction_rejected"
  // Leave events
  | "leave.requested"
  | "leave.approved"
  | "leave.rejected"
  | "leave.cancelled"
  // Payroll events
  | "payroll.generated"
  | "payroll.published"
  // Employee events
  | "employee.created"
  | "employee.updated"
  | "employee.activated"
  | "employee.deactivated"
  // Approval events
  | "approval.pending"
  | "approval.completed"
  // Travel events
  | "travel.requested"
  | "travel.approved"
  | "travel.rejected"
  // Reimburse events
  | "reimburse.requested"
  | "reimburse.approved"
  | "reimburse.rejected";

export interface WebhookPayload {
  event: WebhookEventType;
  tenantId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookDispatchResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  attempts: number;
}

interface WebhookConfig {
  id: string;
  url: string;
  secret: string | null;
  headers: Record<string, string> | null;
  retryCount: number;
}

// ==========================================
// WEBHOOK DISPATCHER CLASS
// ==========================================

export class WebhookDispatcher {
  private static queue: Map<string, WebhookPayload[]> = new Map();
  private static isProcessing = false;
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private static readonly RETRY_DELAYS = [1000, 5000, 30000]; // 1s, 5s, 30s

  /**
   * Dispatch an event to all matching webhooks
   */
  static async dispatch(
    tenantId: string,
    event: WebhookEventType,
    data: Record<string, unknown>
  ): Promise<WebhookDispatchResult[]> {
    const payload: WebhookPayload = {
      event,
      tenantId,
      timestamp: new Date().toISOString(),
      data,
    };

    // Find matching webhooks
    const webhooks = await this.findMatchingWebhooks(tenantId, event);

    if (webhooks.length === 0) {
      return [];
    }

    // Dispatch to all webhooks
    const results = await Promise.all(
      webhooks.map((webhook) => this.sendToWebhook(webhook, payload))
    );

    return results;
  }

  /**
   * Queue an event for later processing (fire-and-forget)
   */
  static queueEvent(
    tenantId: string,
    event: WebhookEventType,
    data: Record<string, unknown>
  ): void {
    const payload: WebhookPayload = {
      event,
      tenantId,
      timestamp: new Date().toISOString(),
      data,
    };

    const key = tenantId;
    const existing = this.queue.get(key) || [];
    existing.push(payload);
    this.queue.set(key, existing);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the queued events
   */
  private static async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      for (const [tenantId, payloads] of this.queue.entries()) {
        for (const payload of payloads) {
          const webhooks = await this.findMatchingWebhooks(tenantId, payload.event);
          await Promise.all(
            webhooks.map((webhook) => this.sendToWebhook(webhook, payload))
          );
        }
        this.queue.delete(tenantId);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Find webhooks that match the event
   */
  private static async findMatchingWebhooks(
    tenantId: string,
    event: WebhookEventType
  ): Promise<WebhookConfig[]> {
    // Get event prefix (e.g., "attendance" from "attendance.clockin")
    const eventPrefix = event.split(".")[0];

    const webhooks = await prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      select: {
        id: true,
        url: true,
        secret: true,
        headers: true,
        retryCount: true,
        events: true,
      },
    });

    // Filter webhooks that have matching events
    return webhooks.filter((webhook) => {
      return webhook.events.some(
        (e) =>
          e === event || // Exact match
          e === `${eventPrefix}.*` || // Wildcard match (e.g., "attendance.*")
          e === "*" // All events
      );
    }).map((w) => ({
      id: w.id,
      url: w.url,
      secret: w.secret,
      headers: w.headers as Record<string, string> | null,
      retryCount: w.retryCount,
    }));
  }

  /**
   * Send payload to a specific webhook with retry
   */
  private static async sendToWebhook(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ): Promise<WebhookDispatchResult> {
    const maxAttempts = Math.min(webhook.retryCount, 3);
    let lastError: string | undefined;
    let statusCode: number | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.sendRequest(webhook, payload);

        // Log success
        await this.logAttempt(webhook.id, payload.event, payload, result.status, null, attempt);

        return {
          webhookId: webhook.id,
          success: true,
          statusCode: result.status,
          attempts: attempt,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Unknown error";
        statusCode = 0;

        // Log failed attempt
        await this.logAttempt(webhook.id, payload.event, payload, 0, lastError, attempt);

        // Wait before retry (except for last attempt)
        if (attempt < maxAttempts) {
          await this.delay(this.RETRY_DELAYS[attempt - 1] || 1000);
        }
      }
    }

    return {
      webhookId: webhook.id,
      success: false,
      statusCode,
      error: lastError,
      attempts: maxAttempts,
    };
  }

  /**
   * Send HTTP request to webhook URL
   */
  private static async sendRequest(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ): Promise<Response> {
    const body = JSON.stringify(payload);
    const signature = this.generateSignature(body, webhook.secret);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": payload.event,
      "X-Webhook-Timestamp": payload.timestamp,
      "X-Webhook-Signature": signature,
      ...(webhook.headers || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT);

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generate HMAC signature for payload
   */
  private static generateSignature(body: string, secret: string | null): string {
    if (!secret) {
      return "unsigned";
    }

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(body);
    return `sha256=${hmac.digest("hex")}`;
  }

  /**
   * Verify incoming webhook signature (for receiving webhooks)
   */
  static verifySignature(body: string, signature: string, secret: string): boolean {
    const expected = this.generateSignature(body, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  /**
   * Log webhook attempt to database
   */
  private static async logAttempt(
    webhookId: string,
    event: string,
    payload: WebhookPayload,
    status: number,
    response: string | null,
    attempt: number
  ): Promise<void> {
    try {
      await prisma.webhookLog.create({
        data: {
          webhookId,
          event,
          payload: payload as unknown as Prisma.InputJsonValue,
          status,
          response,
          attempts: attempt,
        },
      });
    } catch (err) {
      console.error("Failed to log webhook attempt:", err);
    }
  }

  /**
   * Delay helper for retries
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================
  // CONVENIENCE METHODS FOR SPECIFIC EVENTS
  // ==========================================

  /**
   * Dispatch attendance clock in event
   */
  static async onAttendanceClockIn(
    tenantId: string,
    data: { employeeId: string; clockIn: string; workMode: string }
  ): Promise<WebhookDispatchResult[]> {
    return this.dispatch(tenantId, "attendance.clockin", data);
  }

  /**
   * Dispatch attendance clock out event
   */
  static async onAttendanceClockOut(
    tenantId: string,
    data: { employeeId: string; clockOut: string; workHours: number }
  ): Promise<WebhookDispatchResult[]> {
    return this.dispatch(tenantId, "attendance.clockout", data);
  }

  /**
   * Dispatch leave requested event
   */
  static async onLeaveRequested(
    tenantId: string,
    data: { leaveRequestId: string; employeeId: string; leaveType: string; days: number }
  ): Promise<WebhookDispatchResult[]> {
    return this.dispatch(tenantId, "leave.requested", data);
  }

  /**
   * Dispatch leave approved event
   */
  static async onLeaveApproved(
    tenantId: string,
    data: { leaveRequestId: string; employeeId: string; approvedBy: string }
  ): Promise<WebhookDispatchResult[]> {
    return this.dispatch(tenantId, "leave.approved", data);
  }

  /**
   * Dispatch leave rejected event
   */
  static async onLeaveRejected(
    tenantId: string,
    data: { leaveRequestId: string; employeeId: string; rejectedBy: string; reason: string }
  ): Promise<WebhookDispatchResult[]> {
    return this.dispatch(tenantId, "leave.rejected", data);
  }

  /**
   * Dispatch payroll published event
   */
  static async onPayrollPublished(
    tenantId: string,
    data: { period: string; employeeCount: number; totalAmount: number }
  ): Promise<WebhookDispatchResult[]> {
    return this.dispatch(tenantId, "payroll.published", data);
  }

  /**
   * Dispatch employee created event
   */
  static async onEmployeeCreated(
    tenantId: string,
    data: { employeeId: string; fullName: string; departmentId: string }
  ): Promise<WebhookDispatchResult[]> {
    return this.dispatch(tenantId, "employee.created", data);
  }
}
