// @ai:cl - Email Service with SMTP/SendGrid support
import { prisma } from "@/lib/db";
import { ServiceResponse, success, error, ErrorCodes } from "../types";

// ==========================================
// TYPES
// ==========================================

export interface EmailConfig {
  provider: "smtp" | "sendgrid" | "resend";
  from: string;
  replyTo?: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailParams {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: string;
  tags?: string[];
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

// ==========================================
// EMAIL PROVIDERS
// ==========================================

interface EmailProvider {
  send(params: SendEmailParams): Promise<EmailResult>;
}

/**
 * SMTP Provider using nodemailer
 */
class SmtpProvider implements EmailProvider {
  private transporter: any;

  constructor() {
    // Dynamic import to avoid issues in edge runtime
    this.initTransporter();
  }

  private async initTransporter() {
    try {
      const nodemailer = await import("nodemailer");
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch {
      console.warn("Nodemailer not available, email sending disabled");
    }
  }

  async send(params: SendEmailParams): Promise<EmailResult> {
    if (!this.transporter) {
      await this.initTransporter();
    }

    if (!this.transporter) {
      throw new Error("SMTP transporter not initialized");
    }

    const toAddresses = Array.isArray(params.to) ? params.to : [params.to];

    const result = await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@peoplehub.id",
      to: toAddresses.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(", "),
      cc: params.cc?.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(", "),
      bcc: params.bcc?.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(", "),
      replyTo: params.replyTo,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    return {
      messageId: result.messageId,
      accepted: result.accepted || [],
      rejected: result.rejected || [],
    };
  }
}

/**
 * SendGrid Provider
 */
class SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || "";
  }

  async send(params: SendEmailParams): Promise<EmailResult> {
    const toAddresses = Array.isArray(params.to) ? params.to : [params.to];

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: toAddresses.map((r) => ({ email: r.email, name: r.name })),
            cc: params.cc?.map((r) => ({ email: r.email, name: r.name })),
            bcc: params.bcc?.map((r) => ({ email: r.email, name: r.name })),
          },
        ],
        from: {
          email: process.env.EMAIL_FROM || "noreply@peoplehub.id",
          name: process.env.EMAIL_FROM_NAME || "PeopleHub",
        },
        reply_to: params.replyTo ? { email: params.replyTo } : undefined,
        subject: params.subject,
        content: [
          { type: "text/plain", value: params.text || "" },
          { type: "text/html", value: params.html },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid error: ${errorText}`);
    }

    const messageId = response.headers.get("X-Message-Id") || `sg-${Date.now()}`;

    return {
      messageId,
      accepted: toAddresses.map((r) => r.email),
      rejected: [],
    };
  }
}

/**
 * Resend Provider (modern email API)
 */
class ResendProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
  }

  async send(params: SendEmailParams): Promise<EmailResult> {
    const toAddresses = Array.isArray(params.to) ? params.to : [params.to];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "noreply@peoplehub.id",
        to: toAddresses.map((r) => r.email),
        cc: params.cc?.map((r) => r.email),
        bcc: params.bcc?.map((r) => r.email),
        reply_to: params.replyTo,
        subject: params.subject,
        html: params.html,
        text: params.text,
        tags: params.tags?.map((t) => ({ name: t, value: "true" })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Resend error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    return {
      messageId: data.id,
      accepted: toAddresses.map((r) => r.email),
      rejected: [],
    };
  }
}

// ==========================================
// EMAIL SERVICE
// ==========================================

export class EmailService {
  private static provider: EmailProvider | null = null;

  /**
   * Get email provider based on configuration
   */
  private static getProvider(): EmailProvider {
    if (this.provider) return this.provider;

    const providerType = process.env.EMAIL_PROVIDER || "smtp";

    switch (providerType) {
      case "sendgrid":
        this.provider = new SendGridProvider();
        break;
      case "resend":
        this.provider = new ResendProvider();
        break;
      default:
        this.provider = new SmtpProvider();
    }

    return this.provider;
  }

  /**
   * Send email
   */
  static async send(params: SendEmailParams): Promise<ServiceResponse<EmailResult>> {
    try {
      const provider = this.getProvider();
      const result = await provider.send(params);

      // Log email sent
      await this.logEmail({
        to: Array.isArray(params.to) ? params.to.map((r) => r.email) : [params.to.email],
        subject: params.subject,
        messageId: result.messageId,
        status: "SENT",
      });

      return success(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send email";
      console.error("Email send error:", errorMessage);

      // Log failed email
      await this.logEmail({
        to: Array.isArray(params.to) ? params.to.map((r) => r.email) : [params.to.email],
        subject: params.subject,
        messageId: null,
        status: "FAILED",
        error: errorMessage,
      });

      return error(ErrorCodes.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Send email using template
   */
  static async sendTemplate(
    templateName: string,
    to: EmailRecipient | EmailRecipient[],
    variables: Record<string, string>
  ): Promise<ServiceResponse<EmailResult>> {
    const template = await this.getTemplate(templateName);
    if (!template) {
      return error(ErrorCodes.NOT_FOUND, `Template "${templateName}" tidak ditemukan`);
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

    return this.send({
      to,
      subject,
      html,
      text,
      tags: [templateName],
    });
  }

  /**
   * Get email template
   */
  static async getTemplate(name: string): Promise<EmailTemplate | null> {
    // Import templates dynamically
    try {
      const templates = await import("./templates");
      const templateFn = (templates as Record<string, (vars: Record<string, string>) => EmailTemplate>)[name];

      if (templateFn) {
        return templateFn({});
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user wants to receive email notifications
   */
  static async shouldSendEmail(
    userId: string,
    notificationType: "attendance" | "leave" | "approval" | "announcement" | "system"
  ): Promise<boolean> {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs || !prefs.emailEnabled) {
      return false;
    }

    switch (notificationType) {
      case "attendance":
        return prefs.attendanceAlerts;
      case "leave":
        return prefs.leaveAlerts;
      case "approval":
        return prefs.approvalAlerts;
      case "announcement":
        return prefs.announcementAlerts;
      default:
        return true;
    }
  }

  /**
   * Get user email by userId
   */
  static async getUserEmail(userId: string): Promise<EmailRecipient | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (!user) return null;

    return {
      email: user.email,
      name: user.employee?.fullName,
    };
  }

  /**
   * Log email for tracking
   */
  private static async logEmail(data: {
    to: string[];
    subject: string;
    messageId: string | null;
    status: "SENT" | "FAILED" | "QUEUED";
    error?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: "system",
          action: "EMAIL_SEND",
          objectType: "Email",
          objectId: data.messageId,
          afterData: JSON.parse(JSON.stringify({
            to: data.to,
            subject: data.subject,
            status: data.status,
            error: data.error,
          })),
        },
      });
    } catch {
      // Silently fail logging
    }
  }
}
