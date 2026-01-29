'use client';

import { useEffect, useState } from 'react';

export function usePWA() {
    const [isInstalled, setIsInstalled] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Check if PWA is supported
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            setIsSupported(true);

            // Check if already installed
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsInstalled(true);
            }

            // Listen for beforeinstallprompt
            const handleBeforeInstallPrompt = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

            // Listen for appinstalled
            const handleAppInstalled = () => {
                setIsInstalled(true);
                setDeferredPrompt(null);
            };

            window.addEventListener('appinstalled', handleAppInstalled);

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
                window.removeEventListener('appinstalled', handleAppInstalled);
            };
        }
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) {
            return false;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            return true;
        }

        return false;
    };

    return {
        isInstalled,
        isSupported,
        canInstall: !!deferredPrompt,
        promptInstall,
    };
}

// Service Worker registration utility
export function registerServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('ServiceWorker registered:', registration.scope);

                    // Check for updates periodically
                    setInterval(() => {
                        registration.update();
                    }, 60000); // Check every minute

                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;

                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New service worker is ready
                                    console.log('New service worker available');

                                    // Optionally notify user about update
                                    if (confirm('New version available! Reload to update?')) {
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                        window.location.reload();
                                    }
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error('ServiceWorker registration failed:', error);
                });

            // Handle controller change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        });
    }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission;
    }

    return Notification.permission;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
    try {
        const registration = await navigator.serviceWorker.ready;

        const applicationServerKey = urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        );
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });

        // Send subscription to server
        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription),
        });

        return subscription;
    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        throw error;
    }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
