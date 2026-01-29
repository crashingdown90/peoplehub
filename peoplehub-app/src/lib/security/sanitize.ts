// @ai:cl - Input sanitization utilities for security
import { z } from "zod";

/**
 * Sanitize string input - remove dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Sanitize HTML content - escape special characters
 */
export function escapeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return input.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize for SQL-like contexts (additional layer, Prisma handles most)
 */
export function sanitizeForQuery(input: string): string {
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, "") // Remove semicolons
    .replace(/--/g, "") // Remove SQL comments
    .trim();
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  const cleaned = email.toLowerCase().trim();
  const emailSchema = z.string().email();

  try {
    emailSchema.parse(cleaned);
    return cleaned;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize Indonesian phone number
 */
export function sanitizePhone(phone: string): string | null {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, "");

  // Handle various formats: +62, 62, 0
  if (cleaned.startsWith("62")) {
    cleaned = "0" + cleaned.slice(2);
  } else if (cleaned.startsWith("8")) {
    cleaned = "0" + cleaned;
  }

  // Validate: should start with 08 and be 10-13 digits
  if (!/^08[1-9][0-9]{7,10}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Validate and sanitize Indonesian NIK (16 digits)
 */
export function sanitizeNIK(nik: string): string | null {
  const cleaned = nik.replace(/\D/g, "");

  if (cleaned.length !== 16) {
    return null;
  }

  return cleaned;
}

/**
 * Validate and sanitize NPWP (15 digits, format: XX.XXX.XXX.X-XXX.XXX)
 */
export function sanitizeNPWP(npwp: string): string | null {
  const cleaned = npwp.replace(/\D/g, "");

  if (cleaned.length !== 15) {
    return null;
  }

  // Format: XX.XXX.XXX.X-XXX.XXX
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}.${cleaned.slice(8, 9)}-${cleaned.slice(9, 12)}.${cleaned.slice(12)}`;
}

/**
 * Sanitize file name for uploads
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore
    .replace(/\.{2,}/g, ".") // Remove multiple dots
    .replace(/^\.+|\.+$/g, "") // Remove leading/trailing dots
    .slice(0, 255); // Limit length
}

/**
 * Validate file extension
 */
export function isAllowedFileType(
  fileName: string,
  allowedTypes: string[] = ["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx"]
): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext ? allowedTypes.includes(ext) : false;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize object - recursively sanitize all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : typeof item === "object" && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
