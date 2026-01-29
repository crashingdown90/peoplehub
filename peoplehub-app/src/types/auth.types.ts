// @ai:ag - Created by Antigravity
// Authentication related types

import { UserRole, UserStatus } from './enums';

/**
 * Authenticated user data
 */
export interface AuthUser {
    id: string;
    tenantId: string;
    email: string;
    phone?: string | null;
    role: UserRole;
    status: UserStatus;
    emailVerifiedAt?: Date | string | null;
    lastLoginAt?: Date | string | null;
    photoUrl?: string | null;
    employee?: {
        id: string;
        employeeNumber: string;
        fullName: string;
        position?: {
            id: string;
            name: string;
        } | null;
        department?: {
            id: string;
            name: string;
        } | null;
        branch?: {
            id: string;
            name: string;
        } | null;
    } | null;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
    tenantId?: string;
    rememberMe?: boolean;
}

/**
 * Registration data
 */
export interface RegisterData {
    tenantId: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    employeeNumber?: string;
    nik?: string;
    agreeToTerms: boolean;
}

/**
 * Session data
 */
export interface SessionData {
    user: AuthUser;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date | string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
    email: string;
    tenantId?: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirm {
    token: string;
    password: string;
    confirmPassword: string;
}

/**
 * Email verification
 */
export interface EmailVerification {
    token: string;
    email: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

/**
 * Auth context state
 */
export interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}
