// @ai:ag - Created by Antigravity
// Announcements hook for managing company announcements

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Announcement,
    AnnouncementListSummary,
    ApiResponse,
    PaginatedResponse,
} from '@/types';
import { API_ROUTES } from '@/constants';
import { getErrorMessage } from '@/utils';

interface UseAnnouncementsReturn {
    // Data
    announcements: Announcement[];
    pinnedAnnouncements: Announcement[];
    summary: AnnouncementListSummary | null;
    unreadCount: number;

    // Pagination
    page: number;
    totalPages: number;

    // State
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchAnnouncements: (page?: number) => Promise<void>;
    fetchPinned: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    dismissAnnouncement: (id: string) => void;
    refresh: () => Promise<void>;
}

/**
 * Hook for managing company announcements
 */
export function useAnnouncements(autoFetch = true): UseAnnouncementsReturn {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [pinnedAnnouncements, setPinnedAnnouncements] = useState<Announcement[]>([]);
    const [summary, setSummary] = useState<AnnouncementListSummary | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    // Fetch announcements
    const fetchAnnouncements = useCallback(async (pageNum = 1) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_ROUTES.ANNOUNCEMENTS.LIST}?page=${pageNum}`);
            const data: ApiResponse<PaginatedResponse<Announcement>> = await response.json();

            if (data.success && data.data) {
                // Filter out dismissed announcements
                const filtered = data.data.data.filter(a => !dismissedIds.has(a.id));
                setAnnouncements(filtered);
                setPage(data.data.pagination.page);
                setTotalPages(data.data.pagination.totalPages);
            } else {
                setError(data.error?.message || 'Gagal memuat pengumuman');
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Terjadi kesalahan saat memuat pengumuman'));
            console.error('fetchAnnouncements error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [dismissedIds]);

    // Fetch pinned announcements
    const fetchPinned = useCallback(async () => {
        try {
            const response = await fetch(API_ROUTES.ANNOUNCEMENTS.PINNED);
            const data: ApiResponse<Announcement[]> = await response.json();

            if (data.success && data.data) {
                const filtered = data.data.filter(a => !dismissedIds.has(a.id));
                setPinnedAnnouncements(filtered);
            }
        } catch (err) {
            console.error('fetchPinned error:', err);
        }
    }, [dismissedIds]);

    // Fetch summary (for unread count)
    const fetchSummary = useCallback(async () => {
        try {
            const response = await fetch(API_ROUTES.ANNOUNCEMENTS.SUMMARY);
            const data: ApiResponse<AnnouncementListSummary> = await response.json();

            if (data.success && data.data) {
                setSummary(data.data);
                setUnreadCount(data.data.unreadCount);
            }
        } catch (err) {
            console.error('fetchSummary error:', err);
        }
    }, []);

    // Mark announcement as read
    const markAsRead = useCallback(async (id: string) => {
        try {
            await fetch(`${API_ROUTES.ANNOUNCEMENTS.LIST}/${id}/read`, {
                method: 'POST',
            });

            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('markAsRead error:', err);
        }
    }, []);

    // Dismiss announcement (hides locally)
    const dismissAnnouncement = useCallback((id: string) => {
        setDismissedIds(prev => new Set(prev).add(id));
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        setPinnedAnnouncements(prev => prev.filter(a => a.id !== id));
    }, []);

    // Refresh all data
    const refresh = useCallback(async () => {
        await Promise.all([
            fetchAnnouncements(page),
            fetchPinned(),
            fetchSummary(),
        ]);
    }, [fetchAnnouncements, fetchPinned, fetchSummary, page]);

    // Auto fetch on mount
    useEffect(() => {
        if (autoFetch) {
            refresh();
        }
    }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        announcements,
        pinnedAnnouncements,
        summary,
        unreadCount,
        page,
        totalPages,
        isLoading,
        error,
        fetchAnnouncements,
        fetchPinned,
        markAsRead,
        dismissAnnouncement,
        refresh,
    };
}

export type { UseAnnouncementsReturn };
