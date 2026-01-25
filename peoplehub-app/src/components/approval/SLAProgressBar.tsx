// @ai:ag - Created by Antigravity
// SLA Progress Bar component for approval deadlines
'use client';

import React from 'react';

export interface SLAProgressBarProps {
    /**
     * When the request was submitted/moved to current level
     */
    startedAt: string;

    /**
     * SLA deadline
     */
    deadline: string;

    /**
     * Percentage of SLA elapsed (0-100+)
     */
    percentElapsed: number;

    /**
     * Whether the SLA is overdue
     */
    isOverdue: boolean;

    /**
     * Show detailed time info
     */
    showDetails?: boolean;

    /**
     * Compact mode
     */
    compact?: boolean;
}

/**
 * Get color based on percentage
 */
function getProgressColor(percent: number): string {
    if (percent >= 100) return 'bg-red-600';
    if (percent >= 80) return 'bg-red-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
}

/**
 * Get background color based on percentage
 */
function getBackgroundColor(percent: number): string {
    if (percent >= 100) return 'bg-red-100';
    if (percent >= 80) return 'bg-red-50';
    if (percent >= 50) return 'bg-yellow-50';
    return 'bg-green-50';
}

/**
 * Format time remaining
 */
function formatTimeRemaining(deadline: string): string {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();

    if (diffMs <= 0) {
        const overdueMs = Math.abs(diffMs);
        const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
        const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));

        if (overdueHours > 24) {
            const days = Math.floor(overdueHours / 24);
            return `Terlambat ${days} hari`;
        }
        if (overdueHours > 0) {
            return `Terlambat ${overdueHours}j ${overdueMinutes}m`;
        }
        return `Terlambat ${overdueMinutes} menit`;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}h ${remainingHours}j tersisa`;
    }
    if (hours > 0) {
        return `${hours}j ${minutes}m tersisa`;
    }
    return `${minutes} menit tersisa`;
}

/**
 * Format date for tooltip
 */
function formatDateTime(dateString: string): string {
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
 * SLA Progress Bar Component
 * 
 * Displays SLA progress with:
 * - Visual progress bar
 * - Time remaining/overdue
 * - Color coding (green → yellow → red)
 * - Overdue indicator
 */
export function SLAProgressBar({
    startedAt,
    deadline,
    percentElapsed,
    isOverdue,
    showDetails = false,
    compact = false,
}: SLAProgressBarProps) {
    const progressColor = getProgressColor(percentElapsed);
    const backgroundColor = getBackgroundColor(percentElapsed);
    const displayPercent = Math.min(percentElapsed, 100);
    const timeRemaining = formatTimeRemaining(deadline);

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {/* Mini progress bar */}
                <div className={`w-16 h-1.5 rounded-full ${backgroundColor}`}>
                    <div
                        className={`h-full rounded-full ${progressColor} transition-all duration-300`}
                        style={{ width: `${displayPercent}%` }}
                    />
                </div>

                {/* Time text */}
                <span
                    className={`text-xs font-medium ${isOverdue ? 'text-red-600' :
                            percentElapsed >= 80 ? 'text-red-500' :
                                percentElapsed >= 50 ? 'text-yellow-600' :
                                    'text-green-600'
                        }`}
                >
                    {timeRemaining}
                </span>

                {isOverdue && (
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                )}
            </div>
        );
    }

    return (
        <div className={`p-3 rounded-lg ${backgroundColor}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">SLA Progress</span>
                <span
                    className={`text-sm font-semibold ${isOverdue ? 'text-red-600' :
                            percentElapsed >= 80 ? 'text-red-500' :
                                percentElapsed >= 50 ? 'text-yellow-600' :
                                    'text-green-600'
                        }`}
                >
                    {timeRemaining}
                </span>
            </div>

            {/* Progress bar */}
            <div className="relative">
                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <div
                        className={`h-full ${progressColor} transition-all duration-300`}
                        style={{ width: `${displayPercent}%` }}
                    />
                </div>

                {/* Markers at 50% and 80% */}
                <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-yellow-300" />
                <div className="absolute top-0 left-[80%] w-0.5 h-2 bg-red-300" />
            </div>

            {/* Percentage */}
            <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">0%</span>
                <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'
                    }`}>
                    {Math.round(percentElapsed)}%
                </span>
                <span className="text-xs text-gray-500">100%</span>
            </div>

            {/* Details */}
            {showDetails && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Mulai:</span>
                        <span className="text-gray-700">{formatDateTime(startedAt)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Deadline:</span>
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                            {formatDateTime(deadline)}
                        </span>
                    </div>
                </div>
            )}

            {/* Overdue badge */}
            {isOverdue && (
                <div className="mt-2 flex items-center gap-2 text-red-600">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-xs font-medium">SLA Terlewati - Eskalasi Otomatis</span>
                </div>
            )}
        </div>
    );
}

export default SLAProgressBar;
