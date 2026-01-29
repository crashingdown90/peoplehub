// @ai:ag - Created by Antigravity
// Generic async operation hook

'use client';

import { useState, useCallback } from 'react';

interface AsyncState<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
}

interface UseAsyncReturn<T, P extends unknown[]> extends AsyncState<T> {
    execute: (...params: P) => Promise<T | null>;
    reset: () => void;
    setData: (data: T | null) => void;
}

/**
 * Generic hook for handling async operations with loading and error states
 */
export function useAsync<T, P extends unknown[] = []>(
    asyncFunction: (...params: P) => Promise<T>,
    immediate: boolean = false
): UseAsyncReturn<T, P> {
    const [state, setState] = useState<AsyncState<T>>({
        data: null,
        isLoading: immediate,
        error: null,
    });

    const execute = useCallback(
        async (...params: P): Promise<T | null> => {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const result = await asyncFunction(...params);
                setState({ data: result, isLoading: false, error: null });
                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An error occurred';
                setState({ data: null, isLoading: false, error: errorMessage });
                return null;
            }
        },
        [asyncFunction]
    );

    const reset = useCallback(() => {
        setState({ data: null, isLoading: false, error: null });
    }, []);

    const setData = useCallback((data: T | null) => {
        setState((prev) => ({ ...prev, data }));
    }, []);

    return {
        ...state,
        execute,
        reset,
        setData,
    };
}

/**
 * Simplified hook for fetching data
 */
export function useFetch<T>(url: string, options?: RequestInit) {
    const fetchData = useCallback(async (): Promise<T> => {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }, [url, options]);

    return useAsync<T, []>(fetchData);
}
