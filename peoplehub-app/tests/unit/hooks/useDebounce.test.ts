// @ai:ag - Created by Antigravity
// Unit tests for useDebounce hook

import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '@/hooks/useDebounce';

describe('useDebounce Hook', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('useDebounce value', () => {
        it('should return initial value immediately', () => {
            const { result } = renderHook(() => useDebounce('initial', 500));
            expect(result.current).toBe('initial');
        });

        it('should debounce value changes', async () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebounce(value, 500),
                { initialProps: { value: 'initial' } }
            );

            expect(result.current).toBe('initial');

            // Update value
            rerender({ value: 'updated' });

            // Should still be initial immediately
            expect(result.current).toBe('initial');

            // Fast forward time
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Now should be updated
            expect(result.current).toBe('updated');
        });

        it('should reset timer on rapid changes', () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebounce(value, 500),
                { initialProps: { value: 'initial' } }
            );

            // Rapid updates
            rerender({ value: 'update1' });
            act(() => { jest.advanceTimersByTime(200); });

            rerender({ value: 'update2' });
            act(() => { jest.advanceTimersByTime(200); });

            rerender({ value: 'update3' });

            // Should still be initial
            expect(result.current).toBe('initial');

            // Fast forward full delay
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Should be last update
            expect(result.current).toBe('update3');
        });
    });

    describe('useDebouncedCallback', () => {
        it('should debounce callback execution', () => {
            const callback = jest.fn();
            const { result } = renderHook(() => useDebouncedCallback(callback, 500));

            // Call multiple times
            act(() => {
                result.current();
                result.current();
                result.current();
            });

            // Callback should not be called yet
            expect(callback).not.toHaveBeenCalled();

            // Fast forward
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Callback should be called once
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should pass arguments to callback', () => {
            const callback = jest.fn();
            const { result } = renderHook(() => useDebouncedCallback(callback, 500));

            act(() => {
                result.current('arg1', 'arg2');
            });

            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
        });
    });
});
