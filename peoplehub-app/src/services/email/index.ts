// @ai:cl - Email service barrel export
export { EmailService } from "./email.service";
export type {
  EmailConfig,
  EmailRecipient,
  EmailAttachment,
  SendEmailParams,
  EmailTemplate,
  EmailResult,
} from "./email.service";

export { EmailQueueService } from "./email.queue";
export type { QueuedEmail, QueueEmailParams } from "./email.queue";

// Re-export templates
export * as emailTemplates from "./templates";
