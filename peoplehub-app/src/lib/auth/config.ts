// @ai:cl - Authentication configuration
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Validate required environment variables
function getRequiredEnvVar(name: string, fallbackForDev?: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "development" && fallbackForDev) {
      console.warn(`⚠️  ${name} not set, using development fallback. DO NOT use in production!`);
      return fallbackForDev;
    }
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

// Environment configuration
export const AUTH_CONFIG = {
  jwtSecret: getRequiredEnvVar("JWT_SECRET", "dev-only-jwt-secret-32-chars-min"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  bcryptRounds: 12,
  cookieName: "auth-token",
  cookieMaxAge: 60 * 60 * 24, // 1 day in seconds
} as const;

export type UserRole = "EMPLOYEE" | "MANAGER" | "HRD" | "FINANCE" | "IT_OPS" | "SUPER_ADMIN";

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string;
  employeeId?: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, AUTH_CONFIG.bcryptRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT operations
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, AUTH_CONFIG.jwtSecret, {
    expiresIn: AUTH_CONFIG.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, AUTH_CONFIG.jwtSecret) as JWTPayload;
  } catch {
    return null;
  }
}

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password harus minimal 8 karakter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 huruf besar");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 huruf kecil");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 angka");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 karakter khusus");
  }

  return { valid: errors.length === 0, errors };
}
