// @ai:ag - Created by Antigravity
// Authentication hook

'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '@/types';
import { ADMIN_ROLES, LEAVE_APPROVER_ROLES, hasHigherAuthority } from '@/constants';

interface UseAuthReturn {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isManager: boolean;
    isHRD: boolean;
    canApproveLeave: boolean;
    hasRole: (role: UserRole) => boolean;
    hasAnyRole: (roles: UserRole[]) => boolean;
    hasAuthorityOver: (targetRole: UserRole) => boolean;
    login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

/**
 * Authentication hook
 * Provides user data, auth state, and permission checking
 */
export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    /**
     * Fetch current session
     */
    const fetchSession = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/auth/session');
            const data = await response.json();

            if (data.success && data.data?.user) {
                setUser(data.data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to fetch session:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    /**
     * Check if user has specific role
     */
    const hasRole = useCallback(
        (role: UserRole): boolean => {
            if (!user?.role) return false;
            return user.role === role;
        },
        [user?.role]
    );

    /**
     * Check if user has any of the specified roles
     */
    const hasAnyRole = useCallback(
        (roles: UserRole[]): boolean => {
            if (!user?.role) return false;
            return roles.includes(user.role as UserRole);
        },
        [user?.role]
    );

    /**
     * Check if user is admin
     */
    const isAdmin = useMemo(
        () => hasAnyRole(ADMIN_ROLES),
        [hasAnyRole]
    );

    /**
     * Check if user can approve leave requests
     */
    const canApproveLeave = useMemo(
        () => hasAnyRole(LEAVE_APPROVER_ROLES),
        [hasAnyRole]
    );

    /**
     * Check if user is super admin
     */
    const isSuperAdmin = useMemo(
        () => hasRole(UserRole.SUPER_ADMIN),
        [hasRole]
    );

    /**
     * Check if user is manager
     */
    const isManager = useMemo(
        () => hasRole(UserRole.MANAGER),
        [hasRole]
    );

    /**
     * Check if user is HRD
     */
    const isHRD = useMemo(
        () => hasRole(UserRole.HRD),
        [hasRole]
    );

    /**
     * Check if user has authority over another role
     */
    const hasAuthorityOver = useCallback(
        (targetRole: UserRole): boolean => {
            if (!user?.role) return false;
            return hasHigherAuthority(user.role as UserRole, targetRole);
        },
        [user?.role]
    );

    /**
     * Login function
     */
    const login = useCallback(
        async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (data.success) {
                    await fetchSession();
                    return { ok: true };
                } else {
                    return { ok: false, error: data.message || 'Login failed' };
                }
            } catch (error) {
                console.error('Login error:', error);
                return { ok: false, error: 'Login failed' };
            }
        },
        [fetchSession]
    );

    /**
     * Logout function
     */
    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, []);

    return {
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
        isManager,
        isHRD,
        canApproveLeave,
        hasRole,
        hasAnyRole,
        hasAuthorityOver,
        login,
        logout,
        refresh: fetchSession,
    };
}

export type { UseAuthReturn };
