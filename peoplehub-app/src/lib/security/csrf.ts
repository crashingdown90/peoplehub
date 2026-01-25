// @ai:cl - CSRF Protection Utility
import { cookies } from "next/headers";
import crypto from "crypto";
import { CSRF_TOKEN_NAME, CSRF_HEADER_NAME, CSRF_CONFIG } from "./csrf-constants";

const TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
    return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Set CSRF token in cookie and return token for client
 * Call this when rendering forms that need CSRF protection
 */
export async function setCsrfToken(): Promise<string> {
    const token = generateCsrfToken();
    const cookieStore = await cookies();

    cookieStore.set(CSRF_TOKEN_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60, // 1 hour
    });

    return token;
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfTokenFromCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_TOKEN_NAME)?.value;
}

/**
 * Validate CSRF token from request header against cookie
 */
export async function validateCsrfToken(headerToken: string | null): Promise<boolean> {
    if (!headerToken) {
        return false;
    }

    const cookieToken = await getCsrfTokenFromCookie();
    if (!cookieToken) {
        return false;
    }

    // Use timing-safe comparison
    try {
        return crypto.timingSafeEqual(
            Buffer.from(headerToken),
            Buffer.from(cookieToken)
        );
    } catch {
        return false;
    }
}

/**
 * CSRF validation result type
 */
export interface CsrfValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate CSRF for API routes
 * Use this in POST/PUT/DELETE API handlers
 */
export async function validateCsrf(headers: Headers): Promise<CsrfValidationResult> {
    const token = headers.get(CSRF_HEADER_NAME);

    if (!token) {
        return {
            valid: false,
            error: "CSRF token missing from request header",
        };
    }

    const isValid = await validateCsrfToken(token);
    if (!isValid) {
        return {
            valid: false,
            error: "CSRF token validation failed",
        };
    }

    return { valid: true };
}

/**
 * Get CSRF error response
 */
export function getCsrfErrorResponse() {
    return {
        success: false,
        error: {
            code: "CSRF_VALIDATION_FAILED",
            message: "CSRF token tidak valid atau tidak ada",
        },
    };
}

// Export constants from shared file
export { CSRF_CONFIG };
