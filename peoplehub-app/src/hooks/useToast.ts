// @ai:ag - Created by Antigravity
// Toast notification hook

'use client';

import { useState, useCallback, useRef } from 'react';
import { ToastType, ToastMessage } from '@/types';
import { TOAST_CONFIG } from '@/constants';

// Shadcn-style toast config
interface ToastConfig {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
}

interface UseToastReturn {
    toasts: ToastMessage[];
    addToast: (toast: Omit<ToastMessage, 'id'>) => string;
    removeToast: (id: string) => void;
    clearToasts: () => void;
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
    toast: (config: ToastConfig) => string;
}

/**
 * Generate unique ID for toast
 */
function generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hook for managing toast notifications
 */
export function useToast(): UseToastReturn {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    // Remove toast by ID
    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));

        // Clear timeout if exists
        const timeout = timeoutsRef.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(id);
        }
    }, []);

    // Add toast
    const addToast = useCallback(
        (toast: Omit<ToastMessage, 'id'>): string => {
            const id = generateId();
            const duration = toast.duration ?? getDurationByType(toast.type);

            const newToast: ToastMessage = {
                ...toast,
                id,
                duration,
            };

            setToasts((prev) => [...prev, newToast]);

            // Auto remove after duration
            if (duration > 0) {
                const timeout = setTimeout(() => {
                    removeToast(id);
                }, duration);
                timeoutsRef.current.set(id, timeout);
            }

            return id;
        },
        [removeToast]
    );

    // Clear all toasts
    const clearToasts = useCallback(() => {
        setToasts([]);

        // Clear all timeouts
        timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        timeoutsRef.current.clear();
    }, []);

    // Shorthand methods
    const success = useCallback(
        (title: string, message?: string): string => {
            return addToast({ type: 'success', title, message });
        },
        [addToast]
    );

    const error = useCallback(
        (title: string, message?: string): string => {
            return addToast({ type: 'error', title, message });
        },
        [addToast]
    );

    const warning = useCallback(
        (title: string, message?: string): string => {
            return addToast({ type: 'warning', title, message });
        },
        [addToast]
    );

    const info = useCallback(
        (title: string, message?: string): string => {
            return addToast({ type: 'info', title, message });
        },
        [addToast]
    );

    // Shadcn-compatible toast function
    const toast = useCallback(
        (config: ToastConfig): string => {
            const type: ToastType = config.variant === 'destructive' ? 'error' : 'success';
            return addToast({ type, title: config.title, message: config.description });
        },
        [addToast]
    );

    return {
        toasts,
        addToast,
        removeToast,
        clearToasts,
        success,
        error,
        warning,
        info,
        toast,
    };
}

/**
 * Get duration based on toast type
 */
function getDurationByType(type: ToastType): number {
    switch (type) {
        case 'success':
            return TOAST_CONFIG.successDuration;
        case 'error':
            return TOAST_CONFIG.errorDuration;
        default:
            return TOAST_CONFIG.defaultDuration;
    }
}

export type { UseToastReturn };
