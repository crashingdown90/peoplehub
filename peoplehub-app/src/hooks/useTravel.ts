// @ai:ag - Created by Antigravity
// Travel hook for managing travel requests

'use client';

import { useState, useCallback } from 'react';
import {
    TravelRequest,
    TravelSummary,
    CreateTravelRequestInput,
    ApiResponse,
    PaginatedResponse,
    ApprovalStatus,
} from '@/types';
import { API_ROUTES } from '@/constants';
import { getErrorMessage } from '@/utils';

interface UseTravelReturn {
    // Data
    requests: TravelRequest[];
    summary: TravelSummary | null;
    currentRequest: TravelRequest | null;

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
    createRequest: (data: CreateTravelRequestInput) => Promise<boolean>;
    cancelRequest: (id: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

/**
 * Hook for managing travel requests
 */
export function useTravel(): UseTravelReturn {
    const [requests, setRequests] = useState<TravelRequest[]>([]);
    const [summary, setSummary] = useState<TravelSummary | null>(null);
    const [currentRequest, setCurrentRequest] = useState<TravelRequest | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch travel requests
    const fetchRequests = useCallback(async (pageNum = 1) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_ROUTES.TRAVEL.REQUESTS}?page=${pageNum}`);
            const data: ApiResponse<PaginatedResponse<TravelRequest>> = await response.json();

            if (data.success && data.data) {
                setRequests(data.data.data);
                setPage(data.data.pagination.page);
                setTotalPages(data.data.pagination.totalPages);
            } else {
                setError(data.error?.message || 'Gagal memuat daftar perjalanan dinas');
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
            const response = await fetch(API_ROUTES.TRAVEL.SUMMARY);
            const data: ApiResponse<TravelSummary> = await response.json();

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
            const response = await fetch(`${API_ROUTES.TRAVEL.REQUESTS}/${id}`);
            const data: ApiResponse<TravelRequest> = await response.json();

            if (data.success && data.data) {
                setCurrentRequest(data.data);
            } else {
                setError(data.error?.message || 'Gagal memuat detail perjalanan');
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Terjadi kesalahan saat memuat detail'));
            console.error('fetchRequest error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create travel request
    const createRequest = useCallback(async (
        data: CreateTravelRequestInput
    ): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(API_ROUTES.TRAVEL.REQUESTS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result: ApiResponse<TravelRequest> = await response.json();

            if (result.success) {
                // Refresh list
                await fetchRequests();
                return true;
            } else {
                setError(result.error?.message || 'Gagal membuat pengajuan perjalanan');
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
            const response = await fetch(`${API_ROUTES.TRAVEL.REQUESTS}/${id}/cancel`, {
                method: 'POST',
            });

            const result: ApiResponse<TravelRequest> = await response.json();

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

export type { UseTravelReturn };
