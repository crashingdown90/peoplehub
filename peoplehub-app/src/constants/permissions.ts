// @ai:ag - Created by Antigravity
// Permission constants for role-based access control

import { UserRole } from '@/types';

// ==========================================
// PERMISSION DEFINITIONS
// ==========================================

/**
 * System permissions
 */
export const PERMISSIONS = {
    // Employee Management
    EMPLOYEES_VIEW: 'employees:view',
    EMPLOYEES_CREATE: 'employees:create',
    EMPLOYEES_EDIT: 'employees:edit',
    EMPLOYEES_DELETE: 'employees:delete',

    // Attendance
    ATTENDANCE_VIEW_OWN: 'attendance:view:own',
    ATTENDANCE_VIEW_TEAM: 'attendance:view:team',
    ATTENDANCE_VIEW_ALL: 'attendance:view:all',
    ATTENDANCE_CLOCK: 'attendance:clock',
    ATTENDANCE_CORRECT: 'attendance:correct',
    ATTENDANCE_APPROVE: 'attendance:approve',

    // Leave
    LEAVE_VIEW_OWN: 'leave:view:own',
    LEAVE_VIEW_TEAM: 'leave:view:team',
    LEAVE_VIEW_ALL: 'leave:view:all',
    LEAVE_REQUEST: 'leave:request',
    LEAVE_CANCEL: 'leave:cancel',
    LEAVE_APPROVE: 'leave:approve',

    // Payroll
    PAYROLL_VIEW_OWN: 'payroll:view:own',
    PAYROLL_VIEW_ALL: 'payroll:view:all',
    PAYROLL_MANAGE: 'payroll:manage',
    PAYROLL_PUBLISH: 'payroll:publish',

    // Travel & Reimburse
    TRAVEL_VIEW_OWN: 'travel:view:own',
    TRAVEL_VIEW_ALL: 'travel:view:all',
    TRAVEL_REQUEST: 'travel:request',
    TRAVEL_APPROVE: 'travel:approve',
    REIMBURSE_VIEW_OWN: 'reimburse:view:own',
    REIMBURSE_VIEW_ALL: 'reimburse:view:all',
    REIMBURSE_REQUEST: 'reimburse:request',
    REIMBURSE_APPROVE: 'reimburse:approve',

    // KPI
    KPI_VIEW_OWN: 'kpi:view:own',
    KPI_VIEW_TEAM: 'kpi:view:team',
    KPI_VIEW_ALL: 'kpi:view:all',
    KPI_MANAGE: 'kpi:manage',

    // Organization
    ORG_VIEW: 'org:view',
    ORG_MANAGE_BRANCHES: 'org:manage:branches',
    ORG_MANAGE_DEPARTMENTS: 'org:manage:departments',
    ORG_MANAGE_POSITIONS: 'org:manage:positions',
    ORG_MANAGE_SHIFTS: 'org:manage:shifts',

    // Settings
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_TENANT: 'settings:tenant',
    SETTINGS_LEAVE_TYPES: 'settings:leave-types',
    SETTINGS_NOTIFICATIONS: 'settings:notifications',

    // Reports
    REPORTS_VIEW: 'reports:view',
    REPORTS_EXPORT: 'reports:export',

    // Admin
    ADMIN_REGISTRATIONS: 'admin:registrations',
    ADMIN_USERS: 'admin:users',
    ADMIN_AUDIT_LOG: 'admin:audit-log',

    // Announcements
    ANNOUNCEMENTS_VIEW: 'announcements:view',
    ANNOUNCEMENTS_CREATE: 'announcements:create',
    ANNOUNCEMENTS_MANAGE: 'announcements:manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ==========================================
// ROLE-PERMISSION MAPPING
// ==========================================

/**
 * Permissions assigned to each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.EMPLOYEE]: [
        PERMISSIONS.ATTENDANCE_VIEW_OWN,
        PERMISSIONS.ATTENDANCE_CLOCK,
        PERMISSIONS.LEAVE_VIEW_OWN,
        PERMISSIONS.LEAVE_REQUEST,
        PERMISSIONS.LEAVE_CANCEL,
        PERMISSIONS.PAYROLL_VIEW_OWN,
        PERMISSIONS.TRAVEL_VIEW_OWN,
        PERMISSIONS.TRAVEL_REQUEST,
        PERMISSIONS.REIMBURSE_VIEW_OWN,
        PERMISSIONS.REIMBURSE_REQUEST,
        PERMISSIONS.KPI_VIEW_OWN,
        PERMISSIONS.ORG_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
    ],

    [UserRole.MANAGER]: [
        // All employee permissions
        PERMISSIONS.ATTENDANCE_VIEW_OWN,
        PERMISSIONS.ATTENDANCE_VIEW_TEAM,
        PERMISSIONS.ATTENDANCE_CLOCK,
        PERMISSIONS.ATTENDANCE_APPROVE,
        PERMISSIONS.LEAVE_VIEW_OWN,
        PERMISSIONS.LEAVE_VIEW_TEAM,
        PERMISSIONS.LEAVE_REQUEST,
        PERMISSIONS.LEAVE_CANCEL,
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.PAYROLL_VIEW_OWN,
        PERMISSIONS.TRAVEL_VIEW_OWN,
        PERMISSIONS.TRAVEL_VIEW_ALL,
        PERMISSIONS.TRAVEL_REQUEST,
        PERMISSIONS.TRAVEL_APPROVE,
        PERMISSIONS.REIMBURSE_VIEW_OWN,
        PERMISSIONS.REIMBURSE_VIEW_ALL,
        PERMISSIONS.REIMBURSE_REQUEST,
        PERMISSIONS.REIMBURSE_APPROVE,
        PERMISSIONS.KPI_VIEW_OWN,
        PERMISSIONS.KPI_VIEW_TEAM,
        PERMISSIONS.KPI_MANAGE,
        PERMISSIONS.ORG_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.REPORTS_VIEW,
    ],

    [UserRole.HRD]: [
        // All permissions except payroll publish
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.EMPLOYEES_CREATE,
        PERMISSIONS.EMPLOYEES_EDIT,
        PERMISSIONS.ATTENDANCE_VIEW_ALL,
        PERMISSIONS.ATTENDANCE_APPROVE,
        PERMISSIONS.ATTENDANCE_CORRECT,
        PERMISSIONS.LEAVE_VIEW_ALL,
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.PAYROLL_VIEW_OWN,
        PERMISSIONS.TRAVEL_VIEW_ALL,
        PERMISSIONS.TRAVEL_APPROVE,
        PERMISSIONS.REIMBURSE_VIEW_ALL,
        PERMISSIONS.REIMBURSE_APPROVE,
        PERMISSIONS.KPI_VIEW_ALL,
        PERMISSIONS.KPI_MANAGE,
        PERMISSIONS.ORG_VIEW,
        PERMISSIONS.ORG_MANAGE_BRANCHES,
        PERMISSIONS.ORG_MANAGE_DEPARTMENTS,
        PERMISSIONS.ORG_MANAGE_POSITIONS,
        PERMISSIONS.ORG_MANAGE_SHIFTS,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.SETTINGS_LEAVE_TYPES,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.ADMIN_REGISTRATIONS,
        PERMISSIONS.ANNOUNCEMENTS_VIEW,
        PERMISSIONS.ANNOUNCEMENTS_CREATE,
        PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    ],

    [UserRole.FINANCE]: [
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW_ALL,
        PERMISSIONS.LEAVE_VIEW_ALL,
        PERMISSIONS.PAYROLL_VIEW_ALL,
        PERMISSIONS.PAYROLL_MANAGE,
        PERMISSIONS.PAYROLL_PUBLISH,
        PERMISSIONS.TRAVEL_VIEW_ALL,
        PERMISSIONS.TRAVEL_APPROVE,
        PERMISSIONS.REIMBURSE_VIEW_ALL,
        PERMISSIONS.REIMBURSE_APPROVE,
        PERMISSIONS.ORG_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
    ],

    [UserRole.IT_OPS]: [
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW_ALL,
        PERMISSIONS.LEAVE_VIEW_ALL,
        PERMISSIONS.ORG_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.SETTINGS_TENANT,
        PERMISSIONS.SETTINGS_NOTIFICATIONS,
        PERMISSIONS.ADMIN_USERS,
        PERMISSIONS.ADMIN_AUDIT_LOG,
    ],

    [UserRole.SUPER_ADMIN]: [
        // All permissions
        ...Object.values(PERMISSIONS),
    ],
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Check if role has specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}
