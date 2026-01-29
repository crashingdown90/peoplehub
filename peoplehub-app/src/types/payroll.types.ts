// @ai:ag - Created by Antigravity
// Payroll related types

import { TenantEntity } from './common.types';
import { PayslipStatus } from './enums';

/**
 * Allowances structure
 */
export interface Allowances {
    transport?: number;
    meal?: number;
    position?: number;
    communication?: number;
    housing?: number;
    [key: string]: number | undefined;
}

/**
 * Other deductions structure
 */
export interface OtherDeductions {
    loan?: number;
    insurance?: number;
    cooperative?: number;
    [key: string]: number | undefined;
}

/**
 * Payslip data
 */
export interface Payslip extends TenantEntity {
    employeeId: string;
    period: string; // Format: YYYY-MM

    // Earnings
    basicSalary: number;
    allowances?: Allowances | null;
    overtimeAmount: number;
    bonus: number;

    // Deductions
    lateDeduction: number;
    absentDeduction: number;
    taxDeduction: number;
    bpjsKesehatan: number;
    bpjsKetenagakerjaan: number;
    otherDeductions?: OtherDeductions | null;

    // Summary
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;

    // Attendance summary
    workDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    overtimeHours: number;

    status: PayslipStatus;
    publishedAt?: Date | string | null;
    generatedById?: string | null;
    notes?: string | null;
}

/**
 * Payslip with employee info
 */
export interface PayslipWithEmployee extends Payslip {
    employee: {
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
        bankName?: string | null;
        bankAccountNumber?: string | null;
        bankAccountHolder?: string | null;
    };
}

/**
 * Payslip summary for lists
 */
export interface PayslipSummary {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    period: string;
    grossSalary: number;
    netSalary: number;
    status: PayslipStatus;
}

/**
 * Generate payslip request
 */
export interface GeneratePayslipRequest {
    employeeId?: string;
    period: string; // YYYY-MM
    branchId?: string;
    departmentId?: string;
}

/**
 * Payroll run summary
 */
export interface PayrollRunSummary {
    period: string;
    totalEmployees: number;
    totalGrossSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
    draftCount: number;
    publishedCount: number;
}

/**
 * Payslip filter params
 */
export interface PayslipFilterParams {
    period?: string;
    employeeId?: string;
    branchId?: string;
    departmentId?: string;
    status?: PayslipStatus;
}
