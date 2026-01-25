// @ai:ag - Created by Antigravity
// Local storage hook with SSR support

'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Get localStorage value safely
 */
function getStorageValue<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') {
        return fallback;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

/**
 * Hook to persist state in localStorage with SSR support
 * Uses useSyncExternalStore for hydration-safe reads
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {

    // Subscribe to storage events
    const subscribe = useCallback((onStoreChange: () => void) => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === key || e.key === null) {
                onStoreChange();
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [key]);

    // Get current value from localStorage
    const getSnapshot = useCallback(() => {
        return getStorageValue(key, initialValue);
    }, [key, initialValue]);

    // Return initial value on server
    const getServerSnapshot = useCallback(() => {
        return initialValue;
    }, [initialValue]);

    // Read value using useSyncExternalStore
    const storedValue = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
    );

    // Set value and persist to localStorage
    const setValue = useCallback(
        (newValue: T | ((prev: T) => T)) => {
            try {
                const currentValue = getStorageValue(key, initialValue);
                const valueToStore = newValue instanceof Function ? newValue(currentValue) : newValue;

                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                    // Dispatch storage event for this tab (storage event only fires for other tabs)
                    window.dispatchEvent(new StorageEvent('storage', { key }));
                }
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key, initialValue]
    );

    // Remove from localStorage
    const removeValue = useCallback(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
                window.dispatchEvent(new StorageEvent('storage', { key }));
            }
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }, [key]);

    return [storedValue, setValue, removeValue];
}

/**
 * Hook to get a value from localStorage (read-only)
 */
export function useLocalStorageValue<T>(key: string, fallback: T): T {
    const [value] = useLocalStorage<T>(key, fallback);
    return value;
}
