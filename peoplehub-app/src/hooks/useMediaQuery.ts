// @ai:ag - Created by Antigravity
// Media query hook for responsive design

'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { BREAKPOINTS } from '@/constants';

type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Hook to detect if a media query matches
 * Uses useSyncExternalStore for safe SSR hydration
 */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (callback: () => void) => {
            const mediaQuery = window.matchMedia(query);
            mediaQuery.addEventListener('change', callback);
            return () => mediaQuery.removeEventListener('change', callback);
        },
        [query]
    );

    const getSnapshot = useCallback(() => {
        return window.matchMedia(query).matches;
    }, [query]);

    const getServerSnapshot = useCallback(() => {
        // Default to false on server
        return false;
    }, []);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Hook to check if screen is mobile size
 */
export function useIsMobile(): boolean {
    return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

/**
 * Hook to check if screen is tablet size
 */
export function useIsTablet(): boolean {
    return useMediaQuery(
        `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
    );
}

/**
 * Hook to check if screen is desktop size
 */
export function useIsDesktop(): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

/**
 * Hook to get current breakpoint
 */
export function useBreakpoint(): BreakpointKey | 'xs' {
    const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
    const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
    const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
    const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
    const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS['2xl']}px)`);

    if (is2xl) return '2xl';
    if (isXl) return 'xl';
    if (isLg) return 'lg';
    if (isMd) return 'md';
    if (isSm) return 'sm';
    return 'xs';
}

/**
 * Hook to check if screen matches minimum width
 */
export function useMinWidth(breakpoint: BreakpointKey): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

/**
 * Hook to check if screen matches maximum width
 */
export function useMaxWidth(breakpoint: BreakpointKey): boolean {
    return useMediaQuery(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`);
}

/**
 * Hook to detect if user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
    return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
}
