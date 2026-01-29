/**
 * @jest-environment node
 */
// @ai:ag - Created by Antigravity
// Unit tests for permissions system

import {
    PERMISSIONS,
    ROLE_PERMISSIONS,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissions,
} from '@/constants/permissions';
import { UserRole } from '@/types';

describe('Permissions System', () => {
    describe('PERMISSIONS constant', () => {
        it('should have employee management permissions', () => {
            expect(PERMISSIONS.EMPLOYEES_VIEW).toBeDefined();
            expect(PERMISSIONS.EMPLOYEES_CREATE).toBeDefined();
            expect(PERMISSIONS.EMPLOYEES_EDIT).toBeDefined();
            expect(PERMISSIONS.EMPLOYEES_DELETE).toBeDefined();
        });

        it('should have attendance permissions', () => {
            expect(PERMISSIONS.ATTENDANCE_VIEW_OWN).toBeDefined();
            expect(PERMISSIONS.ATTENDANCE_VIEW_ALL).toBeDefined();
            expect(PERMISSIONS.ATTENDANCE_CLOCK).toBeDefined();
            expect(PERMISSIONS.ATTENDANCE_APPROVE).toBeDefined();
        });

        it('should have leave permissions', () => {
            expect(PERMISSIONS.LEAVE_VIEW_OWN).toBeDefined();
            expect(PERMISSIONS.LEAVE_REQUEST).toBeDefined();
            expect(PERMISSIONS.LEAVE_APPROVE).toBeDefined();
        });
    });

    describe('ROLE_PERMISSIONS', () => {
        it('should define permissions for all roles', () => {
            expect(ROLE_PERMISSIONS[UserRole.EMPLOYEE]).toBeDefined();
            expect(ROLE_PERMISSIONS[UserRole.MANAGER]).toBeDefined();
            expect(ROLE_PERMISSIONS[UserRole.HRD]).toBeDefined();
            expect(ROLE_PERMISSIONS[UserRole.FINANCE]).toBeDefined();
            expect(ROLE_PERMISSIONS[UserRole.IT_OPS]).toBeDefined();
            expect(ROLE_PERMISSIONS[UserRole.SUPER_ADMIN]).toBeDefined();
        });

        it('should grant SUPER_ADMIN all permissions', () => {
            const adminPermissions = ROLE_PERMISSIONS[UserRole.SUPER_ADMIN];
            const allPermissions = Object.values(PERMISSIONS);
            expect(adminPermissions.length).toBe(allPermissions.length);
        });

        it('should grant EMPLOYEE basic permissions', () => {
            const employeePermissions = ROLE_PERMISSIONS[UserRole.EMPLOYEE];
            expect(employeePermissions).toContain(PERMISSIONS.ATTENDANCE_VIEW_OWN);
            expect(employeePermissions).toContain(PERMISSIONS.ATTENDANCE_CLOCK);
            expect(employeePermissions).toContain(PERMISSIONS.LEAVE_VIEW_OWN);
            expect(employeePermissions).toContain(PERMISSIONS.LEAVE_REQUEST);
        });

        it('should not grant EMPLOYEE admin permissions', () => {
            const employeePermissions = ROLE_PERMISSIONS[UserRole.EMPLOYEE];
            expect(employeePermissions).not.toContain(PERMISSIONS.EMPLOYEES_CREATE);
            expect(employeePermissions).not.toContain(PERMISSIONS.PAYROLL_MANAGE);
            expect(employeePermissions).not.toContain(PERMISSIONS.ADMIN_USERS);
        });
    });

    describe('hasPermission', () => {
        it('should return true when role has permission', () => {
            expect(hasPermission(UserRole.EMPLOYEE, PERMISSIONS.ATTENDANCE_CLOCK)).toBe(true);
            expect(hasPermission(UserRole.HRD, PERMISSIONS.EMPLOYEES_CREATE)).toBe(true);
        });

        it('should return false when role lacks permission', () => {
            expect(hasPermission(UserRole.EMPLOYEE, PERMISSIONS.EMPLOYEES_CREATE)).toBe(false);
            expect(hasPermission(UserRole.FINANCE, PERMISSIONS.ADMIN_USERS)).toBe(false);
        });

        it('should return true for SUPER_ADMIN for any permission', () => {
            expect(hasPermission(UserRole.SUPER_ADMIN, PERMISSIONS.ADMIN_USERS)).toBe(true);
            expect(hasPermission(UserRole.SUPER_ADMIN, PERMISSIONS.PAYROLL_MANAGE)).toBe(true);
        });
    });

    describe('hasAnyPermission', () => {
        it('should return true when role has at least one permission', () => {
            const result = hasAnyPermission(UserRole.EMPLOYEE, [
                PERMISSIONS.EMPLOYEES_CREATE,
                PERMISSIONS.ATTENDANCE_CLOCK,
            ]);
            expect(result).toBe(true);
        });

        it('should return false when role has none of the permissions', () => {
            const result = hasAnyPermission(UserRole.EMPLOYEE, [
                PERMISSIONS.EMPLOYEES_CREATE,
                PERMISSIONS.PAYROLL_MANAGE,
            ]);
            expect(result).toBe(false);
        });
    });

    describe('hasAllPermissions', () => {
        it('should return true when role has all permissions', () => {
            const result = hasAllPermissions(UserRole.EMPLOYEE, [
                PERMISSIONS.ATTENDANCE_VIEW_OWN,
                PERMISSIONS.ATTENDANCE_CLOCK,
            ]);
            expect(result).toBe(true);
        });

        it('should return false when role lacks any permission', () => {
            const result = hasAllPermissions(UserRole.EMPLOYEE, [
                PERMISSIONS.ATTENDANCE_CLOCK,
                PERMISSIONS.EMPLOYEES_CREATE,
            ]);
            expect(result).toBe(false);
        });
    });

    describe('getPermissions', () => {
        it('should return all permissions for a role', () => {
            const permissions = getPermissions(UserRole.EMPLOYEE);
            expect(Array.isArray(permissions)).toBe(true);
            expect(permissions.length).toBeGreaterThan(0);
        });

        it('should return empty array for invalid role', () => {
            const permissions = getPermissions('INVALID' as UserRole);
            expect(permissions).toEqual([]);
        });
    });
});
