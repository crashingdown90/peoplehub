// @ai:ag - Created by Antigravity
// Debounce hook for delayed value updates

'use client';

import { useState, useEffect } from 'react';
import { useRef } from 'react';

/**
 * Hook to debounce a value
 * Useful for search inputs to avoid too many API calls
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up the timeout
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up on value change or unmount
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook to debounce a callback function
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
    callback: T,
    delay: number = 300
): T {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedCallback = ((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }) as T;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}
