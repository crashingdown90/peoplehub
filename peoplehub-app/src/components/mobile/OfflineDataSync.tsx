'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CacheStatus {
    isAvailable: boolean;
    cacheSize: number;
    cachedPages: string[];
}

export function OfflineDataSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
        isAvailable: false,
        cacheSize: 0,
        cachedPages: [],
    });
    const [syncQueue, setSyncQueue] = useState<number>(0);

    useEffect(() => {
        // Check online status
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check cache status
        if ('caches' in window) {
            checkCacheStatus();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const checkCacheStatus = async () => {
        try {
            const cacheNames = await caches.keys();
            const cachedPages: string[] = [];

            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                requests.forEach((req) => cachedPages.push(req.url));
            }

            setCacheStatus({
                isAvailable: cacheNames.length > 0,
                cacheSize: cachedPages.length,
                cachedPages,
            });
        } catch (error) {
            console.error('Error checking cache:', error);
        }
    };

    const handleSync = () => {
        // Trigger background sync
        if ('serviceWorker' in navigator && 'sync' in ServiceWorker.prototype) {
            navigator.serviceWorker.ready.then((registration) => {
                return (registration as any).sync.register('sync-data');
            });
        }
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Connection Status */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isOnline ? (
                                <Wifi className="h-5 w-5 text-green-600" />
                            ) : (
                                <WifiOff className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                                <p className="font-semibold">
                                    {isOnline ? 'Online' : 'Offline'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isOnline ? 'Connected to network' : 'Working offline'}
                                </p>
                            </div>
                        </div>
                        <Badge variant={isOnline ? 'default' : 'secondary'}>
                            {isOnline ? 'Connected' : 'Offline Mode'}
                        </Badge>
                    </div>

                    {/* Cache Status */}
                    {cacheStatus.isAvailable && (
                        <div className="pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Offline Data</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Cached pages:</span>
                                    <span className="font-medium">{cacheStatus.cacheSize}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Pending sync:</span>
                                    <span className="font-medium">{syncQueue} items</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sync Button */}
                    {!isOnline && syncQueue > 0 && (
                        <Button onClick={handleSync} disabled={isOnline} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Sync When Online
                        </Button>
                    )}

                    {isOnline && syncQueue > 0 && (
                        <Button onClick={handleSync} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Sync Now
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
