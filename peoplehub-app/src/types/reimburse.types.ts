// @ai:ag - Created by Antigravity
// Reimburse types

import { ApprovalStatus } from './enums';
import { TenantEntity, BaseEntity } from './common.types';

// ==========================================
// REIMBURSE CATEGORY
// ==========================================

export type ReimburseCategory =
    | 'MEDICAL'
    | 'TRANSPORT'
    | 'COMMUNICATION'
    | 'MEALS'
    | 'OFFICE_SUPPLIES'
    | 'TRAINING'
    | 'PARKING'
    | 'OTHER';

export const REIMBURSE_CATEGORY_LABELS: Record<ReimburseCategory, string> = {
    MEDICAL: 'Kesehatan',
    TRANSPORT: 'Transportasi',
    COMMUNICATION: 'Komunikasi',
    MEALS: 'Makan',
    OFFICE_SUPPLIES: 'Perlengkapan Kantor',
    TRAINING: 'Pelatihan',
    PARKING: 'Parkir',
    OTHER: 'Lainnya',
};

// ==========================================
// REIMBURSE REQUEST
// ==========================================

export interface ReimburseRequest extends TenantEntity {
    employeeId: string;
    category: ReimburseCategory;
    description: string;
    totalAmount: number;
    status: ApprovalStatus;
    requestDate: Date | string;
    approvedById?: string | null;
    approvedAt?: Date | string | null;
    paidAt?: Date | string | null;
    rejectionReason?: string | null;
    notes?: string | null;
    items: ReimburseItem[];
}

export interface CreateReimburseRequestInput {
    category: ReimburseCategory;
    description: string;
    notes?: string;
    items: CreateReimburseItemInput[];
}

export interface UpdateReimburseRequestInput {
    description?: string;
    notes?: string;
    items?: CreateReimburseItemInput[];
}

// ==========================================
// REIMBURSE ITEM
// ==========================================

export interface ReimburseItem extends BaseEntity {
    reimburseRequestId: string;
    description: string;
    amount: number;
    date: Date | string;
    receiptUrl?: string | null;
}

export interface CreateReimburseItemInput {
    description: string;
    amount: number;
    date: string;
    receiptUrl?: string;
}

// ==========================================
// REIMBURSE SUMMARY
// ==========================================

export interface ReimburseSummary {
    totalRequests: number;
    pendingRequests: number;
    approvedAmount: number;
    paidAmount: number;
    pendingAmount: number;
    byCategory: ReimburseCategorySummary[];
    recentRequests: ReimburseRequest[];
}

export interface ReimburseCategorySummary {
    category: ReimburseCategory;
    count: number;
    totalAmount: number;
}

// ==========================================
// REIMBURSE APPROVAL
// ==========================================

export interface ApproveReimburseInput {
    requestId: string;
}

export interface RejectReimburseInput {
    requestId: string;
    reason: string;
}

export interface MarkReimbursePaidInput {
    requestId: string;
    paidAt?: string;
}

// ==========================================
// REIMBURSE LIMITS
// ==========================================

export interface ReimburseLimit {
    category: ReimburseCategory;
    monthlyLimit: number;
    yearlyLimit: number;
    perTransactionLimit: number;
}

export const DEFAULT_REIMBURSE_LIMITS: Record<ReimburseCategory, ReimburseLimit> = {
    MEDICAL: {
        category: 'MEDICAL',
        monthlyLimit: 2000000,
        yearlyLimit: 20000000,
        perTransactionLimit: 1000000,
    },
    TRANSPORT: {
        category: 'TRANSPORT',
        monthlyLimit: 1000000,
        yearlyLimit: 12000000,
        perTransactionLimit: 500000,
    },
    COMMUNICATION: {
        category: 'COMMUNICATION',
        monthlyLimit: 500000,
        yearlyLimit: 6000000,
        perTransactionLimit: 200000,
    },
    MEALS: {
        category: 'MEALS',
        monthlyLimit: 500000,
        yearlyLimit: 6000000,
        perTransactionLimit: 100000,
    },
    OFFICE_SUPPLIES: {
        category: 'OFFICE_SUPPLIES',
        monthlyLimit: 500000,
        yearlyLimit: 6000000,
        perTransactionLimit: 300000,
    },
    TRAINING: {
        category: 'TRAINING',
        monthlyLimit: 5000000,
        yearlyLimit: 30000000,
        perTransactionLimit: 5000000,
    },
    PARKING: {
        category: 'PARKING',
        monthlyLimit: 300000,
        yearlyLimit: 3600000,
        perTransactionLimit: 50000,
    },
    OTHER: {
        category: 'OTHER',
        monthlyLimit: 500000,
        yearlyLimit: 6000000,
        perTransactionLimit: 200000,
    },
};
