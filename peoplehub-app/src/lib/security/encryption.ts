// @ai:cl - Encryption utilities for sensitive data
import crypto from "crypto";

// Validate encryption key
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  ENCRYPTION_KEY not set, using development fallback. DO NOT use in production!");
      return "dev-only-encryption-key-32chars!";
    }
    throw new Error("Required environment variable ENCRYPTION_KEY is not set");
  }
  if (key.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 characters");
  }
  return key;
}

const ENCRYPTION_KEY = getEncryptionKey();
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
// AUTH_TAG_LENGTH is 16 bytes (128 bits) - standard for AES-GCM

/**
 * Encrypt sensitive data (e.g., bank account numbers, NIK)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hash sensitive data for comparison (one-way)
 */
export function hashData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Mask sensitive data for display (e.g., bank account: ****1234)
 */
export function maskData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return "*".repeat(data.length);
  }
  const masked = "*".repeat(data.length - visibleChars);
  const visible = data.slice(-visibleChars);
  return masked + visible;
}

/**
 * Mask email for display (e.g., j***@example.com)
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;

  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }

  const maskedLocal = local[0] + "*".repeat(local.length - 2) + local.slice(-1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number (e.g., 0812****5678)
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 8) {
    return "*".repeat(cleaned.length);
  }
  return cleaned.slice(0, 4) + "*".repeat(cleaned.length - 8) + cleaned.slice(-4);
}
