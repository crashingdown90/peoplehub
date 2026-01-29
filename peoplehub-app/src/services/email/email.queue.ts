// @ai:cl - Email queue with retry mechanism
import { prisma } from "@/lib/db";
import { EmailService, SendEmailParams, EmailRecipient } from "./email.service";

// ==========================================
// TYPES
// ==========================================

export interface QueuedEmail {
  id: string;
  to: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  templateName?: string;
  templateVars?: Record<string, string>;
  priority: "HIGH" | "NORMAL" | "LOW";
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
}

export interface QueueEmailParams {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  templateName?: string;
  templateVars?: Record<string, string>;
  priority?: "HIGH" | "NORMAL" | "LOW";
  scheduledAt?: Date;
}

// ==========================================
// IN-MEMORY QUEUE (for development)
// ==========================================

// In production, use Redis or a proper queue system
const emailQueue: Map<string, QueuedEmail> = new Map();

// ==========================================
// EMAIL QUEUE SERVICE
// ==========================================

export class EmailQueueService {
  private static isProcessing = false;
  private static processInterval: NodeJS.Timeout | null = null;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RETRY_DELAYS = [
    60 * 1000, // 1 minute
    5 * 60 * 1000, // 5 minutes
    15 * 60 * 1000, // 15 minutes
  ];

  /**
   * Add email to queue
   */
  static async queue(params: QueueEmailParams): Promise<string> {
    const id = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queuedEmail: QueuedEmail = {
      id,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      templateName: params.templateName,
      templateVars: params.templateVars,
      priority: params.priority || "NORMAL",
      status: "PENDING",
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      scheduledAt: params.scheduledAt,
      createdAt: new Date(),
    };

    emailQueue.set(id, queuedEmail);

    // Log queue entry
    await this.logQueueEntry(queuedEmail, "QUEUED");

    // Start processor if not running
    this.startProcessor();

    return id;
  }

  /**
   * Queue email using template
   */
  static async queueTemplate(
    templateName: string,
    to: EmailRecipient | EmailRecipient[],
    variables: Record<string, string>,
    options?: { priority?: "HIGH" | "NORMAL" | "LOW"; scheduledAt?: Date }
  ): Promise<string> {
    const template = await EmailService.getTemplate(templateName);

    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    // Replace variables in template
    let html = template.html;
    let subject = template.subject;
    let text = template.text || "";

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      html = html.replace(regex, value);
      subject = subject.replace(regex, value);
      text = text.replace(regex, value);
    }

    return this.queue({
      to,
      subject,
      html,
      text,
      templateName,
      templateVars: variables,
      ...options,
    });
  }

  /**
   * Get queue status
   */
  static getQueueStatus(): {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    total: number;
  } {
    const emails = Array.from(emailQueue.values());

    return {
      pending: emails.filter((e) => e.status === "PENDING").length,
      processing: emails.filter((e) => e.status === "PROCESSING").length,
      sent: emails.filter((e) => e.status === "SENT").length,
      failed: emails.filter((e) => e.status === "FAILED").length,
      total: emails.length,
    };
  }

  /**
   * Get email by ID
   */
  static getEmail(id: string): QueuedEmail | undefined {
    return emailQueue.get(id);
  }

  /**
   * Cancel queued email
   */
  static cancel(id: string): boolean {
    const email = emailQueue.get(id);

    if (!email || email.status !== "PENDING") {
      return false;
    }

    emailQueue.delete(id);
    return true;
  }

  /**
   * Retry failed email
   */
  static async retry(id: string): Promise<boolean> {
    const email = emailQueue.get(id);

    if (!email || email.status !== "FAILED") {
      return false;
    }

    email.status = "PENDING";
    email.attempts = 0;
    email.lastError = undefined;

    return true;
  }

  /**
   * Start queue processor
   */
  static startProcessor(): void {
    if (this.processInterval) return;

    // Process queue every 5 seconds
    this.processInterval = setInterval(() => {
      this.processQueue();
    }, 5000);

    // Process immediately
    this.processQueue();
  }

  /**
   * Stop queue processor
   */
  static stopProcessor(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Process queue
   */
  private static async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      const emails = Array.from(emailQueue.values())
        .filter((e) => e.status === "PENDING")
        .filter((e) => !e.scheduledAt || e.scheduledAt <= now)
        .sort((a, b) => {
          // Sort by priority, then by createdAt
          const priorityOrder = { HIGH: 0, NORMAL: 1, LOW: 2 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

      // Process up to 10 emails at a time
      const batch = emails.slice(0, 10);

      for (const email of batch) {
        await this.processEmail(email);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process single email
   */
  private static async processEmail(email: QueuedEmail): Promise<void> {
    email.status = "PROCESSING";
    email.attempts++;

    try {
      const result = await EmailService.send({
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      if (result.success) {
        email.status = "SENT";
        email.sentAt = new Date();
        await this.logQueueEntry(email, "SENT");
      } else {
        throw new Error(result.error?.message || "Failed to send email");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      email.lastError = errorMessage;

      if (email.attempts >= email.maxAttempts) {
        email.status = "FAILED";
        await this.logQueueEntry(email, "FAILED", errorMessage);
      } else {
        // Schedule retry
        email.status = "PENDING";
        email.scheduledAt = new Date(Date.now() + this.RETRY_DELAYS[email.attempts - 1]);
        await this.logQueueEntry(email, "RETRY_SCHEDULED", errorMessage);
      }
    }
  }

  /**
   * Log queue entry
   */
  private static async logQueueEntry(
    email: QueuedEmail,
    action: string,
    error?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: "system",
          action: `EMAIL_QUEUE_${action}`,
          objectType: "EmailQueue",
          objectId: email.id,
          afterData: JSON.parse(JSON.stringify({
            to: email.to.map((r) => r.email),
            subject: email.subject,
            templateName: email.templateName,
            priority: email.priority,
            attempts: email.attempts,
            status: email.status,
            error,
          })),
        },
      });
    } catch {
      // Silently fail logging
    }
  }

  /**
   * Clean up old sent/failed emails (older than 7 days)
   */
  static cleanup(): number {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let removed = 0;

    for (const [id, email] of emailQueue.entries()) {
      if (
        (email.status === "SENT" || email.status === "FAILED") &&
        email.createdAt < cutoff
      ) {
        emailQueue.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get all queued emails (for admin view)
   */
  static getAll(filter?: {
    status?: QueuedEmail["status"];
    limit?: number;
    offset?: number;
  }): QueuedEmail[] {
    let emails = Array.from(emailQueue.values());

    if (filter?.status) {
      emails = emails.filter((e) => e.status === filter.status);
    }

    emails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (filter?.offset) {
      emails = emails.slice(filter.offset);
    }

    if (filter?.limit) {
      emails = emails.slice(0, filter.limit);
    }

    return emails;
  }
}

// Auto-start processor in non-edge environments
if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
  // Delay start to allow for initialization
  setTimeout(() => {
    EmailQueueService.startProcessor();
  }, 1000);
}
