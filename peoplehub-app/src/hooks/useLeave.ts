// @ai:ag - Created by Antigravity
// Leave hook

'use client';

import { useState, useCallback } from 'react';
import {
    LeaveBalance,
    LeaveRequest,
    CreateLeaveRequest,
    LeaveSummary,
    LeaveType
} from '@/types';

interface UseLeaveReturn {
    balances: LeaveBalance[];
    leaveTypes: LeaveType[];
    summary: LeaveSummary[];
    requests: LeaveRequest[];
    isLoading: boolean;
    error: string | null;
    fetchBalances: () => Promise<void>;
    fetchLeaveTypes: () => Promise<void>;
    fetchRequests: (status?: string) => Promise<void>;
    submitRequest: (data: CreateLeaveRequest) => Promise<boolean>;
    cancelRequest: (requestId: string) => Promise<boolean>;
}

/**
 * Hook to manage leave operations
 */
export function useLeave(): UseLeaveReturn {
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [summary, setSummary] = useState<LeaveSummary[]>([]);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBalances = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/leave/balance');
            const data = await response.json();

            if (data.success) {
                setBalances(data.data.balances || []);
                setSummary(data.data.summary || []);
            } else {
                setError(data.message || 'Failed to fetch balances');
            }
        } catch (err) {
            setError('Failed to fetch balances');
            console.error('Error fetching balances:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchLeaveTypes = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/leave/types');
            const data = await response.json();

            if (data.success) {
                setLeaveTypes(data.data || []);
            } else {
                setError(data.message || 'Failed to fetch leave types');
            }
        } catch (err) {
            setError('Failed to fetch leave types');
            console.error('Error fetching leave types:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchRequests = useCallback(async (status?: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const url = status
                ? `/api/leave/request?status=${status}`
                : '/api/leave/request';

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setRequests(data.data || []);
            } else {
                setError(data.message || 'Failed to fetch requests');
            }
        } catch (err) {
            setError('Failed to fetch requests');
            console.error('Error fetching requests:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitRequest = useCallback(
        async (requestData: CreateLeaveRequest): Promise<boolean> => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch('/api/leave/request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });

                const data = await response.json();

                if (data.success) {
                    await fetchRequests();
                    await fetchBalances();
                    return true;
                } else {
                    setError(data.message || 'Failed to submit request');
                    return false;
                }
            } catch (err) {
                setError('Failed to submit request');
                console.error('Error submitting request:', err);
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [fetchRequests, fetchBalances]
    );

    const cancelRequest = useCallback(
        async (requestId: string): Promise<boolean> => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch(`/api/leave/request/${requestId}`, {
                    method: 'DELETE',
                });

                const data = await response.json();

                if (data.success) {
                    await fetchRequests();
                    await fetchBalances();
                    return true;
                } else {
                    setError(data.message || 'Failed to cancel request');
                    return false;
                }
            } catch (err) {
                setError('Failed to cancel request');
                console.error('Error cancelling request:', err);
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [fetchRequests, fetchBalances]
    );

    return {
        balances,
        leaveTypes,
        summary,
        requests,
        isLoading,
        error,
        fetchBalances,
        fetchLeaveTypes,
        fetchRequests,
        submitRequest,
        cancelRequest,
    };
}

export type { UseLeaveReturn };
