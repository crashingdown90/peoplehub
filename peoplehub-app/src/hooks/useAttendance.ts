// @ai:ag - Created by Antigravity
// Attendance hook

'use client';

import { useState, useCallback } from 'react';
import { TodayAttendance, ClockInRequest, ClockOutRequest, AttendanceSummary } from '@/types';

interface UseAttendanceReturn {
    todayAttendance: TodayAttendance | null;
    summary: AttendanceSummary | null;
    isLoading: boolean;
    isClockingIn: boolean;
    isClockingOut: boolean;
    error: string | null;
    fetchTodayAttendance: () => Promise<void>;
    fetchSummary: (period?: string) => Promise<void>;
    clockIn: (data?: ClockInRequest) => Promise<boolean>;
    clockOut: (data?: ClockOutRequest) => Promise<boolean>;
}

/**
 * Hook to manage attendance operations
 */
export function useAttendance(): UseAttendanceReturn {
    const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isClockingIn, setIsClockingIn] = useState(false);
    const [isClockingOut, setIsClockingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTodayAttendance = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/attendance/today');
            const data = await response.json();

            if (data.success) {
                setTodayAttendance(data.data);
            } else {
                setError(data.message || 'Failed to fetch attendance');
            }
        } catch (err) {
            setError('Failed to fetch attendance');
            console.error('Error fetching attendance:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchSummary = useCallback(async (period?: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const url = period
                ? `/api/attendance/summary?period=${period}`
                : '/api/attendance/summary';

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setSummary(data.data);
            } else {
                setError(data.message || 'Failed to fetch summary');
            }
        } catch (err) {
            setError('Failed to fetch summary');
            console.error('Error fetching summary:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clockIn = useCallback(async (requestData?: ClockInRequest): Promise<boolean> => {
        try {
            setIsClockingIn(true);
            setError(null);

            const response = await fetch('/api/attendance/clock-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData || {}),
            });

            const data = await response.json();

            if (data.success) {
                await fetchTodayAttendance();
                return true;
            } else {
                setError(data.message || 'Failed to clock in');
                return false;
            }
        } catch (err) {
            setError('Failed to clock in');
            console.error('Error clocking in:', err);
            return false;
        } finally {
            setIsClockingIn(false);
        }
    }, [fetchTodayAttendance]);

    const clockOut = useCallback(async (requestData?: ClockOutRequest): Promise<boolean> => {
        try {
            setIsClockingOut(true);
            setError(null);

            const response = await fetch('/api/attendance/clock-out', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData || {}),
            });

            const data = await response.json();

            if (data.success) {
                await fetchTodayAttendance();
                return true;
            } else {
                setError(data.message || 'Failed to clock out');
                return false;
            }
        } catch (err) {
            setError('Failed to clock out');
            console.error('Error clocking out:', err);
            return false;
        } finally {
            setIsClockingOut(false);
        }
    }, [fetchTodayAttendance]);

    return {
        todayAttendance,
        summary,
        isLoading,
        isClockingIn,
        isClockingOut,
        error,
        fetchTodayAttendance,
        fetchSummary,
        clockIn,
        clockOut,
    };
}

export type { UseAttendanceReturn };
