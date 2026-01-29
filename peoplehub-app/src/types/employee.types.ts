// @ai:ag - Created by Antigravity
// Employee related types

import { TenantEntity } from './common.types';
import { EmploymentType, WorkMode, EmployeeStatus, UserRole, UserStatus } from './enums';
import { Branch, Department, Position } from './tenant.types';

/**
 * Employee basic data
 */
export interface Employee extends TenantEntity {
    userId: string;
    branchId?: string | null;
    departmentId?: string | null;
    positionId?: string | null;
    managerId?: string | null;
    employeeNumber: string;
    fullName: string;
    nik?: string | null;
    npwp?: string | null;
    bpjsKesehatan?: string | null;
    bpjsKetenagakerjaan?: string | null;
    employmentType: EmploymentType;
    workMode: WorkMode;
    startDate: Date | string;
    endDate?: Date | string | null;
    phone?: string | null;
    address?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountHolder?: string | null;
    bankBranch?: string | null;
    status: EmployeeStatus;
}

/**
 * Employee with relations
 */
export interface EmployeeWithRelations extends Employee {
    user?: {
        id: string;
        email: string;
        phone?: string | null;
        role: UserRole;
        status: UserStatus;
    };
    branch?: Branch | null;
    department?: Department | null;
    position?: Position | null;
    manager?: {
        id: string;
        fullName: string;
        employeeNumber: string;
        position?: Position | null;
    } | null;
    subordinates?: Array<{
        id: string;
        fullName: string;
        employeeNumber: string;
    }>;
}

/**
 * Employee summary for lists
 */
export interface EmployeeSummary {
    id: string;
    employeeNumber: string;
    fullName: string;
    email?: string;
    phone?: string | null;
    position?: string | null;
    department?: string | null;
    branch?: string | null;
    status: EmployeeStatus;
    employmentType: EmploymentType;
    startDate: Date | string;
}

/**
 * Create employee request
 */
export interface CreateEmployeeRequest {
    email: string;
    phone?: string;
    password: string;
    employeeNumber: string;
    fullName: string;
    branchId?: string;
    departmentId?: string;
    positionId?: string;
    managerId?: string;
    nik?: string;
    npwp?: string;
    bpjsKesehatan?: string;
    bpjsKetenagakerjaan?: string;
    employmentType?: EmploymentType;
    workMode?: WorkMode;
    startDate: Date | string;
    endDate?: Date | string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    bankBranch?: string;
}

/**
 * Update employee request
 */
export interface UpdateEmployeeRequest extends Partial<Omit<CreateEmployeeRequest, 'email' | 'password'>> {
    status?: EmployeeStatus;
}

/**
 * Employee filter params
 */
export interface EmployeeFilterParams {
    search?: string;
    branchId?: string;
    departmentId?: string;
    positionId?: string;
    managerId?: string;
    status?: EmployeeStatus;
    employmentType?: EmploymentType;
    workMode?: WorkMode;
}
