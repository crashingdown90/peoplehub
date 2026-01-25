// @ai:ag - Created by Antigravity
// Table state management hook

'use client';

import { useState, useCallback, useMemo } from 'react';
import { SortConfig, FilterParams, PaginationParams } from '@/types';
import { PAGINATION } from '@/constants';

interface UseTableOptions<T> {
    data: T[];
    initialPage?: number;
    initialLimit?: number;
    initialSort?: SortConfig;
    initialFilters?: FilterParams;
    serverSide?: boolean;
}

interface UseTableReturn<T> {
    // Data
    displayData: T[];
    totalItems: number;

    // Pagination
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    nextPage: () => void;
    prevPage: () => void;

    // Sorting
    sortConfig: SortConfig | null;
    setSortConfig: (config: SortConfig | null) => void;
    toggleSort: (field: string) => void;

    // Filtering
    filters: FilterParams;
    setFilters: (filters: FilterParams) => void;
    setFilter: (key: string, value: string | undefined) => void;
    clearFilters: () => void;

    // Selection
    selectedIds: Set<string>;
    isAllSelected: boolean;
    isSomeSelected: boolean;
    toggleSelect: (id: string) => void;
    toggleSelectAll: () => void;
    clearSelection: () => void;

    // Search
    searchTerm: string;
    setSearchTerm: (term: string) => void;

    // Params for API call
    getParams: () => PaginationParams & FilterParams;
}

/**
 * Hook for managing table state (pagination, sorting, filtering, selection)
 */
export function useTable<T extends { id: string }>(
    options: UseTableOptions<T>
): UseTableReturn<T> {
    const {
        data,
        initialPage = PAGINATION.defaultPage,
        initialLimit = PAGINATION.defaultLimit,
        initialSort,
        initialFilters = {},
        serverSide = false,
    } = options;

    // Pagination state
    const [page, setPageState] = useState(initialPage);
    const [limit, setLimitState] = useState(initialLimit);

    // Sort state
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialSort ?? null);

    // Filter state
    const [filters, setFiltersState] = useState<FilterParams>(initialFilters);
    const [searchTerm, setSearchTerm] = useState('');

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Process data (client-side only)
    const processedData = useMemo(() => {
        if (serverSide) return data;

        let result = [...data];

        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter((item) =>
                Object.values(item).some(
                    (value) =>
                        typeof value === 'string' && value.toLowerCase().includes(term)
                )
            );
        }

        // Apply filters
        if (filters.status) {
            result = result.filter((item) => (item as Record<string, unknown>).status === filters.status);
        }

        // Apply sorting
        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = (a as Record<string, unknown>)[sortConfig.field];
                const bValue = (b as Record<string, unknown>)[sortConfig.field];

                if (aValue === bValue) return 0;
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                const comparison = aValue < bValue ? -1 : 1;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [data, searchTerm, filters, sortConfig, serverSide]);

    // Calculate pagination
    const totalItems = serverSide ? data.length : processedData.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get display data (paginated)
    const displayData = useMemo(() => {
        if (serverSide) return data;

        const start = (page - 1) * limit;
        const end = start + limit;
        return processedData.slice(start, end);
    }, [data, processedData, page, limit, serverSide]);

    // Pagination actions
    const setPage = useCallback((newPage: number) => {
        setPageState(Math.max(1, Math.min(newPage, totalPages)));
    }, [totalPages]);

    const setLimit = useCallback((newLimit: number) => {
        setLimitState(newLimit);
        setPageState(1);
    }, []);

    const nextPage = useCallback(() => {
        if (hasNext) setPageState((p) => p + 1);
    }, [hasNext]);

    const prevPage = useCallback(() => {
        if (hasPrev) setPageState((p) => p - 1);
    }, [hasPrev]);

    // Sort actions
    const toggleSort = useCallback((field: string) => {
        setSortConfig((prev) => {
            if (!prev || prev.field !== field) {
                return { field, direction: 'asc' };
            }
            if (prev.direction === 'asc') {
                return { field, direction: 'desc' };
            }
            return null;
        });
    }, []);

    // Filter actions
    const setFilters = useCallback((newFilters: FilterParams) => {
        setFiltersState(newFilters);
        setPageState(1);
    }, []);

    const setFilter = useCallback((key: string, value: string | undefined) => {
        setFiltersState((prev) => {
            const next = { ...prev };
            if (value === undefined) {
                delete next[key as keyof FilterParams];
            } else {
                (next as Record<string, string>)[key] = value;
            }
            return next;
        });
        setPageState(1);
    }, []);

    const clearFilters = useCallback(() => {
        setFiltersState({});
        setSearchTerm('');
        setPageState(1);
    }, []);

    // Selection actions
    const isAllSelected = useMemo(
        () => displayData.length > 0 && displayData.every((item) => selectedIds.has(item.id)),
        [displayData, selectedIds]
    );

    const isSomeSelected = useMemo(
        () => displayData.some((item) => selectedIds.has(item.id)),
        [displayData, selectedIds]
    );

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(displayData.map((item) => item.id)));
        }
    }, [isAllSelected, displayData]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // Get params for API call
    const getParams = useCallback((): PaginationParams & FilterParams => {
        return {
            page,
            limit,
            sortBy: sortConfig?.field,
            sortOrder: sortConfig?.direction,
            search: searchTerm || undefined,
            ...filters,
        };
    }, [page, limit, sortConfig, searchTerm, filters]);

    return {
        displayData,
        totalItems,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
        setPage,
        setLimit,
        nextPage,
        prevPage,
        sortConfig,
        setSortConfig,
        toggleSort,
        filters,
        setFilters,
        setFilter,
        clearFilters,
        selectedIds,
        isAllSelected,
        isSomeSelected,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        searchTerm,
        setSearchTerm,
        getParams,
    };
}

export type { UseTableOptions, UseTableReturn };
