// @ai:ag - Created by Antigravity
// Approval Timeline component for multi-level approval workflow
'use client';

import React from 'react';
import type { ApprovalLevel, ApprovalRecord } from '@/types/approval-flow.types';
import { APPROVAL_LEVEL_CONFIG } from '@/types/approval-flow.types';

export interface ApprovalTimelineProps {
    /**
     * The full approval chain for this request
     */
    approvalChain: ApprovalLevel[];

    /**
     * Current approval level (null if completed)
     */
    currentLevel: ApprovalLevel | null;

    /**
     * Approval records for each level
     */
    approvals: ApprovalRecord[];

    /**
     * Whether to show compact version
     */
    compact?: boolean;

    /**
     * Vertical or horizontal layout
     */
    orientation?: 'vertical' | 'horizontal';
}

/**
 * Get status icon for approval record
 */
function StatusIcon({ status }: { status: ApprovalRecord['status'] }) {
    switch (status) {
        case 'APPROVED':
            return (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            );
        case 'REJECTED':
            return (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        case 'SKIPPED':
            return (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
            );
        case 'ESCALATED':
            return (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            );
        case 'PENDING':
        default:
            return (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
    }
}

/**
 * Get background color for status
 */
function getStatusColor(status: ApprovalRecord['status'], isCurrent: boolean): string {
    if (isCurrent && status === 'PENDING') {
        return 'bg-blue-600 ring-4 ring-blue-200';
    }

    switch (status) {
        case 'APPROVED':
            return 'bg-green-600';
        case 'REJECTED':
            return 'bg-red-600';
        case 'SKIPPED':
            return 'bg-gray-400';
        case 'ESCALATED':
            return 'bg-orange-500';
        case 'PENDING':
        default:
            return 'bg-gray-300';
    }
}

/**
 * Format date for display
 */
function formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Single timeline item
 */
function TimelineItem({
    level,
    record,
    isCurrent,
    isLast,
    compact,
    orientation,
}: {
    level: ApprovalLevel;
    record: ApprovalRecord | undefined;
    isCurrent: boolean;
    isLast: boolean;
    compact: boolean;
    orientation: 'vertical' | 'horizontal';
}) {
    const config = APPROVAL_LEVEL_CONFIG[level];
    const status = record?.status || 'PENDING';
    const statusColor = getStatusColor(status, isCurrent);

    if (orientation === 'horizontal') {
        return (
            <div className="flex items-center">
                {/* Node */}
                <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColor}`}>
                        <StatusIcon status={status} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 mt-1">{config.label}</span>
                    {record?.approverName && (
                        <span className="text-xs text-gray-400">{record.approverName}</span>
                    )}
                </div>

                {/* Connector */}
                {!isLast && (
                    <div
                        className={`h-1 w-12 mx-2 ${status === 'APPROVED' ? 'bg-green-600' :
                                status === 'REJECTED' ? 'bg-red-600' :
                                    'bg-gray-200'
                            }`}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex">
            {/* Node and connector */}
            <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColor}`}>
                    <StatusIcon status={status} />
                </div>
                {!isLast && (
                    <div
                        className={`w-0.5 flex-1 min-h-[40px] ${status === 'APPROVED' ? 'bg-green-600' :
                                status === 'REJECTED' ? 'bg-red-600' :
                                    'bg-gray-200'
                            }`}
                    />
                )}
            </div>

            {/* Content */}
            <div className="ml-4 pb-8">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{config.label}</span>
                    {isCurrent && status === 'PENDING' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                            Menunggu
                        </span>
                    )}
                    {record?.isDelegated && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                            Delegasi
                        </span>
                    )}
                </div>

                {!compact && (
                    <>
                        {record?.approverName && (
                            <p className="text-sm text-gray-600 mt-1">
                                {record.approverName}
                                {record.approverRole && ` (${record.approverRole})`}
                            </p>
                        )}

                        {record?.isDelegated && record.delegatedFromName && (
                            <p className="text-xs text-purple-600 mt-0.5">
                                Didelegasikan dari {record.delegatedFromName}
                            </p>
                        )}

                        {record?.timestamp && (
                            <p className="text-xs text-gray-400 mt-1">
                                {formatDate(record.timestamp)}
                            </p>
                        )}

                        {record?.comment && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                &ldquo;{record.comment}&rdquo;
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * Approval Timeline Component
 * 
 * Displays the multi-level approval chain with:
 * - Visual progress indicator
 * - Status icons for each level
 * - Approver information
 * - Delegation badges
 * - Comments/notes
 */
export function ApprovalTimeline({
    approvalChain,
    currentLevel,
    approvals,
    compact = false,
    orientation = 'vertical',
}: ApprovalTimelineProps) {
    // Create a map of records by level for quick lookup
    const recordsMap = new Map<ApprovalLevel, ApprovalRecord>();
    approvals.forEach((record) => {
        recordsMap.set(record.level, record);
    });

    if (orientation === 'horizontal') {
        return (
            <div className="flex items-start justify-center py-4">
                {approvalChain.map((level, index) => (
                    <TimelineItem
                        key={level}
                        level={level}
                        record={recordsMap.get(level)}
                        isCurrent={level === currentLevel}
                        isLast={index === approvalChain.length - 1}
                        compact={compact}
                        orientation={orientation}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="py-4">
            {approvalChain.map((level, index) => (
                <TimelineItem
                    key={level}
                    level={level}
                    record={recordsMap.get(level)}
                    isCurrent={level === currentLevel}
                    isLast={index === approvalChain.length - 1}
                    compact={compact}
                    orientation={orientation}
                />
            ))}
        </div>
    );
}

export default ApprovalTimeline;
