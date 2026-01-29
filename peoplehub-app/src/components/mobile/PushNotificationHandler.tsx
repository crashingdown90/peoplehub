'use client';

import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function PushNotificationHandler() {
    const { toast } = useToast();

    useEffect(() => {
        // Check if Push API is supported
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        // Request permission if not granted
        if (Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            });
        }
    }, []);

    const showNotification = (title: string, options?: NotificationOptions) => {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/icon-192x192.png',
                badge: '/icon-72x72.png',
                ...options,
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    new Notification(title, {
                        icon: '/icon-192x192.png',
                        badge: '/icon-72x72.png',
                        ...options,
                    });
                }
            });
        }
    };

    // Example usage - can be called from other components
    useEffect(() => {
        // Listen for custom events
        const handleNotification = (event: CustomEvent) => {
            const { title, body, data } = event.detail;

            showNotification(title, {
                body,
                tag: data?.tag || 'default',
                requireInteraction: data?.requireInteraction || false,
            });

            // Also show in-app toast
            toast({
                title,
                description: body,
            });
        };

        window.addEventListener('show-notification' as any, handleNotification);

        return () => {
            window.removeEventListener('show-notification' as any, handleNotification);
        };
    }, [toast]);

    return null; // This component doesn't render anything
}

// Helper function to trigger notifications
export function triggerNotification(title: string, body: string, data?: any) {
    const event = new CustomEvent('show-notification', {
        detail: { title, body, data },
    });
    window.dispatchEvent(event);
}
