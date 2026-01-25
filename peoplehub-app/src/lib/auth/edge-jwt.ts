// @ai:cl - Edge-compatible JWT verification using Web Crypto API
// This file is safe to use in Edge Runtime (middleware)

export type UserRole = "EMPLOYEE" | "MANAGER" | "HRD" | "FINANCE" | "IT_OPS" | "SUPER_ADMIN";

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string;
  employeeId?: string;
  iat?: number;
  exp?: number;
}

// Get JWT secret - in Edge Runtime we can't throw errors on module load
// so we validate at runtime in verifyTokenEdge
const JWT_SECRET = process.env.JWT_SECRET || "";

// Base64URL decode
function base64UrlDecode(str: string): string {
  // Add padding if needed
  const pad = str.length % 4;
  if (pad) {
    str += "=".repeat(4 - pad);
  }
  // Replace URL-safe characters
  str = str.replace(/-/g, "+").replace(/_/g, "/");

  // Decode
  try {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return atob(str);
  }
}

/**
 * Timing-safe comparison of two Uint8Arrays
 * Uses XOR without early return to prevent timing attacks
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    // Still need to do some work to avoid length-based timing
    // Use XOR on dummy data with same iteration count
    let result = a.length ^ b.length;
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      result |= (a[i % a.length] || 0) ^ (b[i % b.length] || 0);
    }
    void result; // Intentional: result used for timing consistency, not value
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// Simple HMAC-SHA256 signature verification using Web Crypto API
async function verifySignature(
  header: string,
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${header}.${payload}`);
  const secretKey = encoder.encode(secret);

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      secretKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);

    // Convert signature from base64url to ArrayBuffer
    const expectedSignature = Uint8Array.from(
      atob(signature.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    // Use timing-safe comparison to prevent timing attacks
    const actualSignature = new Uint8Array(signatureBuffer);
    return timingSafeEqual(actualSignature, expectedSignature);
  } catch {
    return false;
  }
}

/**
 * Verify JWT token in Edge Runtime
 * Returns the payload if valid, null otherwise
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    // Validate JWT_SECRET is configured
    if (!JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not configured");
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature
    const isValid = await verifySignature(headerB64, payloadB64, signatureB64, JWT_SECRET);
    if (!isValid) {
      return null;
    }

    // Decode payload
    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson) as JWTPayload;

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Re-export config values that are safe for Edge
export const AUTH_CONFIG = {
  cookieName: "auth-token",
  cookieMaxAge: 60 * 60 * 24, // 1 day in seconds
} as const;
