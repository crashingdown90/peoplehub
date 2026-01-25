// @ai:ag - Created by Antigravity
// Employee validation schemas

import { z } from 'zod';

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
    phone: z.string().optional(),
    address: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankAccountHolder: z.string().optional(),
});

/**
 * Create employee schema (admin)
 */
export const createEmployeeSchema = z.object({
    email: z.string().email('Format email tidak valid'),
    phone: z
        .string()
        .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor telepon tidak valid')
        .optional(),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    employeeNumber: z.string().min(1, 'Nomor karyawan wajib diisi'),
    fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
    branchId: z.string().cuid('Cabang wajib dipilih').optional(),
    departmentId: z.string().cuid('Departemen wajib dipilih').optional(),
    positionId: z.string().cuid('Posisi wajib dipilih').optional(),
    managerId: z.string().cuid().optional(),
    nik: z.string().length(16, 'NIK harus 16 digit').optional(),
    npwp: z.string().optional(),
    employmentType: z.enum(['PERMANENT', 'CONTRACT', 'FREELANCE']).default('PERMANENT'),
    workMode: z.enum(['WFO', 'WFH', 'HYBRID']).default('WFO'),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    endDate: z.string().optional(),
});

/**
 * Update employee schema (admin)
 */
export const updateEmployeeSchema = z.object({
    fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter').optional(),
    branchId: z.string().cuid().optional().nullable(),
    departmentId: z.string().cuid().optional().nullable(),
    positionId: z.string().cuid().optional().nullable(),
    managerId: z.string().cuid().optional().nullable(),
    nik: z.string().length(16, 'NIK harus 16 digit').optional(),
    npwp: z.string().optional(),
    bpjsKesehatan: z.string().optional(),
    bpjsKetenagakerjaan: z.string().optional(),
    employmentType: z.enum(['PERMANENT', 'CONTRACT', 'FREELANCE']).optional(),
    workMode: z.enum(['WFO', 'WFH', 'HYBRID']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankAccountHolder: z.string().optional(),
    bankBranch: z.string().optional(),
});

// Inferred types
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
