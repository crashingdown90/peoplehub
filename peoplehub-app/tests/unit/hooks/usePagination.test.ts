// @ai:ag - Created by Antigravity
// Unit tests for usePagination hook

import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination Hook', () => {
    it('should initialize with default values', () => {
        const { result } = renderHook(() => usePagination());

        expect(result.current.page).toBe(1);
        expect(result.current.limit).toBe(10);
        expect(result.current.totalPages).toBe(1);
    });

    it('should initialize with custom values', () => {
        const { result } = renderHook(() => usePagination({
            initialPage: 3,
            initialLimit: 25,
            totalItems: 100,
        }));

        expect(result.current.page).toBe(3);
        expect(result.current.limit).toBe(25);
        expect(result.current.totalPages).toBe(4);
    });

    it('should navigate to next page', () => {
        const { result } = renderHook(() => usePagination({
            totalItems: 100,
        }));

        act(() => {
            result.current.nextPage();
        });

        expect(result.current.page).toBe(2);
    });

    it('should not go past last page', () => {
        const { result } = renderHook(() => usePagination({
            initialPage: 10,
            totalItems: 100,
        }));

        act(() => {
            result.current.nextPage();
        });

        expect(result.current.page).toBe(10);
    });

    it('should navigate to previous page', () => {
        const { result } = renderHook(() => usePagination({
            initialPage: 5,
            totalItems: 100,
        }));

        act(() => {
            result.current.prevPage();
        });

        expect(result.current.page).toBe(4);
    });

    it('should not go before first page', () => {
        const { result } = renderHook(() => usePagination());

        act(() => {
            result.current.prevPage();
        });

        expect(result.current.page).toBe(1);
    });

    it('should set specific page', () => {
        const { result } = renderHook(() => usePagination({
            totalItems: 100,
        }));

        act(() => {
            result.current.setPage(5);
        });

        expect(result.current.page).toBe(5);
    });

    it('should change limit and reset to page 1', () => {
        const { result } = renderHook(() => usePagination({
            initialPage: 5,
            totalItems: 100,
        }));

        act(() => {
            result.current.setLimit(25);
        });

        expect(result.current.limit).toBe(25);
        expect(result.current.page).toBe(1);
    });

    it('should calculate correct totalPages', () => {
        const { result } = renderHook(() => usePagination({
            initialLimit: 10,
            totalItems: 45,
        }));

        expect(result.current.totalPages).toBe(5);
    });

    it('should update totalItems dynamically', () => {
        const { result } = renderHook(() => usePagination({
            initialLimit: 10,
        }));

        act(() => {
            result.current.setTotalItems(100);
        });

        expect(result.current.totalPages).toBe(10);
    });

    it('should indicate hasNext and hasPrev correctly', () => {
        const { result } = renderHook(() => usePagination({
            totalItems: 30,
        }));

        expect(result.current.hasNext).toBe(true);
        expect(result.current.hasPrev).toBe(false);

        act(() => {
            result.current.setPage(2);
        });

        expect(result.current.hasNext).toBe(true);
        expect(result.current.hasPrev).toBe(true);

        act(() => {
            result.current.setPage(3);
        });

        expect(result.current.hasNext).toBe(false);
        expect(result.current.hasPrev).toBe(true);
    });
});
