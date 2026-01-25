// @ai:ag - Created by Antigravity
// Approval flow types for multi-level approval system

/**
 * Approval levels (L1=Manager, L2=HRD, L3=Finance, L4=Director)
 */
export type ApprovalLevel = 'L1' | 'L2' | 'L3' | 'L4';

/**
 * Approval level display configuration
 */
export const APPROVAL_LEVEL_CONFIG: Record<ApprovalLevel, { label: string; role: string; color: string }> = {
    L1: { label: 'Manager / Atasan', role: 'MANAGER', color: 'blue' },
    L2: { label: 'HRD', role: 'HRD', color: 'purple' },
    L3: { label: 'Finance', role: 'FINANCE', color: 'green' },
    L4: { label: 'Direktur', role: 'DIRECTOR', color: 'red' },
};

/**
 * Approval flow level configuration
 */
export interface ApprovalFlowLevel {
    level: ApprovalLevel;
    role: string;
    slaHours: number;
    escalateTo?: ApprovalLevel | null;
    reminders: ApprovalReminder[];
}

/**
 * Reminder configuration for SLA
 */
export interface ApprovalReminder {
    percentSLA: number; // e.g., 50, 80
    action: 'EMAIL' | 'INAPP' | 'BOTH';
}

/**
 * Condition for determining approval chain
 */
export interface ApprovalCondition {
    field: string;
    operator: 'EQ' | 'GT' | 'LT' | 'GTE' | 'LTE' | 'IN' | 'NOT_IN';
    value: unknown;
}

/**
 * Approval flow configuration
 */
export interface ApprovalFlow {
    id: string;
    tenantId: string;
    name: string;
    entityType: string; // 'LEAVE', 'OVERTIME', 'EXPENSE', etc.
    description?: string;

    // Conditions to match this flow
    conditions: ApprovalCondition[];

    // Levels in this flow
    levels: ApprovalFlowLevel[];

    // Auto-approve condition
    autoApproveConditions?: ApprovalCondition[];

    isActive: boolean;
    isDefault: boolean;

    createdAt: string;
    updatedAt: string;
}

/**
 * Approval record - tracks individual approval actions
 */
export interface ApprovalRecord {
    id: string;
    level: ApprovalLevel;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'ESCALATED';

    approverId?: string;
    approverName?: string;
    approverRole?: string;

    timestamp?: string;
    comment?: string;

    // Delegation info
    isDelegated: boolean;
    delegatedFromId?: string;
    delegatedFromName?: string;

    // Escalation info
    isEscalated: boolean;
    escalatedFromLevel?: ApprovalLevel;
    escalatedAt?: string;
}

/**
 * Approval chain result - used for determining which levels to go through
 */
export interface ApprovalChainResult {
    chain: ApprovalLevel[];
    totalSLAHours: number;
    autoApprove: boolean;
    reason?: string; // Why this chain was selected
}

/**
 * Approval state for a request
 */
export interface ApprovalState {
    requestId: string;
    requestType: string;
    currentLevel: ApprovalLevel | null;
    currentStatus: string;
    approvalChain: ApprovalLevel[];
    approvalRecords: ApprovalRecord[];

    // SLA info
    submittedAt: string;
    currentLevelStartedAt?: string;
    slaDeadline?: string;
    slaPercentElapsed: number;
    isOverdue: boolean;

    // Actions
    canApprove: boolean;
    canReject: boolean;
    canCancel: boolean;
    canOverride: boolean;
}

/**
 * Approval action input
 */
export interface ApprovalActionInput {
    requestId: string;
    requestType: string;
    action: 'APPROVE' | 'REJECT' | 'CANCEL' | 'OVERRIDE';
    comment?: string;
}

/**
 * SLA calculation result
 */
export interface SLACalculation {
    level: ApprovalLevel;
    slaHours: number;
    startedAt: string;
    deadline: string;
    hoursElapsed: number;
    percentElapsed: number;
    isOverdue: boolean;
    reminders: {
        percentSLA: number;
        sent: boolean;
        sentAt?: string;
    }[];
}
