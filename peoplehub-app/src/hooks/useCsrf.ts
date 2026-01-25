// @ai:cl - React hook for CSRF token management
"use client";

import { useState, useEffect, useCallback } from "react";
import { CSRF_CONFIG } from "@/lib/security/csrf";

interface UseCsrfOptions {
    autoFetch?: boolean;
}

interface UseCsrfReturn {
    token: string | null;
    loading: boolean;
    error: Error | null;
    refreshToken: () => Promise<void>;
    getHeaders: () => Record<string, string>;
}

/**
 * React hook for CSRF token management in forms
 * 
 * Usage:
 * ```tsx
 * const { token, getHeaders } = useCsrf();
 * 
 * const handleSubmit = async () => {
 *   await fetch('/api/some-endpoint', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       ...getHeaders(),
 *     },
 *     body: JSON.stringify(data),
 *   });
 * };
 * ```
 */
export function useCsrf(options: UseCsrfOptions = {}): UseCsrfReturn {
    const { autoFetch = true } = options;
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchToken = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/auth/csrf", {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch CSRF token");
            }

            const data = await response.json();
            setToken(data.token);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Unknown error"));
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshToken = useCallback(async () => {
        await fetchToken();
    }, [fetchToken]);

    const getHeaders = useCallback((): Record<string, string> => {
        if (!token) {
            return {};
        }
        return {
            [CSRF_CONFIG.headerName]: token,
        };
    }, [token]);

    useEffect(() => {
        if (autoFetch) {
            fetchToken();
        }
    }, [autoFetch, fetchToken]);

    return {
        token,
        loading,
        error,
        refreshToken,
        getHeaders,
    };
}

/**
 * Utility function to add CSRF headers to fetch options
 */
export function withCsrfHeaders(
    token: string | null,
    headers: Record<string, string> = {}
): Record<string, string> {
    if (!token) {
        return headers;
    }
    return {
        ...headers,
        [CSRF_CONFIG.headerName]: token,
    };
}
