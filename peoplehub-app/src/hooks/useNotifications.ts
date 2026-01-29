// @ai:ag - Created by Antigravity
// Notifications hook

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Notification, NotificationSummary } from '@/types';

interface UseNotificationsOptions {
    autoFetch?: boolean;
    pollingInterval?: number; // ms
}

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    summary: NotificationSummary | null;
    isLoading: boolean;
    error: string | null;
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<boolean>;
    markAllAsRead: () => Promise<boolean>;
    deleteNotification: (notificationId: string) => Promise<boolean>;
}

/**
 * Hook to manage notifications
 */
export function useNotifications(
    options: UseNotificationsOptions = {}
): UseNotificationsReturn {
    const { autoFetch = true, pollingInterval } = options;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [summary, setSummary] = useState<NotificationSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const unreadCount = summary?.unread ?? 0;

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/notifications');
            const data = await response.json();

            if (data.success) {
                setNotifications(data.data.notifications || []);
                setSummary(data.data.summary || null);
            } else {
                setError(data.message || 'Failed to fetch notifications');
            }
        } catch (err) {
            setError('Failed to fetch notifications');
            console.error('Error fetching notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const markAsRead = useCallback(
        async (notificationId: string): Promise<boolean> => {
            try {
                const response = await fetch(`/api/notifications/${notificationId}/read`, {
                    method: 'POST',
                });

                const data = await response.json();

                if (data.success) {
                    setNotifications((prev) =>
                        prev.map((n) =>
                            n.id === notificationId
                                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                                : n
                        )
                    );
                    setSummary((prev) =>
                        prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null
                    );
                    return true;
                }
                return false;
            } catch (err) {
                console.error('Error marking notification as read:', err);
                return false;
            }
        },
        []
    );

    const markAllAsRead = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
                );
                setSummary((prev) => (prev ? { ...prev, unread: 0 } : null));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error marking all as read:', err);
            return false;
        }
    }, []);

    const deleteNotification = useCallback(
        async (notificationId: string): Promise<boolean> => {
            try {
                const response = await fetch(`/api/notifications/${notificationId}`, {
                    method: 'DELETE',
                });

                const data = await response.json();

                if (data.success) {
                    const deleted = notifications.find((n) => n.id === notificationId);
                    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
                    if (deleted && !deleted.isRead) {
                        setSummary((prev) =>
                            prev
                                ? {
                                    ...prev,
                                    total: prev.total - 1,
                                    unread: Math.max(0, prev.unread - 1),
                                }
                                : null
                        );
                    }
                    return true;
                }
                return false;
            } catch (err) {
                console.error('Error deleting notification:', err);
                return false;
            }
        },
        [notifications]
    );

    // Auto fetch on mount
    useEffect(() => {
        if (autoFetch) {
            fetchNotifications();
        }
    }, [autoFetch, fetchNotifications]);

    // Polling for new notifications
    useEffect(() => {
        if (!pollingInterval) return;

        const interval = setInterval(fetchNotifications, pollingInterval);
        return () => clearInterval(interval);
    }, [pollingInterval, fetchNotifications]);

    return {
        notifications,
        unreadCount,
        summary,
        isLoading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    };
}

export type { UseNotificationsReturn };
