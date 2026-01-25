// @ai:cl - Session management utilities
import { cookies } from "next/headers";
import { AUTH_CONFIG, JWTPayload, verifyToken } from "./config";

/**
 * Get current user session from cookies
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONFIG.cookieName)?.value;

  if (!token) return null;

  return verifyToken(token);
}

/**
 * Set authentication cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_CONFIG.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_CONFIG.cookieMaxAge,
    path: "/",
  });
}

/**
 * Clear authentication cookie (logout)
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_CONFIG.cookieName);
}

/**
 * Check if user has required role
 */
export function hasRole(session: JWTPayload, allowedRoles: JWTPayload["role"][]): boolean {
  return allowedRoles.includes(session.role);
}

/**
 * Check if user is admin (HRD, IT_OPS, or SUPER_ADMIN)
 */
export function isAdmin(session: JWTPayload): boolean {
  return hasRole(session, ["HRD", "IT_OPS", "SUPER_ADMIN"]);
}

/**
 * Check if user is manager or above
 */
export function isManagerOrAbove(session: JWTPayload): boolean {
  return hasRole(session, ["MANAGER", "HRD", "FINANCE", "IT_OPS", "SUPER_ADMIN"]);
}
