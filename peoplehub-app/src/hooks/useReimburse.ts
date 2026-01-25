// @ai:ag - Created by Antigravity
// Reimburse hook for managing reimbursement requests

'use client';

import { useState, useCallback } from 'react';
import {
    ReimburseRequest,
    ReimburseSummary,
    CreateReimburseRequestInput,
    ApiResponse,
    PaginatedResponse,
    ApprovalStatus,
} from '@/types';
import { API_ROUTES } from '@/constants';
import { getErrorMessage } from '@/utils';

interface UseReimburseReturn {
    // Data
    requests: ReimburseRequest[];
    summary: ReimburseSummary | null;
    currentRequest: ReimburseRequest | null;

    // Pagination
    page: number;
    totalPages: number;

    // State
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;

    // Actions
    fetchRequests: (page?: number) => Promise<void>;
    fetchSummary: () => Promise<void>;
    fetchRequest: (id: string) => Promise<void>;
    createRequest: (data: CreateReimburseRequestInput) => Promise<boolean>;
    cancelRequest: (id: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

/**
 * Hook for managing reimbursement requests
 */
export function useReimburse(): UseReimburseReturn {
    const [requests, setRequests] = useState<ReimburseRequest[]>([]);
    const [summary, setSummary] = useState<ReimburseSummary | null>(null);
    const [currentRequest, setCurrentRequest] = useState<ReimburseRequest | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch reimburse requests
    const fetchRequests = useCallback(async (pageNum = 1) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_ROUTES.REIMBURSE.REQUESTS}?page=${pageNum}`);
            const data: ApiResponse<PaginatedResponse<ReimburseRequest>> = await response.json();

            if (data.success && data.data) {
                setRequests(data.data.data);
                setPage(data.data.pagination.page);
                setTotalPages(data.data.pagination.totalPages);
            } else {
                setError(data.error?.message || 'Gagal memuat daftar reimburse');
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Terjadi kesalahan saat memuat data'));
            console.error('fetchRequests error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch summary
    const fetchSummary = useCallback(async () => {
        try {
            const response = await fetch(API_ROUTES.REIMBURSE.SUMMARY);
            const data: ApiResponse<ReimburseSummary> = await response.json();

            if (data.success && data.data) {
                setSummary(data.data);
            }
        } catch (err) {
            console.error('fetchSummary error:', err);
        }
    }, []);

    // Fetch single request
    const fetchRequest = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_ROUTES.REIMBURSE.REQUESTS}/${id}`);
            const data: ApiResponse<ReimburseRequest> = await response.json();

            if (data.success && data.data) {
                setCurrentRequest(data.data);
            } else {
                setError(data.error?.message || 'Gagal memuat detail reimburse');
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Terjadi kesalahan saat memuat detail'));
            console.error('fetchRequest error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create reimburse request
    const createRequest = useCallback(async (
        data: CreateReimburseRequestInput
    ): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(API_ROUTES.REIMBURSE.REQUESTS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result: ApiResponse<ReimburseRequest> = await response.json();

            if (result.success) {
                // Refresh list
                await fetchRequests();
                return true;
            } else {
                setError(result.error?.message || 'Gagal membuat pengajuan reimburse');
                return false;
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Terjadi kesalahan saat membuat pengajuan'));
            console.error('createRequest error:', err);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [fetchRequests]);

    // Cancel request
    const cancelRequest = useCallback(async (id: string): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`${API_ROUTES.REIMBURSE.REQUESTS}/${id}/cancel`, {
                method: 'POST',
            });

            const result: ApiResponse<ReimburseRequest> = await response.json();

            if (result.success) {
                // Update local state
                setRequests(prev =>
                    prev.map(r => r.id === id ? { ...r, status: ApprovalStatus.CANCELLED } : r)
                );
                return true;
            } else {
                setError(result.error?.message || 'Gagal membatalkan pengajuan');
                return false;
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Terjadi kesalahan saat membatalkan'));
            console.error('cancelRequest error:', err);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    // Refresh all data
    const refresh = useCallback(async () => {
        await Promise.all([
            fetchRequests(page),
            fetchSummary(),
        ]);
    }, [fetchRequests, fetchSummary, page]);

    return {
        requests,
        summary,
        currentRequest,
        page,
        totalPages,
        isLoading,
        isSubmitting,
        error,
        fetchRequests,
        fetchSummary,
        fetchRequest,
        createRequest,
        cancelRequest,
        refresh,
    };
}

export type { UseReimburseReturn };
