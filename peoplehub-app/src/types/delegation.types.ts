// @ai:ag - Created by Antigravity
// Delegation types for approval workflow

/**
 * Types of approvals that can be delegated
 */
export type ApprovalType =
    | 'LEAVE'
    | 'ATTENDANCE_CORRECTION'
    | 'TRAVEL'
    | 'EXPENSE'
    | 'OVERTIME'
    | 'LETTER'
    | 'ALL';

/**
 * Delegation entity - represents temporary transfer of approval authority
 */
export interface Delegation {
    id: string;
    tenantId: string;

    // Delegator = person who delegates their authority
    delegatorId: string;
    delegatorName?: string;
    delegatorEmail?: string;

    // Delegatee = person who receives the delegated authority
    delegateeId: string;
    delegateeName?: string;
    delegateeEmail?: string;

    // Delegation period
    startDate: string; // ISO date string
    endDate: string; // ISO date string

    // What can be delegated
    approvalTypes: ApprovalType[];

    // Metadata
    reason: string;
    isActive: boolean;

    createdAt: string;
    updatedAt?: string;
    cancelledAt?: string;
    cancelledBy?: string;
}

/**
 * Form data for creating delegation
 */
export interface DelegationFormData {
    delegateeId: string;
    startDate: Date;
    endDate: Date;
    approvalTypes: ApprovalType[];
    reason: string;
}

/**
 * Delegation validation result
 */
export interface DelegationValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Resolved approver after checking delegation chain
 */
export interface ResolvedApprover {
    approverId: string;
    approverName?: string;
    isDelegated: boolean;
    delegatedFrom?: string;
    delegatedFromName?: string;
    delegationId?: string;
}

/**
 * Delegation list filters
 */
export interface DelegationFilters {
    status?: 'active' | 'expired' | 'cancelled' | 'all';
    delegatorId?: string;
    delegateeId?: string;
    approvalType?: ApprovalType;
    startDate?: string;
    endDate?: string;
}

/**
 * Delegation summary for user
 */
export interface DelegationSummary {
    delegatedTo: number; // How many active delegations user has given
    delegatedFrom: number; // How many active delegations user has received
    upcomingExpiry: Delegation[]; // Delegations expiring within 7 days
}
