/**
 * @jest-environment node
 */
// @ai:ag - Created by Antigravity
// Unit tests for roles constants

import {
    ROLE_LABELS,
    ROLE_HIERARCHY,
    ADMIN_ROLES,
    LEAVE_APPROVER_ROLES,
    isAdminRole,
    canApproveLeave,
    getRoleLabel,
} from '@/constants/roles';
import { UserRole } from '@/types';

describe('Roles Constants', () => {
    describe('ROLE_LABELS', () => {
        it('should have Indonesian labels for all roles', () => {
            expect(ROLE_LABELS[UserRole.EMPLOYEE]).toBe('Karyawan');
            expect(ROLE_LABELS[UserRole.MANAGER]).toBe('Manajer');
            expect(ROLE_LABELS[UserRole.HRD]).toBe('HRD');
            expect(ROLE_LABELS[UserRole.FINANCE]).toBe('Finance');
            expect(ROLE_LABELS[UserRole.IT_OPS]).toBe('IT Ops');
            expect(ROLE_LABELS[UserRole.SUPER_ADMIN]).toBe('Super Admin');
        });
    });

    describe('ROLE_HIERARCHY', () => {
        it('should define correct hierarchy levels', () => {
            expect(ROLE_HIERARCHY[UserRole.EMPLOYEE]).toBe(1);
            expect(ROLE_HIERARCHY[UserRole.MANAGER]).toBe(2);
            expect(ROLE_HIERARCHY[UserRole.HRD]).toBe(3);
            expect(ROLE_HIERARCHY[UserRole.FINANCE]).toBe(3);
            expect(ROLE_HIERARCHY[UserRole.IT_OPS]).toBe(4);
            expect(ROLE_HIERARCHY[UserRole.SUPER_ADMIN]).toBe(5);
        });

        it('should have SUPER_ADMIN as highest', () => {
            const allLevels = Object.values(ROLE_HIERARCHY);
            const maxLevel = Math.max(...allLevels);
            expect(ROLE_HIERARCHY[UserRole.SUPER_ADMIN]).toBe(maxLevel);
        });
    });

    describe('ADMIN_ROLES', () => {
        it('should include admin roles', () => {
            expect(ADMIN_ROLES).toContain(UserRole.HRD);
            expect(ADMIN_ROLES).toContain(UserRole.IT_OPS);
            expect(ADMIN_ROLES).toContain(UserRole.SUPER_ADMIN);
        });

        it('should not include EMPLOYEE', () => {
            expect(ADMIN_ROLES).not.toContain(UserRole.EMPLOYEE);
        });
    });

    describe('LEAVE_APPROVER_ROLES', () => {
        it('should include leave approver roles', () => {
            expect(LEAVE_APPROVER_ROLES).toContain(UserRole.MANAGER);
            expect(LEAVE_APPROVER_ROLES).toContain(UserRole.HRD);
        });

        it('should not include EMPLOYEE', () => {
            expect(LEAVE_APPROVER_ROLES).not.toContain(UserRole.EMPLOYEE);
        });
    });

    describe('isAdminRole', () => {
        it('should return true for admin roles', () => {
            expect(isAdminRole(UserRole.HRD)).toBe(true);
            expect(isAdminRole(UserRole.IT_OPS)).toBe(true);
            expect(isAdminRole(UserRole.SUPER_ADMIN)).toBe(true);
        });

        it('should return false for non-admin roles', () => {
            expect(isAdminRole(UserRole.EMPLOYEE)).toBe(false);
            expect(isAdminRole(UserRole.MANAGER)).toBe(false);
        });
    });

    describe('canApproveLeave', () => {
        it('should return true for leave approvers', () => {
            expect(canApproveLeave(UserRole.MANAGER)).toBe(true);
            expect(canApproveLeave(UserRole.HRD)).toBe(true);
        });

        it('should return false for non-approvers', () => {
            expect(canApproveLeave(UserRole.EMPLOYEE)).toBe(false);
            expect(canApproveLeave(UserRole.FINANCE)).toBe(false);
        });
    });

    describe('getRoleLabel', () => {
        it('should return Indonesian label', () => {
            expect(getRoleLabel(UserRole.EMPLOYEE)).toBe('Karyawan');
            expect(getRoleLabel(UserRole.MANAGER)).toBe('Manajer');
        });

        it('should handle invalid role', () => {
            expect(getRoleLabel('INVALID' as UserRole)).toBe('Unknown');
        });
    });
});
