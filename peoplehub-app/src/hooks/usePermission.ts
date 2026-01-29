// @ai:ag - Created by Antigravity
// Permission hook for RBAC checks

'use client';

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
    Permission,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissions,
    PERMISSIONS,
} from '@/constants/permissions';
import { UserRole } from '@/types';

interface UsePermissionReturn {
    // User role
    role: UserRole | null;

    // Permission checks
    can: (permission: Permission) => boolean;
    canAny: (permissions: Permission[]) => boolean;
    canAll: (permissions: Permission[]) => boolean;

    // Role checks
    isAdmin: boolean;
    isManager: boolean;
    isSuperAdmin: boolean;

    // All permissions for current user
    permissions: Permission[];

    // Common permission shortcuts
    canManageEmployees: boolean;
    canApproveLeave: boolean;
    canManagePayroll: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
}

/**
 * Hook for checking user permissions
 */
export function usePermission(): UsePermissionReturn {
    const { user } = useAuth();

    const role = user?.role as UserRole | null;

    // Check single permission
    const can = useMemo(() => {
        return (permission: Permission): boolean => {
            if (!role) return false;
            return hasPermission(role, permission);
        };
    }, [role]);

    // Check if user has any of the permissions
    const canAny = useMemo(() => {
        return (permissions: Permission[]): boolean => {
            if (!role) return false;
            return hasAnyPermission(role, permissions);
        };
    }, [role]);

    // Check if user has all of the permissions
    const canAll = useMemo(() => {
        return (permissions: Permission[]): boolean => {
            if (!role) return false;
            return hasAllPermissions(role, permissions);
        };
    }, [role]);

    // Get all permissions for current user
    const permissions = useMemo(() => {
        if (!role) return [];
        return getPermissions(role);
    }, [role]);

    // Role checks
    const isAdmin = useMemo(() => {
        return role === UserRole.HRD || role === UserRole.IT_OPS || role === UserRole.SUPER_ADMIN;
    }, [role]);

    const isManager = useMemo(() => {
        return role === UserRole.MANAGER;
    }, [role]);

    const isSuperAdmin = useMemo(() => {
        return role === UserRole.SUPER_ADMIN;
    }, [role]);

    // Common permission shortcuts
    const canManageEmployees = useMemo(() => {
        if (!role) return false;
        return hasAnyPermission(role, [
            PERMISSIONS.EMPLOYEES_CREATE,
            PERMISSIONS.EMPLOYEES_EDIT,
            PERMISSIONS.EMPLOYEES_DELETE,
        ]);
    }, [role]);

    const canApproveLeave = useMemo(() => {
        if (!role) return false;
        return hasPermission(role, PERMISSIONS.LEAVE_APPROVE);
    }, [role]);

    const canManagePayroll = useMemo(() => {
        if (!role) return false;
        return hasAnyPermission(role, [
            PERMISSIONS.PAYROLL_MANAGE,
            PERMISSIONS.PAYROLL_PUBLISH,
        ]);
    }, [role]);

    const canViewReports = useMemo(() => {
        if (!role) return false;
        return hasPermission(role, PERMISSIONS.REPORTS_VIEW);
    }, [role]);

    const canManageSettings = useMemo(() => {
        if (!role) return false;
        return hasAnyPermission(role, [
            PERMISSIONS.SETTINGS_TENANT,
            PERMISSIONS.SETTINGS_LEAVE_TYPES,
            PERMISSIONS.SETTINGS_NOTIFICATIONS,
        ]);
    }, [role]);

    return {
        role,
        can,
        canAny,
        canAll,
        permissions,
        isAdmin,
        isManager,
        isSuperAdmin,
        canManageEmployees,
        canApproveLeave,
        canManagePayroll,
        canViewReports,
        canManageSettings,
    };
}

export type { UsePermissionReturn };
