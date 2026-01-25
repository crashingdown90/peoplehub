// @ai:ag - Created by Antigravity
// KPI hook for managing performance indicators

'use client';

import { useState, useCallback } from 'react';
import {
    KpiPeriod,
    KpiTarget,
    KpiSummary,
    UpdateKpiTargetInput,
    ApiResponse,
} from '@/types';
import { API_ROUTES } from '@/constants';
import { getErrorMessage } from '@/utils';

interface UseKpiReturn {
    // Data
    periods: KpiPeriod[];
    activePeriod: KpiPeriod | null;
    myTargets: KpiTarget[];
    summary: KpiSummary | null;

    // State
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchPeriods: () => Promise<void>;
    fetchMyTargets: (periodId?: string) => Promise<void>;
    fetchSummary: (periodId: string) => Promise<void>;
    updateActualValue: (targetId: string, data: UpdateKpiTargetInput) => Promise<boolean>;
    refresh: () => Promise<void>;
}

/**
 * Hook for managing KPI data
 */
export function useKpi(): UseKpiReturn {
    const [periods, setPeriods] = useState<KpiPeriod[]>([]);
    const [activePeriod, setActivePeriod] = useState<KpiPeriod | null>(null);
    const [myTargets, setMyTargets] = useState<KpiTarget[]>([]);
    const [summary, setSummary] = useState<KpiSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch KPI periods
    const fetchPeriods = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(API_ROUTES.KPI.PERIODS);
            const data: ApiResponse<KpiPeriod[]> = await response.json();

            if (data.success && data.data) {
                setPeriods(data.data);
                // Find active period
                const active = data.data.find(p => p.status === 'ACTIVE');
                setActivePeriod(active || null);
            } else {
                setError(data.error?.message || 'Gagal memuat periode KPI');
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Terjadi kesalahan saat memuat data'));
            console.error('fetchPeriods error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch user's KPI targets
    const fetchMyTargets = useCallback(async (periodId?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const url = periodId
                ? `${API_ROUTES.KPI.MY_TARGETS}?periodId=${periodId}`
                : API_ROUTES.KPI.MY_TARGETS;

            const response = await fetch(url);
            const data: ApiResponse<KpiTarget[]> = await response.json();

            if (data.success && data.data) {
                setMyTargets(data.data);
            } else {
                setError(data.error?.message || 'Gagal memuat target KPI');
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Terjadi kesalahan saat memuat target'));
            console.error('fetchMyTargets error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch KPI summary
    const fetchSummary = useCallback(async (periodId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_ROUTES.KPI.SUMMARY}?periodId=${periodId}`);
            const data: ApiResponse<KpiSummary> = await response.json();

            if (data.success && data.data) {
                setSummary(data.data);
            } else {
                setError(data.error?.message || 'Gagal memuat ringkasan KPI');
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Terjadi kesalahan saat memuat ringkasan'));
            console.error('fetchSummary error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update actual value
    const updateActualValue = useCallback(async (
        targetId: string,
        data: UpdateKpiTargetInput
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_ROUTES.KPI.TARGETS}/${targetId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result: ApiResponse<KpiTarget> = await response.json();

            if (result.success) {
                // Update local state
                setMyTargets(prev =>
                    prev.map(t => t.id === targetId ? { ...t, ...data } : t)
                );
                return true;
            } else {
                setError(result.error?.message || 'Gagal memperbarui nilai aktual');
                return false;
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Terjadi kesalahan saat memperbarui data'));
            console.error('updateActualValue error:', err);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Refresh all data
    const refresh = useCallback(async () => {
        await fetchPeriods();
        if (activePeriod) {
            await fetchMyTargets(activePeriod.id);
            await fetchSummary(activePeriod.id);
        }
    }, [fetchPeriods, fetchMyTargets, fetchSummary, activePeriod]);

    return {
        periods,
        activePeriod,
        myTargets,
        summary,
        isLoading,
        error,
        fetchPeriods,
        fetchMyTargets,
        fetchSummary,
        updateActualValue,
        refresh,
    };
}

export type { UseKpiReturn };
