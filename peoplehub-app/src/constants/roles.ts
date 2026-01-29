// @ai:ag - Created by Antigravity
// Role constants and labels

import { UserRole } from '@/types';

/**
 * All available user roles
 */
export const USER_ROLES = Object.values(UserRole);

/**
 * Role labels in Indonesian
 */
export const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.EMPLOYEE]: 'Karyawan',
    [UserRole.MANAGER]: 'Manajer',
    [UserRole.HRD]: 'HRD',
    [UserRole.FINANCE]: 'Finance',
    [UserRole.IT_OPS]: 'IT Ops',
    [UserRole.SUPER_ADMIN]: 'Super Admin',
};

/**
 * Role hierarchy (higher number = higher authority)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    [UserRole.EMPLOYEE]: 1,
    [UserRole.MANAGER]: 2,
    [UserRole.HRD]: 3,
    [UserRole.FINANCE]: 3,
    [UserRole.IT_OPS]: 4,
    [UserRole.SUPER_ADMIN]: 5,
};

/**
 * Roles that can approve leave requests
 */
export const LEAVE_APPROVER_ROLES: UserRole[] = [
    UserRole.MANAGER,
    UserRole.HRD,
    UserRole.SUPER_ADMIN,
];

/**
 * Roles that can access admin panel
 */
export const ADMIN_ROLES: UserRole[] = [
    UserRole.HRD,
    UserRole.FINANCE,
    UserRole.IT_OPS,
    UserRole.SUPER_ADMIN,
];

/**
 * Roles that can view all employees
 */
export const VIEW_ALL_EMPLOYEES_ROLES: UserRole[] = [
    UserRole.HRD,
    UserRole.SUPER_ADMIN,
];

/**
 * Check if role has higher authority than another
 */
export function hasHigherAuthority(role: UserRole, thanRole: UserRole): boolean {
    return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[thanRole];
}

/**
 * Check if role can approve for another role
 */
export function canApproveFor(approverRole: UserRole, targetRole: UserRole): boolean {
    return hasHigherAuthority(approverRole, targetRole);
}

/**
 * Check if role is an admin role
 */
export function isAdminRole(role: UserRole): boolean {
    return ADMIN_ROLES.includes(role);
}

/**
 * Check if role can approve leave requests
 */
export function canApproveLeave(role: UserRole): boolean {
    return LEAVE_APPROVER_ROLES.includes(role);
}

/**
 * Get role label in Indonesian
 */
export function getRoleLabel(role: UserRole): string {
    return ROLE_LABELS[role] || 'Unknown';
}
