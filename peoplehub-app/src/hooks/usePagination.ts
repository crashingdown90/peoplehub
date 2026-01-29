// @ai:ag - Created by Antigravity
// Pagination hook for managing table pagination

'use client';

import { useState, useCallback, useMemo } from 'react';
import { PAGINATION } from '@/constants';

interface UsePaginationOptions {
    initialPage?: number;
    initialLimit?: number;
    totalItems?: number;
}

interface UsePaginationReturn {
    page: number;
    limit: number;
    offset: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    startIndex: number;
    endIndex: number;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setTotalItems: (total: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
    reset: () => void;
}

/**
 * Hook for managing pagination state
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
    const {
        initialPage = PAGINATION.defaultPage,
        initialLimit = PAGINATION.defaultLimit,
        totalItems: initialTotalItems = 0,
    } = options;

    const [page, setPageState] = useState(initialPage);
    const [limit, setLimitState] = useState(initialLimit);
    const [totalItems, setTotalItemsState] = useState(initialTotalItems);

    // Computed values
    const totalPages = useMemo(
        () => Math.ceil(totalItems / limit) || 1,
        [totalItems, limit]
    );

    const hasNext = useMemo(() => page < totalPages, [page, totalPages]);
    const hasPrev = useMemo(() => page > 1, [page]);

    const offset = useMemo(() => (page - 1) * limit, [page, limit]);

    const startIndex = useMemo(
        () => (totalItems === 0 ? 0 : offset + 1),
        [totalItems, offset]
    );

    const endIndex = useMemo(
        () => Math.min(offset + limit, totalItems),
        [offset, limit, totalItems]
    );

    // Actions
    const setPage = useCallback(
        (newPage: number) => {
            const validPage = Math.max(1, Math.min(newPage, totalPages));
            setPageState(validPage);
        },
        [totalPages]
    );

    const setLimit = useCallback((newLimit: number) => {
        const validLimit = Math.min(Math.max(1, newLimit), PAGINATION.maxLimit);
        setLimitState(validLimit);
        setPageState(1); // Reset to first page when limit changes
    }, []);

    const setTotalItems = useCallback((total: number) => {
        setTotalItemsState(Math.max(0, total));
    }, []);

    const nextPage = useCallback(() => {
        if (hasNext) {
            setPageState((prev) => prev + 1);
        }
    }, [hasNext]);

    const prevPage = useCallback(() => {
        if (hasPrev) {
            setPageState((prev) => prev - 1);
        }
    }, [hasPrev]);

    const firstPage = useCallback(() => {
        setPageState(1);
    }, []);

    const lastPage = useCallback(() => {
        setPageState(totalPages);
    }, [totalPages]);

    const reset = useCallback(() => {
        setPageState(initialPage);
        setLimitState(initialLimit);
    }, [initialPage, initialLimit]);

    return {
        page,
        limit,
        offset,
        totalItems,
        totalPages,
        hasNext,
        hasPrev,
        startIndex,
        endIndex,
        setPage,
        setLimit,
        setTotalItems,
        nextPage,
        prevPage,
        firstPage,
        lastPage,
        reset,
    };
}

export type { UsePaginationReturn };
